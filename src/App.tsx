import React, { useState } from "react";
import { ExternalLink, RefreshCw, Check, AlertCircle, Sparkles } from "lucide-react";

export default function App() {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractionResult, setExtractionResult] = useState<any>(null);

  // 1. Fetch HTML from Proxy
  const fetchUrlFromProxy = async () => {
    if (!targetUrl.trim()) {
      setErrorMessage("Please enter a valid product URL.");
      return;
    }
    setIsFetchingUrl(true);
    setErrorMessage(null);
    setExtractionResult(null); // Reset previous result
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

  // 2. Run AI Extraction
  const handleExtraction = async () => {
    setIsExtracting(true);
    setErrorMessage(null);
    try {
      const response = await fetch("/api/extract-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlContent }),
      });
      const data = await response.json();
      setExtractionResult(data);
    } catch (error) {
      setErrorMessage("Extraction failed. Please try again.");
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-4 md:p-8">
      <header className="max-w-4xl mx-auto mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">E-Commerce Intelligence Suite</h1>
        <p className="text-sm text-neutral-500">Fetch product data and analyze pricing in real-time.</p>
      </header>

      <main className="max-w-4xl mx-auto bg-white p-6 md:p-8 rounded-2xl border border-neutral-200 shadow-sm">
        {/* Fetcher Section */}
        <div className="space-y-4">
          <label className="text-sm font-bold text-neutral-700">Enter Product URL</label>
          <div className="flex gap-3">
            <input
              type="text"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://amazon.in/dp/..."
              className="flex-1 px-4 py-2 border border-neutral-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              onClick={fetchUrlFromProxy}
              disabled={isFetchingUrl}
              className="px-6 py-2 bg-neutral-900 text-white text-sm font-bold rounded-lg hover:bg-neutral-800 disabled:opacity-50 transition-colors"
            >
              {isFetchingUrl ? "Fetching..." : "Fetch Data"}
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {errorMessage}
          </div>
        )}

        {isFetchingUrl && (
          <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Fetching product page... please wait.</span>
          </div>
        )}

        {htmlContent && !isFetchingUrl && !extractionResult && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 text-xs font-bold rounded-lg flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" /> <span>Data successfully fetched!</span>
            </div>
            <button 
              onClick={handleExtraction}
              disabled={isExtracting}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              {isExtracting ? "Extracting with AI..." : "Run AI Extraction"}
            </button>
          </div>
        )}

        {/* Extraction Results */}
        {extractionResult && (
          <div className="mt-8 p-6 bg-neutral-900 rounded-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" /> Extraction Results
            </h3>
            <pre className="text-xs text-green-400 font-mono overflow-x-auto">
              {JSON.stringify(extractionResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Hidden Field */}
        <textarea value={htmlContent} className="hidden" readOnly />
      </main>
    </div>
  );
}
