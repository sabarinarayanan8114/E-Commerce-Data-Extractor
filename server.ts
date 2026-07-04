import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import cron from "node-cron";
import { getProducts, saveProduct, deleteProduct, getLogs } from "./src/db";
import { sendPriceAlertEmail } from "./src/mailer";
import { TrackedProduct } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Clean HTML to strip script, style, svg, and comment tags
function cleanHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30000); // Keep substantial page text for extraction
}

// Global extraction helper using Gemini v3.5 Flash
async function runExtraction(htmlContent: string, customFields: any[]): Promise<any> {
  const cleaned = cleanHtml(htmlContent);

  // Build the dynamic response schema
  const additionalProperties: Record<string, any> = {};
  if (customFields && Array.isArray(customFields)) {
    for (const field of customFields) {
      if (field.enabled) {
        additionalProperties[field.key] = {
          type: field.type === 'NUMBER' ? Type.NUMBER : (field.type === 'BOOLEAN' ? Type.BOOLEAN : Type.STRING),
          description: field.description
        };
      }
    }
  }

  // Prepare Schema
  const responseSchema: any = {
    type: Type.OBJECT,
    properties: {
      productTitle: {
        type: Type.STRING,
        description: "The complete title or name of the product. Clean and well-formatted."
      },
      currentPrice: {
        type: Type.NUMBER,
        description: "The current selling price of the product as a float (e.g. 49.99), excluding all currency symbols, commas, or formatting. Set to null if the price is not found."
      },
      currencyCode: {
        type: Type.STRING,
        description: "The 3-letter currency code (e.g. USD, INR, GBP, EUR) for the product price. Set to null if the currency is not found."
      }
    },
    required: ["productTitle"]
  };

  if (Object.keys(additionalProperties).length > 0) {
    responseSchema.properties.additionalFields = {
      type: Type.OBJECT,
      properties: additionalProperties,
      description: "Additional requested fields extracted from the page."
    };
  }

  const systemInstruction = "You are an expert E-commerce Data Extraction Specialist.\n" +
    "Analyze the HTML content of a product page and extract the product details exactly as defined in the response schema.\n" +
    "If the price is not found, set currentPrice to null. If the currency is not found, set currencyCode to null.";

  const promptText = `Analyze the following cleaned e-commerce HTML content and extract the product information:

HTML Content:
${cleaned}

Ensure all values strictly match the schema descriptions.`;

  // Call Gemini API
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: promptText,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.1 // Low temperature for high precision data extraction
    }
  });

  const jsonText = response.text || "{}";
  return JSON.parse(jsonText);
}

// ==========================================
// NEW ROUTE: Proxy Web Scraper via Server Backend
// ==========================================
app.post("/api/fetch-url", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: "URL handles required parameters." });
    }

    console.log(`[Scraper] Request received to fetch URL: ${url}`);

    // Bypassing automated filters with proper header mimicking
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "max-age=0"
      }
    });

    if (!response.ok) {
      throw new Error(`Target e-commerce site blocked or returned status: ${response.status}`);
    }

    const htmlContent = await response.text();
    console.log(`[Scraper] Successfully loaded source payload bytes: ${htmlContent.length}`);

    res.json({
      success: true,
      htmlContent: htmlContent
    });

  } catch (error: any) {
    console.error("[Scraper API Error]:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch content from the target URL."
    });
  }
});

// API Route for extraction
app.post("/api/extract", async (req, res) => {
  try {
    const { htmlContent, customFields } = req.body;

    if (!htmlContent) {
      return res.status(400).json({ error: "No HTML content provided." });
    }

    const parsedData = await runExtraction(htmlContent, customFields || []);

    res.json({
      success: true,
      data: parsedData,
      rawTextLength: htmlContent.length
    });

  } catch (error: any) {
    console.error("Extraction error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during extraction."
    });
  }
});


