import React, { useState, useEffect } from "react";
import { PriceAnalysisResult, PriceAnalysisData } from "../types";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertOctagon, 
  Sparkles, 
  HelpCircle, 
  CheckCircle, 
  Clock, 
  Terminal, 
  ArrowRight, 
  ShieldAlert, 
  RefreshCw, 
  CornerDownRight,
  Database,
  Info
} from "lucide-react";
import { JsonViewer } from "./JsonViewer";

interface PriceIntelligenceProps {
  onAnalyzeComplete: (result: PriceAnalysisResult) => void;
  extractedTitle?: string;
  extractedPrice?: number | null;
  extractedCurrency?: string | null;
}

export const PriceIntelligence: React.FC<PriceIntelligenceProps> = ({
  extractedTitle = "",
  extractedPrice = null,
  extractedCurrency = "USD"
}) => {
  // Input states
  const [title, setTitle] = useState(extractedTitle || "Echo Dot (5th Gen) with Clock");
  const [currentPrice, setCurrentPrice] = useState<string>(extractedPrice?.toString() || "49.99");
  const [currency, setCurrency] = useState(extractedCurrency || "USD");
  const [typicalPrice, setTypicalPrice] = useState<string>("59.99");
  const [low30Days, setLow30Days] = useState<string>("45.00");

  // Analysis result states
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PriceAnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showJson, setShowJson] = useState(false);

  // Auto-sync inputs whenever extracted props change
  useEffect(() => {
    if (extractedTitle) {
      setTitle(extractedTitle);
    }
    if (extractedPrice !== null && extractedPrice !== undefined) {
      setCurrentPrice(extractedPrice.toString());
      // Suggest automatic historical parameters based on current price
      const priceNum = Number(extractedPrice);
      if (!isNaN(priceNum)) {
        setTypicalPrice((priceNum * 1.2).toFixed(2));
        setLow30Days((priceNum * 0.95).toFixed(2));
      }
    }
    if (extractedCurrency) {
      setCurrency(extractedCurrency);
    }
  }, [extractedTitle, extractedPrice, extractedCurrency]);

  // Sync with extracted data button
  const handleSyncExtracted = () => {
    if (extractedTitle) {
      setTitle(extractedTitle);
    }
    if (extractedPrice !== null) {
      setCurrentPrice(extractedPrice.toString());
      // Suggest automatic historical parameters based on current price
      const priceNum = Number(extractedPrice);
      if (!isNaN(priceNum)) {
        setTypicalPrice((priceNum * 1.2).toFixed(2));
        setLow30Days((priceNum * 0.95).toFixed(2));
      }
    }
    if (extractedCurrency) {
      setCurrency(extractedCurrency);
    }
  };

  // Run presets to let users quickly see different model outcomes
  const applyPreset = (type: 'sig-drop' | 'no-drop' | 'best-price' | 'incomplete') => {
    setErrorMessage(null);
    if (type === 'sig-drop') {
      setTitle("boAt Rockerz 255 Pro+ Bluetooth Neckband");
      setCurrentPrice("1299.00");
      setCurrency("INR");
      setTypicalPrice("3990.00"); // Extreme drop (~67% drop)
      setLow35Days("1499.00");
    } else if (type === 'no-drop') {
      setTitle("Kindle Paperwhite (16 GB) - UK Store");
      setCurrentPrice("143.99");
      setCurrency("GBP");
      setTypicalPrice("149.99"); // ~4% drop (less than 5% threshold)
      setLow30Days("135.00");
    } else if (type === 'best-price') {
      setTitle("Echo Dot (5th Gen, 2022 release)");
      setCurrentPrice("39.99");
      setCurrency("USD");
      setTypicalPrice("49.99"); // 20% drop
      setLow30Days("42.00"); // Current is lower than 30-day low! (Best price!)
    } else if (type === 'incomplete') {
      setTitle(""); // Empty title triggers error
      setCurrentPrice("");
      setTypicalPrice("");
    }
  };

  // Helper setter for 30 day low
  const setLow35Days = (val: string) => {
    setLow30Days(val);
  };

  // Format currency nicely
  const formatValue = (val: number, code: string) => {
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code
      }).format(val);
    } catch {
      return `${code} ${val}`;
    }
  };

  // Handle analysis form submission
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    const priceNum = parseFloat(currentPrice);
    const typicalNum = parseFloat(typicalPrice);
    const lowNum = parseFloat(low30Days);

    try {
      const response = await fetch("/api/analyze-price", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productTitle: title,
          currentPrice: isNaN(priceNum) ? null : priceNum,
          currencyCode: currency,
          typicalPrice: isNaN(typicalNum) ? null : typicalNum,
          low30Days: isNaN(lowNum) ? null : lowNum
        }),
      });

      if (!response.ok) {
        throw new Error(`Server status: ${response.statusText}`);
      }

      const resJson = await response.json();

      if (resJson.success) {
        const resultObj: PriceAnalysisResult = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          productTitle: title,
          currentPrice: priceNum,
          currencyCode: currency,
          typicalPrice: typicalNum,
          low30Days: isNaN(lowNum) ? null : lowNum,
          analysis: resJson.data,
          prompt: resJson.promptUsed,
          success: resJson.data?.status !== "error",
          error: resJson.data?.status === "error" ? resJson.data.reason : null
        };
        setResult(resultObj);
      } else {
        throw new Error(resJson.error || "Failed to analyze price drop.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An unexpected network error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getPercentageDrop = () => {
    const p = parseFloat(currentPrice);
    const t = parseFloat(typicalPrice);
    if (!isNaN(p) && !isNaN(t) && t > 0) {
      const drop = ((t - p) / t) * 100;
      return drop.toFixed(1);
    }
    return null;
  };

  const dropPct = getPercentageDrop();

  return (
    <div id="price-intelligence-panel" className="grid grid-cols-1 md:grid-cols-12 gap-8">
      {/* Left inputs column (Takes 6 cols) */}
      <div className="md:col-span-6 space-y-6">
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm/5 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
            <div className="flex items-center space-x-2">
              <TrendingDown className="h-4.5 w-4.5 text-indigo-600" />
              <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Intelligence Analyzer Configuration</h2>
            </div>
            {extractedTitle && (
              <button
                onClick={handleSyncExtracted}
                className="text-[11px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all animate-pulse hover:animate-none"
                title="Populate using current values from HTML extractor"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Sync Extracted Data</span>
              </button>
            )}
          </div>

          {/* Quick presets row */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Analysis Presets</span>
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={() => applyPreset('sig-drop')}
                className="px-2 py-1.5 rounded-lg border border-neutral-200 text-[10px] font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 text-center transition-colors"
              >
                Significant Drop
              </button>
              <button
                onClick={() => applyPreset('no-drop')}
                className="px-2 py-1.5 rounded-lg border border-neutral-200 text-[10px] font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 text-center transition-colors"
              >
                No Alert Drop
              </button>
              <button
                onClick={() => applyPreset('best-price')}
                className="px-2 py-1.5 rounded-lg border border-neutral-200 text-[10px] font-semibold text-neutral-700 bg-neutral-50 hover:bg-neutral-100 text-center transition-colors"
              >
                Best Price
              </button>
              <button
                onClick={() => applyPreset('incomplete')}
                className="px-2 py-1.5 rounded-lg border border-rose-200 text-[10px] font-semibold text-rose-700 bg-rose-50/50 hover:bg-rose-50 text-center transition-colors"
              >
                Missing Data
              </button>
            </div>
          </div>

          {/* Form Inputs */}
          <div className="space-y-3.5 pt-2">
            <div>
              <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Product Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Product name..."
                className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Current Price</label>
                <input
                  type="number"
                  step="any"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  placeholder="e.g. 49.99"
                  className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Currency Code</label>
                <input
                  type="text"
                  maxLength={3}
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                  placeholder="e.g. USD"
                  className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Typical Price</label>
                <input
                  type="number"
                  step="any"
                  value={typicalPrice}
                  onChange={(e) => setTypicalPrice(e.target.value)}
                  placeholder="e.g. 59.99"
                  className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">30-Day Lowest Price</label>
                <input
                  type="number"
                  step="any"
                  value={low30Days}
                  onChange={(e) => setLow30Days(e.target.value)}
                  placeholder="e.g. 45.00"
                  className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
                />
              </div>
            </div>
          </div>

          {/* Simple Visual Comparison block */}
          {(!isNaN(parseFloat(currentPrice)) && !isNaN(parseFloat(typicalPrice))) && (
            <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3.5 space-y-2">
              <span className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">Comparison Metrics</span>
              <div className="flex items-center justify-between text-xs">
                <span>Calculated Price Drop:</span>
                <span className={`font-bold ${Number(dropPct) >= 5 ? "text-emerald-600" : "text-amber-600"}`}>
                  {dropPct}% {Number(dropPct) >= 5 ? " (Significant Drop)" : " (Insignificant Drop)"}
                </span>
              </div>
              <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full ${Number(dropPct) >= 5 ? "bg-emerald-500" : "bg-amber-400"}`} 
                  style={{ width: `${Math.min(100, Math.max(0, parseFloat(dropPct || "0")))}%` }}
                ></div>
              </div>
            </div>
          )}

          {errorMessage && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 p-2.5 rounded-lg">
              <AlertOctagon className="h-4 w-4 flex-shrink-0" /> {errorMessage}
            </p>
          )}

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full py-3 px-5 bg-neutral-900 hover:bg-neutral-950 text-white rounded-xl font-semibold shadow flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:bg-neutral-400"
          >
            {isAnalyzing ? (
              <>
                <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                <span>Analysing Price Signals with Gemini...</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-4.5 w-4.5" />
                <span>Run Market Intelligence Analyst</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Right results column (Takes 6 cols) */}
      <div className="md:col-span-6 space-y-6">
        
        {/* Output Header */}
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">Market Analysis Results</span>
          
          {isAnalyzing ? (
            <div className="border border-neutral-100 bg-white rounded-2xl p-6 shadow-sm animate-pulse space-y-4 min-h-[300px] flex flex-col justify-center">
              <div className="h-4 bg-neutral-100 rounded w-1/4 self-center mb-4"></div>
              <div className="h-12 bg-neutral-50 rounded-xl flex items-center justify-center max-w-xs self-center w-full">
                <Sparkles className="h-6 w-6 text-neutral-300 animate-spin" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-neutral-100 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-neutral-100 rounded w-1/2 mx-auto"></div>
              </div>
            </div>
          ) : result?.analysis ? (
            <div className="space-y-4">
              {/* Alert Dashboard Card */}
              <div className={`border-2 rounded-2xl p-6 overflow-hidden transition-all duration-200 relative ${
                result.analysis.status === 'alert' 
                  ? "border-emerald-500 bg-emerald-50/20 shadow-emerald-50" 
                  : result.analysis.status === 'no-alert' 
                    ? "border-amber-400 bg-amber-50/10" 
                    : "border-rose-500 bg-rose-50/20"
              }`}>
                {/* Visual Glow Badge */}
                <div className="absolute top-4 right-4">
                  {result.analysis.status === 'alert' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 animate-pulse">
                      ● Alert On
                    </span>
                  ) : result.analysis.status === 'no-alert' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-800">
                      ○ No Alert
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase bg-rose-100 text-rose-800">
                      ✖ Error
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Analyst Recommendation</span>
                    <h3 className={`text-3xl font-extrabold ${
                      result.analysis.status === 'alert' 
                        ? "text-emerald-600" 
                        : result.analysis.status === 'no-alert' 
                          ? "text-amber-600" 
                          : "text-rose-600"
                    }`}>
                      {result.analysis.recommendation.toUpperCase()}
                    </h3>
                  </div>

                  <div className="border-t border-neutral-150/80 pt-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Analysis Context</span>
                    <h4 className="text-xs font-bold text-neutral-900 leading-snug">{result.productTitle}</h4>
                    
                    <div className="grid grid-cols-3 gap-2 py-1 text-center">
                      <div className="bg-white/60 border border-neutral-100 rounded-lg p-1.5">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">Current</span>
                        <span className="text-xs font-bold text-neutral-900">{formatValue(result.currentPrice, result.currencyCode)}</span>
                      </div>
                      <div className="bg-white/60 border border-neutral-100 rounded-lg p-1.5">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">Typical</span>
                        <span className="text-xs font-semibold text-neutral-600">{formatValue(result.typicalPrice, result.currencyCode)}</span>
                      </div>
                      <div className="bg-white/60 border border-neutral-100 rounded-lg p-1.5">
                        <span className="text-[9px] text-neutral-400 uppercase tracking-wider block">30D Low</span>
                        <span className="text-xs font-semibold text-neutral-600">{result.low30Days ? formatValue(result.low30Days, result.currencyCode) : "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-neutral-150/80 pt-4 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Intelligence Reason</span>
                    <p className="text-xs text-neutral-700 leading-relaxed font-medium">
                      {result.analysis.reason}
                    </p>
                  </div>
                </div>
              </div>

              {/* Toggle Raw JSON and Developer Information */}
              <div className="flex justify-between items-center px-1">
                <button
                  onClick={() => setShowJson(!showJson)}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-800 flex items-center gap-1 hover:underline"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>{showJson ? "Hide Raw JSON Output" : "Show Raw JSON Output"}</span>
                </button>
              </div>

              {showJson && (
                <JsonViewer jsonObj={result.analysis} title="Intelligence Output JSON Schema" />
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-neutral-200 bg-neutral-50/50 rounded-2xl p-12 text-center text-neutral-500 text-sm min-h-[300px] flex flex-col items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-neutral-400 mb-3" />
              <p className="max-w-xs mx-auto">Configure price signals on the left and run the Market Analyst to determine drop eligibility status.</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
