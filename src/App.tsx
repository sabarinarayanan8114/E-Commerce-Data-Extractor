import React, { useState } from "react";
import { ExternalLink, RefreshCw, Check, AlertCircle } from "lucide-react";

export default function App() {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
            <span>Fetching product page... please wait a moment.</span>
          </div>
        )}

        {htmlContent && !isFetchingUrl && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 text-xs font-bold rounded-lg flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" /> <span>Data successfully fetched!</span>
            </div>
            <button className="text-indigo-600 hover:underline font-bold mt-1">
              Click here to run AI Extraction →
            </button>
          </div>
        )}

        {/* Hidden Field for Data Storage */}
        <textarea
          value={htmlContent}
          className="hidden"
          readOnly
        />
      </main>
    </div>
  );
}
