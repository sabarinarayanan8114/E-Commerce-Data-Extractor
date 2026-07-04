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
// DEBUG: Confirm API Key load status
console.log("API Key loaded status:", !!process.env.GEMINI_API_KEY);

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
    .slice(0, 100000); // Increased limit to ensure better extraction
}

// Global extraction helper using Gemini v3.5 Flash
async function runExtraction(htmlContent: string, customFields: any[]): Promise<any> {
  try {
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

    const responseSchema: any = {
      type: Type.OBJECT,
      properties: {
        productTitle: { type: Type.STRING, description: "The complete title of the product." },
        currentPrice: { type: Type.NUMBER, description: "Current price as float, no currency symbols." },
        currencyCode: { type: Type.STRING, description: "3-letter currency code." }
      },
      required: ["productTitle"]
    };

    if (Object.keys(additionalProperties).length > 0) {
      responseSchema.properties.additionalFields = { type: Type.OBJECT, properties: additionalProperties };
    }

    const systemInstruction = "You are an expert E-commerce Data Extraction Specialist.";
    const promptText = `Analyze the following cleaned e-commerce HTML content and extract product information:\n${cleaned}`;

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
    return JSON.parse(jsonText);
  } catch (error: any) {
    console.error("[Extraction Error Details]:", error.message);
    throw error;
  }
}

// ... (Rest of the code paths stay the same as your original file) ...
// Ensure you keep your existing API routes (/api/fetch-url, etc.) below this line exactly as they were.
