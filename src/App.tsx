import React, { useState, useEffect } from "react";
import { SAMPLE_PRODUCTS } from "./samples";
import { ProductCard } from "./components/ProductCard";
import { PromptPlayground } from "./components/PromptPlayground";
import { JsonViewer } from "./components/JsonViewer";
import { PriceIntelligence } from "./components/PriceIntelligence";
import { AlertsTracker } from "./components/AlertsTracker";
import { ProductData, ExtractionResult, ExtractionField, TrackedProduct, AlertLog } from "./types";
import { 
  ShoppingBag, Sparkles, Database, Layers, Plus, Trash2, Check, 
  RefreshCw, FileText, History, ExternalLink, TrendingDown, 
  LineChart, HelpCircle, Info, CornerDownRight 
} from "lucide-react";

// Initial fields and standard constants...
const INITIAL_FIELDS: ExtractionField[] = [
  { key: "brand", label: "Brand", description: "The manufacturer or brand of the product.", type: "STRING", enabled: true },
  { key: "rating", label: "Customer Rating", description: "The star rating.", type: "STRING", enabled: true },
  { key: "reviewCount", label: "Reviews Count", description: "Total number of reviews.", type: "STRING", enabled: true },
];

export default function App() {
  const [appMode, setAppMode] = useState<'extractor' | 'analyst' | 'tracker'>('extractor');
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- NEW: Proxy URL Fetcher ---
  const fetchUrlFromProxy = async () => {
    if (!targetUrl.trim()) {
      setErrorMessage("Please enter a valid product URL.");
      return;
    }
    setIsFetchingUrl(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/fetch-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const result = await response.json();
      if (result.success) {
        setHtmlContent(result.htmlContent);
      } else {
        setErrorMessage(result.error || "Failed to fetch URL.");
      }
    } catch (err: any) {
      setErrorMessage("Network error: " + err.message);
    } finally {
      setIsFetchingUrl(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/50 p-8">
      <header className="max-w-7xl mx-auto mb-8">
        <h1 className="text-2xl font-bold">E-Commerce Intelligence Suite</h1>
      </header>

      <main className="max-w-7xl mx-auto bg-white p-6 rounded-2xl border border-neutral-200">
        {/* NEW: URL Fetcher UI */}
        <div className="mb-8 p-6 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" /> Import Data via URL
          </h3>
          <div className="flex gap-3">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="Paste product URL (e.g., https://amazon.in/dp/...)"
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-sm"
            />
            <button
              onClick={fetchUrlFromProxy}
              disabled={isFetchingUrl}
              className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isFetchingUrl ? "Fetching..." : "Fetch & Parse"}
            </button>
          </div>
        </div>

        {/* HTML Input Area */}
        <div className="space-y-4">
          <label className="text-sm font-semibold text-neutral-700">Raw HTML Content</label>
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="w-full h-64 bg-neutral-900 text-neutral-200 font-mono text-xs p-4 rounded-xl"
            placeholder="HTML will appear here after fetching URL..."
          />
        </div>
      </main>
    </div>
  );
}