// API Route for price analysis
app.post("/api/analyze-price", async (req, res) => {
  try {
    const { productTitle, currentPrice, currencyCode, typicalPrice, low30Days } = req.body;

    // Validate completeness of data
    if (!productTitle || currentPrice === undefined || currentPrice === null || !typicalPrice) {
      return res.json({
        success: true,
        data: {
          status: "error",
          reason: "Data is incomplete. Product title, current price, and typical historical price are required to conduct an analysis.",
          current_price: currentPrice || 0.0,
          recommendation: "Wait"
        }
      });
    }

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        status: {
          type: Type.STRING,
          description: "Must be either 'alert', 'no-alert', or 'error'. Trigger 'alert' if currentPrice is at least 5% lower than typicalPrice, or if it is less than or equal to low30Days ('Best Price' in 30 days)."
        },
        reason: {
          type: Type.STRING,
          description: "Clear and detailed explanation. Must state the exact percentage drop and compare the current price with typical price and 30-day low."
        },
        current_price: {
          type: Type.NUMBER,
          description: "The exact current price of the product as a float."
        },
        recommendation: {
          type: Type.STRING,
          description: "Must be either 'Buy' (if status is alert) or 'Wait' (if status is no-alert). If status is error, return 'Wait'."
        }
      },
      required: ["status", "reason", "current_price", "recommendation"]
    };

    const systemInstruction = `You are an expert E-commerce Price Intelligence Analyst. Your task is to monitor product data and determine if a price drop is significant enough to warrant a user alert.

### Your Role:
1. Data Analysis: Receive product title, current price, and historical price data (typical price, 30 days lowest price).
2. Market Analysis: Determine if the current price is a good deal compared to typical pricing.
3. Decision Making: Decide if the price drop is significant (>= 5% drop compared to typical price) or if it's a "Best Price" (less than or equal to 30 days low price).

### Output Constraints:
- Ensure the output strictly conforms to the JSON schema.
- No conversational filler.
- If data is incomplete, set status to "error" and recommendation to "Wait".`;

    const promptText = `Analyze the pricing structure for this product:
Product Title: "${productTitle}"
Current Price: ${currentPrice} ${currencyCode || ""}
Typical Historical Price: ${typicalPrice} ${currencyCode || ""}
30-Day Lowest Price: ${low30Days || 'N/A'} ${currencyCode || ""}

Conduct the market intelligence review. Calculate the price drop percentage. Decide if we trigger an alert and what recommendation to make.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: promptText,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1
      }
    });

    const jsonText = response.text || "{}";
    const parsedData = JSON.parse(jsonText);

    res.json({
      success: true,
      data: parsedData,
      promptUsed: `System Instruction:\n${systemInstruction}\n\nPrompt:\n${promptText}`
    });

  } catch (error: any) {
    console.error("Price intelligence error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An unexpected error occurred during price intelligence review."
    });
  }
});

// --- AUTOMATED TRACKING CRON SYSTEM & DATABASE ENDPOINTS ---

// Tracking Cycle Executable
async function runCronTrackingCycle() {
  const products = getProducts();
  const activeProducts = products.filter(p => p.isActive);
  const results: any[] = [];

  for (const product of activeProducts) {
    try {
      // 1. Extract price via Gemini
      const parsedData = await runExtraction(product.htmlSource, []);
      const currentPrice = parsedData.currentPrice;
      const currencyCode = parsedData.currencyCode || product.currencyCode || "USD";

      if (currentPrice !== null && currentPrice !== undefined) {
        const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) + " PT";
        const newHistory = [...product.history, { timestamp, price: currentPrice }].slice(-20);

        let alertSent = false;
        let alertDetails = null;

        // Trigger alert only if price is <= targetPrice and has changed or first check
        if (currentPrice <= product.targetPrice && (product.lastPrice === null || currentPrice !== product.lastPrice)) {
          alertDetails = await sendPriceAlertEmail(
            product.title,
            currentPrice,
            product.targetPrice,
            currencyCode,
            product.email
          );
          alertSent = true;
        }

        const updatedProduct: TrackedProduct = {
          ...product,
          lastPrice: currentPrice,
          lastChecked: timestamp,
          history: newHistory,
          currencyCode
        };

        saveProduct(updatedProduct);

        results.push({
          id: product.id,
          title: product.title,
          oldPrice: product.lastPrice,
          newPrice: currentPrice,
          targetPrice: product.targetPrice,
          alertSent,
          alertDetails
        });
      } else {
        results.push({
          id: product.id,
          title: product.title,
          error: "Gemini did not find any currentPrice in the HTML source."
        });
      }
    } catch (err: any) {
      console.error(`[CRON Tracker] Failed product "${product.title}":`, err);
      results.push({
        id: product.id,
        title: product.title,
        error: err.message
      });
    }
  }
  return results;
}

// 1. Set up Background cron job - Check prices every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  console.log("[CRON Sched] Launching automated background tracking check...");
  try {
    const runSummary = await runCronTrackingCycle();
    console.log("[CRON Sched] Cycle completed. Results:", runSummary);
  } catch (err) {
    console.error("[CRON Sched] Critical scheduler failure:", err);
  }
});

// 2. REST Endpoints for Tracking Management
app.get("/api/tracked-products", (req, res) => {
  try {
    const products = getProducts();
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/tracked-products", async (req, res) => {
  try {
    const { title, targetPrice, currencyCode, email, htmlSource } = req.body;
    if (!title || !targetPrice || !email || !htmlSource) {
      return res.status(400).json({ success: false, error: "Missing required fields (title, targetPrice, email, htmlSource)." });
    }

    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) + " PT";
    
    // First run extraction on save to set initial price
    let initialPrice = null;
    let extractedCurrency = currencyCode || "USD";
    try {
      const parsed = await runExtraction(htmlSource, []);
      initialPrice = parsed.currentPrice;
      if (parsed.currencyCode) extractedCurrency = parsed.currencyCode;
    } catch (e) {
      console.warn("Initial extraction warn on save:", e);
    }

    const id = "prod_" + Math.random().toString(36).substring(2, 11);
    const newProduct: TrackedProduct = {
      id,
      title,
      targetPrice: Number(targetPrice),
      currencyCode: extractedCurrency,
      email,
      lastPrice: initialPrice,
      lastChecked: timestamp,
      history: initialPrice !== null ? [{ timestamp, price: initialPrice }] : [],
      htmlSource,
      isActive: true
    };

    saveProduct(newProduct);

    // If initial price qualifies for alert on registration, trigger it!
    if (initialPrice !== null && initialPrice <= Number(targetPrice)) {
      await sendPriceAlertEmail(title, initialPrice, Number(targetPrice), extractedCurrency, email);
    }

    res.json({ success: true, product: newProduct });
  } catch (err: any) {
    console.error("Save product error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/tracked-products/toggle", (req, res) => {
  try {
    const { id } = req.body;
    const products = getProducts();
    const product = products.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }
    product.isActive = !product.isActive;
    saveProduct(product);
    res.json({ success: true, product });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete("/api/tracked-products/:id", (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteProduct(id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Simulate random or manually configured Price Drop on demand
app.post("/api/tracked-products/simulate-price", async (req, res) => {
  try {
    const { id, simulatedPrice } = req.body;
    if (!id || simulatedPrice === undefined) {
      return res.status(400).json({ success: false, error: "Missing product ID or simulatedPrice" });
    }

    const products = getProducts();
    const product = products.find(p => p.id === id);
    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    const priceNum = Number(simulatedPrice);
    const timestamp = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" }) + " PT";
    const newHistory = [...product.history, { timestamp, price: priceNum }].slice(-20);

    let alertSent = false;
    let alertDetails = null;

    if (priceNum <= product.targetPrice) {
      alertDetails = await sendPriceAlertEmail(
        product.title,
        priceNum,
        product.targetPrice,
        product.currencyCode,
        product.email
      );
      alertSent = true;
    }

    const updated: TrackedProduct = {
      ...product,
      lastPrice: priceNum,
      lastChecked: timestamp,
      history: newHistory
    };

    saveProduct(updated);

    res.json({ success: true, product: updated, alertSent, alertDetails });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Fetch Alert Sent logs
app.get("/api/alert-logs", (req, res) => {
  try {
    const logs = getLogs();
    res.json({ success: true, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Instantly force tracking cycle evaluation on-demand
app.post("/api/cron/trigger", async (req, res) => {
  try {
    console.log("[CRON Manual] Manually triggering price tracking cycle...");
    const runSummary = await runCronTrackingCycle();
    res.json({ success: true, summary: runSummary });
  } catch (err: any) {
    console.error("[CRON Manual] Failure:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite dev server vs static serving
if (process.env.NODE_ENV !== "production") {
  createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  }).then((vite) => {
    app.use(vite.middlewares);
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Development server running on http://localhost:${PORT}`);
    });
  });
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Production server running on port ${PORT}`);
  });
}
