import React, { useState, useEffect } from "react";
import { SAMPLE_PRODUCTS } from "./samples";
import { ProductCard } from "./components/ProductCard";
import { PromptPlayground } from "./components/PromptPlayground";
import { JsonViewer } from "./components/JsonViewer";
import { PriceIntelligence } from "./components/PriceIntelligence";
import { AlertsTracker } from "./components/AlertsTracker";
import { ProductData, ExtractionResult, ExtractionField, TrackedProduct, AlertLog } from "./types";
import { 
  ShoppingBag, 
  Sparkles, 
  Database, 
  Layers, 
  Plus, 
  Trash2, 
  Check, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw, 
  FileText, 
  AlertTriangle, 
  History, 
  Terminal, 
  ChevronRight, 
  CornerDownRight, 
  Clock, 
  ExternalLink,
  TrendingDown,
  LineChart,
  HelpCircle,
  Info,
  ArrowRight
} from "lucide-react";

const INITIAL_FIELDS: ExtractionField[] = [
  { key: "brand", label: "Brand", description: "The manufacturer or brand of the product (e.g. boAt, Amazon Devices).", type: "STRING", enabled: true },
  { key: "rating", label: "Customer Rating", description: "The customer star rating as listed (e.g. 4.7 out of 5 stars).", type: "STRING", enabled: true },
  { key: "reviewCount", label: "Reviews Count", description: "The total number of customer reviews or ratings (e.g. 14,352).", type: "STRING", enabled: true },
  { key: "availability", label: "Availability", description: "Stock availability message (e.g. In Stock, Currently Unavailable).", type: "STRING", enabled: false },
  { key: "bestSellerBadge", label: "Best Seller Badge", description: "Any best-seller badge text if present.", type: "STRING", enabled: false },
];

export default function App() {
  // Application Mode State
  const [appMode, setAppMode] = useState<'extractor' | 'analyst' | 'tracker'>('extractor');
  const [showGuide, setShowGuide] = useState(true);

  // Tracker States
  const [trackedProducts, setTrackedProducts] = useState<TrackedProduct[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [isFetchingTracker, setIsFetchingTracker] = useState(false);
  const [isTriggeringCron, setIsTriggeringCron] = useState(false);
  const [trackerError, setTrackerError] = useState<string | null>(null);

  // Add Product Form State
  const [trackTitle, setTrackTitle] = useState("");
  const [trackTargetPrice, setTrackTargetPrice] = useState("");
  const [trackCurrency, setTrackCurrency] = useState("USD");
  const [trackEmail, setTrackEmail] = useState("");
  const [trackHtml, setTrackHtml] = useState("");
  const [trackMessage, setTrackMessage] = useState<string | null>(null);

  // Selected Log detail
  const [selectedLog, setSelectedLog] = useState<AlertLog | null>(null);

  // Input State
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [selectedSampleId, setSelectedSampleId] = useState<string>("echo-dot");

  // Custom Fields State
  const [customFields, setCustomFields] = useState<ExtractionField[]>(INITIAL_FIELDS);

  // New Field Form State
  const [newKey, setNewKey] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<'STRING' | 'NUMBER' | 'BOOLEAN'>('STRING');
  const [fieldError, setFieldError] = useState<string | null>(null);

  // Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const [currentResult, setCurrentResult] = useState<ExtractionResult | null>(null);
  const [history, setHistory] = useState<ExtractionResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active Output Tab
  const [activeTab, setActiveTab] = useState<'preview' | 'json' | 'prompt' | 'history'>('preview');

  // Load sample content on mount
  useEffect(() => {
    const defaultSample = SAMPLE_PRODUCTS.find(p => p.id === "echo-dot");
    if (defaultSample) {
      setHtmlContent(defaultSample.html);
    }

    // Load History from localStorage
    const savedHistory = localStorage.getItem("extraction_history");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history:", e);
      }
    }
  }, []);

  const fetchTrackerData = async () => {
    setIsFetchingTracker(true);
    setTrackerError(null);
    try {
      const prodRes = await fetch("/api/tracked-products");
      const prodJson = await prodRes.json();
      if (prodJson.success) {
        setTrackedProducts(prodJson.products);
      }

      const logRes = await fetch("/api/alert-logs");
      const logJson = await logRes.json();
      if (logJson.success) {
        setAlertLogs(logJson.logs);
      }
    } catch (err: any) {
      console.error("Error fetching tracker data:", err);
      setTrackerError("Failed to connect to backend tracker services.");
    } finally {
      setIsFetchingTracker(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, [appMode]);

  const handleAddTrackedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackMessage(null);
    if (!trackTitle.trim() || !trackTargetPrice.trim() || !trackEmail.trim() || !trackHtml.trim()) {
      setTrackMessage("Error: All fields are required to start 24/7 automation.");
      return;
    }

    try {
      const res = await fetch("/api/tracked-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: trackTitle.trim(),
          targetPrice: Number(trackTargetPrice),
          currencyCode: trackCurrency,
          email: trackEmail.trim(),
          htmlSource: trackHtml
        })
      });
      const data = await res.json();
      if (data.success) {
        setTrackMessage("Success: Product added to background 24/7 pricing cron schedule!");
        setTrackTitle("");
        setTrackTargetPrice("");
        setTrackEmail("");
        setTrackHtml("");
        fetchTrackerData();
      } else {
        setTrackMessage(`Error: ${data.error || "Could not register product"}`);
      }
    } catch (err: any) {
      setTrackMessage(`Error: ${err.message || "Network failure"}`);
    }
  };

  const handleToggleProduct = async (id: string) => {
    try {
      const res = await fetch("/api/tracked-products/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        fetchTrackerData();
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Are you sure you want to stop tracking this product and delete its history?")) {
      return;
    }
    try {
      const res = await fetch(`/api/tracked-products/${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (data.success) {
        fetchTrackerData();
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const handleSimulatePrice = async (id: string, simulatedPrice: number) => {
    try {
      const res = await fetch("/api/tracked-products/simulate-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, simulatedPrice })
      });
      const data = await res.json();
      if (data.success) {
        fetchTrackerData();
        if (data.alertSent) {
          alert(`🎉 Simulation alert triggered! An email alert was dispatched to ${data.product.email}. Check the Sent Alerts Outbox!`);
        } else {
          alert(`Price simulated as ${data.product.currencyCode} ${simulatedPrice}. No alert was sent because it's higher than the target price of ${data.product.currencyCode} ${data.product.targetPrice}.`);
        }
      }
    } catch (err) {
      console.error("Simulation error:", err);
    }
  };

  const handleTriggerCron = async () => {
    setIsTriggeringCron(true);
    try {
      const res = await fetch("/api/cron/trigger", {
        method: "POST"
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully forced background scraping cron cycle!\n\nAnalyzed ${data.summary?.length || 0} active products.`);
        fetchTrackerData();
      } else {
        alert(`Failed to run cron tracking cycle: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Network error running cron cycle: ${err.message}`);
    } finally {
      setIsTriggeringCron(false);
    }
  };

  // Helper to pre-populate tracking from HTML extraction result
  const handleTransferToTracker = () => {
    if (!currentResult || !currentResult.extractedData) return;
    const { productTitle, currentPrice, currencyCode } = currentResult.extractedData;
    
    setTrackTitle(productTitle || "");
    setTrackTargetPrice(currentPrice ? (currentPrice * 0.95).toFixed(2) : "");
    setTrackCurrency(currencyCode || "USD");
    setTrackEmail("alert-subscriber@example.com"); // default demo email
    setTrackHtml(htmlContent);
    setAppMode('tracker');
  };


  // Handle sample selection change
  const handleSampleSelect = (id: string) => {
    setSelectedSampleId(id);
    const sample = SAMPLE_PRODUCTS.find(p => p.id === id);
    if (sample) {
      setHtmlContent(sample.html);
    }
  };

  // Add a new custom field to the schema
  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const cleanKey = newKey.trim().replace(/\s+/g, "");
    if (!cleanKey) {
      setFieldError("Field key is required.");
      return;
    }

    // Validate that key contains only letters and numbers
    if (!/^[a-zA-Z0-9]+$/.test(cleanKey)) {
      setFieldError("Field key must contain only letters and numbers (no spaces or symbols).");
      return;
    }

    // Check for duplicates
    if (customFields.some(f => f.key.toLowerCase() === cleanKey.toLowerCase())) {
      setFieldError(`A field with key "${cleanKey}" already exists.`);
      return;
    }

    const label = newLabel.trim() || cleanKey.replace(/([A-Z])/g, ' $1').trim();

    const newField: ExtractionField = {
      key: cleanKey,
      label,
      description: newDesc.trim() || `The extracted ${label.toLowerCase()} value.`,
      type: newType,
      enabled: true
    };

    setCustomFields([...customFields, newField]);

    // Reset Form
    setNewKey("");
    setNewLabel("");
    setNewDesc("");
    setNewType("STRING");
  };

  // Remove a custom field
  const handleRemoveField = (key: string) => {
    setCustomFields(customFields.filter(f => f.key !== key));
  };

  // Toggle field enabled state
  const handleToggleField = (key: string) => {
    setCustomFields(customFields.map(f => {
      if (f.key === key) {
        return { ...f, enabled: !f.enabled };
      }
      return f;
    }));
  };

  // Run the Extraction via server API
  const handleExtract = async () => {
    if (!htmlContent.trim()) {
      setErrorMessage("Please paste some product page HTML or load a preloaded template.");
      return;
    }

    setIsExtracting(true);
    setErrorMessage(null);

    const activeFields = customFields.filter(f => f.enabled);

    try {
      const response = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          htmlContent,
          customFields: activeFields
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned error: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success) {
        const newResult: ExtractionResult = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString(),
          rawInputLength: result.rawTextLength,
          extractedData: result.data,
          prompt: result.promptUsed,
          success: true,
          error: null
        };

        setCurrentResult(newResult);
        
        // Save to History
        const updatedHistory = [newResult, ...history].slice(0, 20); // Keep last 20
        setHistory(updatedHistory);
        localStorage.setItem("extraction_history", JSON.stringify(updatedHistory));

        // Auto-switch to preview tab
        setActiveTab('preview');
      } else {
        throw new Error(result.error || "Gemini was unable to extract valid information.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "An error occurred while communicating with the extraction backend.");
      
      const failedResult: ExtractionResult = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString(),
        rawInputLength: htmlContent.length,
        extractedData: null,
        prompt: "N/A",
        success: false,
        error: err.message || "Extraction Failed"
      };

      setCurrentResult(failedResult);
      setHistory(prev => [failedResult, ...prev]);
    } finally {
      setIsExtracting(false);
    }
  };

  // Clear all history logs
  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("extraction_history");
  };

  return (
    <div id="app-root" className="min-h-screen bg-neutral-50/50 text-neutral-800 font-sans antialiased">
      {/* Top Header Section */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-40 shadow-sm/5 bg-opacity-95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-neutral-900 rounded-xl text-white shadow-md">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-neutral-900">E-Commerce Intelligence Suite</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-150 uppercase tracking-wider">
                  Gemini-3.5-Flash
                </span>
              </div>
              <p className="text-xs text-neutral-500 font-medium">Expert e-commerce data parser, custom schemas, and price intelligence monitoring</p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            {/* Mode Switcher */}
            <div className="bg-neutral-100 p-1 rounded-xl border border-neutral-200 flex space-x-1">
              <button
                onClick={() => setAppMode('extractor')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  appMode === 'extractor'
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>HTML Parser</span>
              </button>
              <button
                onClick={() => setAppMode('analyst')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  appMode === 'analyst'
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5" />
                <span>Price Monitor</span>
              </button>
              <button
                onClick={() => setAppMode('tracker')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  appMode === 'tracker'
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-900"
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>24/7 Alerts Tracker</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mode Specific Description Sub-bar */}
      <div className="bg-white border-b border-neutral-100 py-3 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {appMode === 'extractor' ? (
            <div className="flex items-center space-x-2 text-neutral-600">
              <Database className="h-4 w-4 text-neutral-400" />
              <span><b>Data Extraction Module:</b> Paste raw e-commerce HTML. Gemini parses structured title, pricing, currency, and custom key properties.</span>
            </div>
          ) : appMode === 'analyst' ? (
            <div className="flex items-center space-x-2 text-neutral-600">
              <LineChart className="h-4 w-4 text-neutral-400" />
              <span><b>Price Intelligence Analyst:</b> Evaluates price drop signals against 30D historical lowest levels and typical pricing with a strictly formatted JSON decision engine.</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-neutral-600">
              <History className="h-4 w-4 text-neutral-400" />
              <span><b>24/7 Automated Pricing Tracker:</b> Manages products monitored by node-cron scheduler. Simulates price drops and inspects SMTP/Simulated outbound email alert outbox.</span>
            </div>
          )}
          {appMode === 'extractor' && currentResult?.extractedData?.currentPrice && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setAppMode('analyst')}
                className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
              >
                Send to Monitor →
              </button>
              <span className="text-neutral-200">|</span>
              <button
                onClick={handleTransferToTracker}
                className="text-xs text-emerald-600 hover:underline font-bold flex items-center gap-1"
              >
                Add to 24/7 Tracker →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Interactive Walkthrough / Guide Panel */}
        {showGuide ? (
          <div className="bg-white rounded-2xl border border-indigo-150 p-6 shadow-sm relative overflow-hidden bg-gradient-to-r from-white via-indigo-50/10 to-indigo-50/25">
            {/* Elegant visual badge */}
            <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-50 rounded-full -mr-10 -mt-10 opacity-30 blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-indigo-100 rounded-lg text-indigo-700">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                    Interactive Walkthrough & Live Data Flow
                  </h2>
                  <p className="text-[11px] text-neutral-500 font-medium">Learn how the HTML Parser and Price Monitor work together seamlessly</p>
                </div>
              </div>
              <button 
                onClick={() => setShowGuide(false)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline px-2.5 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition-colors"
              >
                Hide Explainer
              </button>
            </div>

            {/* Stepper Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className={`p-4 rounded-xl border transition-all duration-200 ${appMode === 'extractor' ? 'border-indigo-250 bg-white shadow-sm' : 'border-neutral-200 bg-neutral-50/50 opacity-75'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">1</span>
                  <span className="font-bold text-neutral-900">HTML Data Extraction</span>
                </div>
                <p className="text-neutral-600 leading-relaxed mb-3">
                  Paste raw e-commerce HTML or select one of our preloaded templates below. Specify custom fields you want to extract under <b>Structured Data Schema Fields</b>.
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600">
                  <span>Current Tab:</span>
                  <span className="bg-indigo-100 px-1.5 py-0.2 rounded">HTML Parser</span>
                </div>
              </div>

              <div className={`p-4 rounded-xl border transition-all duration-200 ${appMode === 'extractor' && currentResult ? 'border-indigo-250 bg-white shadow-sm' : 'border-neutral-200 bg-neutral-50/50 opacity-75'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">2</span>
                  <span className="font-bold text-neutral-900">Review Structured Output</span>
                </div>
                <p className="text-neutral-600 leading-relaxed mb-3">
                  Click <b>"Run Data Extraction Engine"</b>. Gemini compiles messy HTML structures into clean data fields shown in the <b>Visual Card</b> or <b>JSON Schema</b>.
                </p>
                {currentResult ? (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600">
                    <Check className="h-3.5 w-3.5" />
                    <span>Data parsed successfully!</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 animate-pulse">
                    <span>Awaiting your first run...</span>
                  </div>
                )}
              </div>

              <div className={`p-4 rounded-xl border transition-all duration-200 ${appMode === 'analyst' ? 'border-indigo-250 bg-white shadow-sm' : 'border-neutral-200 bg-neutral-50/50 opacity-75'}`}>
                <div className="flex items-center space-x-2 mb-2">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-indigo-600 text-white font-bold text-[10px]">3</span>
                  <span className="font-bold text-neutral-900">Price Drop Alert Decision</span>
                </div>
                <p className="text-neutral-600 leading-relaxed mb-3">
                  Send parsed data to the <b>Price Monitor</b>. Gemini acts as an expert analyst to compare the deal against historical metrics (30D low, typical price).
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-600">
                  <span>Current Tab:</span>
                  <span className="bg-indigo-100 px-1.5 py-0.2 rounded">Price Monitor</span>
                </div>
              </div>
            </div>

            {/* Visual Live Pipeline / Flow Diagram */}
            <div className="mt-5 bg-neutral-900 text-neutral-200 rounded-xl p-4 font-mono text-[10px] sm:text-xs overflow-x-auto border border-neutral-800">
              <div className="flex items-center justify-between min-w-[600px] space-x-2">
                <div className="bg-neutral-800 border border-neutral-750 px-3 py-2 rounded-lg text-center flex-1">
                  <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wide">Input</span>
                  <span className="text-neutral-200 font-bold font-sans">Raw E-Commerce HTML</span>
                </div>
                <div className="text-neutral-500 animate-pulse font-sans">──▶</div>
                <div className="bg-indigo-950 border border-indigo-900 px-3 py-2 rounded-lg text-center flex-1">
                  <span className="text-[10px] text-indigo-300 block uppercase font-bold tracking-wide">Engine 1 (Flash)</span>
                  <span className="text-indigo-200 font-bold font-sans">Gemini JSON Parser</span>
                </div>
                <div className="text-neutral-500 font-sans">──▶</div>
                <div className="bg-neutral-800 border border-neutral-750 px-3 py-2 rounded-lg text-center flex-1">
                  <span className="text-[10px] text-neutral-400 block uppercase font-bold tracking-wide">Data Flow Bridge</span>
                  <span className="text-emerald-400 font-bold font-sans flex items-center justify-center gap-1">
                    Structured Schema
                    {currentResult && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping"></span>}
                  </span>
                </div>
                <div className="text-neutral-500 font-sans">──▶</div>
                <div className="bg-indigo-950 border border-indigo-900 px-3 py-2 rounded-lg text-center flex-1">
                  <span className="text-[10px] text-indigo-300 block uppercase font-bold tracking-wide">Engine 2 (Intelligence)</span>
                  <span className="text-indigo-200 font-bold font-sans">Gemini Price Analyst</span>
                </div>
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-neutral-200 p-4 shadow-sm flex items-center justify-between text-xs text-neutral-600">
            <div className="flex items-center space-x-2">
              <Info className="h-4 w-4 text-indigo-600" />
              <span>Interactive tutorial walkthrough is currently hidden. Learn how both AI models coordinate with one click.</span>
            </div>
            <button 
              onClick={() => setShowGuide(true)}
              className="font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
            >
              Show Guide & Pipeline Walkthrough
            </button>
          </div>
        )}

        {appMode === 'extractor' ? (
          /* Original HTML Extraction Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Input Panel & Setup (Takes 7 cols) */}
            <section className="lg:col-span-7 space-y-6">
              
              {/* Template Selector Section */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm/5">
                <div className="flex items-center space-x-2 mb-3.5">
                  <Sparkles className="h-4.5 w-4.5 text-amber-500" />
                  <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Preloaded Product Templates</h2>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {SAMPLE_PRODUCTS.map((prod) => (
                    <button
                      key={prod.id}
                      onClick={() => handleSampleSelect(prod.id)}
                      className={`group text-left p-3.5 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                        selectedSampleId === prod.id
                          ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                          : "border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-50 text-neutral-800"
                      }`}
                    >
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider block mb-1 ${
                          selectedSampleId === prod.id ? "text-neutral-400" : "text-neutral-400"
                        }`}>
                          {prod.id === "echo-dot" ? "USA Store" : prod.id === "boat-rockerz" ? "India Store" : prod.id === "kindle-paperwhite" ? "UK Store" : "Fallback Case"}
                        </span>
                        <h3 className={`text-sm font-semibold leading-tight line-clamp-1 ${
                          selectedSampleId === prod.id ? "text-white" : "text-neutral-900"
                        }`}>
                          {prod.label}
                        </h3>
                      </div>
                      <p className={`text-[11px] leading-normal mt-1.5 line-clamp-2 ${
                        selectedSampleId === prod.id ? "text-neutral-300" : "text-neutral-500"
                      }`}>
                        {prod.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input HTML Code Area */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm/5 flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4.5 w-4.5 text-neutral-500" />
                    <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Product Page HTML Input</h2>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-medium text-neutral-400 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                      {htmlContent.length.toLocaleString()} characters
                    </span>
                    <button 
                      onClick={() => setHtmlContent("")} 
                      className="text-[10px] font-semibold text-neutral-500 hover:text-neutral-800 hover:underline"
                    >
                      Clear Input
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    value={htmlContent}
                    onChange={(e) => {
                      setHtmlContent(e.target.value);
                      setSelectedSampleId(""); // deselect sample if edited manually
                    }}
                    placeholder="Paste your Amazon product HTML here or select a template above..."
                    className="w-full h-80 bg-neutral-900 text-neutral-200 font-mono text-xs p-4 rounded-xl border border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 resize-none leading-relaxed"
                  />
                  <div className="absolute bottom-3 right-3 select-none pointer-events-none">
                    <span className="text-[9px] font-semibold text-neutral-600 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 uppercase tracking-wider">
                      Clean HTML Active
                    </span>
                  </div>
                </div>

                {/* Character Limit Info */}
                <div className="text-[11px] text-neutral-500 flex items-center space-x-1">
                  <CornerDownRight className="h-3 w-3 text-neutral-400" />
                  <span>Our server auto-strips scripts/styles and trims text to the first 30,000 characters to optimize parsing cost & speed.</span>
                </div>
              </div>

              {/* Extraction Fields Configuration Schema */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm/5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-100">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4.5 w-4.5 text-indigo-500" />
                    <div>
                      <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Structured Data Schema Fields</h2>
                      <p className="text-[11px] text-neutral-500">Configure target keys for Gemini structured JSON extraction</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700">
                    {customFields.filter(f => f.enabled).length + 3} Target Keys
                  </span>
                </div>

                {/* Helpful explanatory tip */}
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-950 flex items-start space-x-2.5">
                  <Info className="h-4 w-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <b>What are these keys?</b> They tell Gemini exactly which properties to look for in the HTML code. Core keys are built-in, but you can toggle optional ones on/off or add custom attributes (e.g., <code>primeDelivery</code>, <code>inStock</code>) using the form below.
                  </p>
                </div>

                {/* Locked/Default Schema Keys Info */}
                <div className="bg-neutral-50 border border-neutral-100 rounded-xl p-3 text-xs flex flex-col space-y-2">
                  <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider">Built-In Core Keys (Always Extracted)</span>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white border border-neutral-200 rounded-lg p-2 flex flex-col">
                      <span className="font-mono text-xs font-bold text-neutral-900">productTitle</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">String, Name of product</span>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-lg p-2 flex flex-col">
                      <span className="font-mono text-xs font-bold text-neutral-900">currentPrice</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">Float (null if not found)</span>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-lg p-2 flex flex-col">
                      <span className="font-mono text-xs font-bold text-neutral-900">currencyCode</span>
                      <span className="text-[10px] text-neutral-500 mt-0.5">3-letter ISO code</span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Optional Fields list */}
                <div className="space-y-2">
                  <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider block">Custom Optional Keys</span>
                  
                  {customFields.length === 0 ? (
                    <p className="text-xs text-neutral-500 italic py-2 text-center">No optional schema keys configured.</p>
                  ) : (
                    <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                      {customFields.map((field) => (
                        <div key={field.key} className="flex items-center justify-between p-3 rounded-xl border border-neutral-150 bg-white hover:border-neutral-200 transition-colors">
                          <div className="flex items-start space-x-3">
                            <button
                              onClick={() => handleToggleField(field.key)}
                              className="mt-0.5 text-neutral-400 hover:text-neutral-700 transition-colors"
                            >
                              {field.enabled ? (
                                <ToggleRight className="h-6.5 w-6.5 text-neutral-900" />
                              ) : (
                                <ToggleLeft className="h-6.5 w-6.5 text-neutral-300" />
                              )}
                            </button>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-bold text-neutral-900">{field.key}</span>
                                <span className="text-[9px] font-semibold bg-neutral-100 text-neutral-600 px-1.5 py-0.2 rounded uppercase">
                                  {field.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-500 mt-0.5">{field.description}</p>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleRemoveField(field.key)}
                            className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Key"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add Custom Field Form */}
                <form onSubmit={handleAddField} className="border-t border-neutral-100 pt-4 space-y-3">
                  <span className="font-bold text-[10px] text-neutral-400 uppercase tracking-wider block">Define New Schema Key</span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Key ID (camelCase)</label>
                      <input
                        type="text"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="e.g. primeShipping"
                        className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Display Label</label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="e.g. Prime Eligible"
                        className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Data Type</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full text-xs border border-neutral-300 bg-white rounded-lg px-2 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
                      >
                        <option value="STRING">String (Text)</option>
                        <option value="NUMBER">Number (Decimal/Int)</option>
                        <option value="BOOLEAN">Boolean (True/False)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-500 mb-1">Extraction Rule Description</label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Instruct Gemini what to extract (e.g. True if Prime logo is present on page)"
                      className="w-full text-xs border border-neutral-300 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400"
                    />
                  </div>

                  {fieldError && (
                    <p className="text-xs text-rose-600 font-medium flex items-center gap-1.5 bg-rose-50 p-2 rounded-lg">
                      <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" /> {fieldError}
                    </p>
                  )}

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="inline-flex items-center space-x-1.5 text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 border border-neutral-300 text-neutral-700 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Append Schema Key</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Error Message if any */}
              {errorMessage && (
                <div id="error-banner" className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-start space-x-3 shadow-sm/5">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 text-rose-500" />
                  <div>
                    <h3 className="text-sm font-semibold">Extraction Interrupted</h3>
                    <p className="text-xs text-rose-700 mt-1">{errorMessage}</p>
                  </div>
                </div>
              )}

              {/* Huge Extract Button */}
              <div className="flex justify-center pt-2">
                <button
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className="w-full py-4 px-6 bg-neutral-900 hover:bg-neutral-950 text-white rounded-2xl font-semibold shadow-md flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:bg-neutral-400 disabled:cursor-not-allowed hover:shadow-lg"
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>Analyzing HTML Content with Gemini AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      <span>Run Data Extraction Engine</span>
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Right Column: Output Tabs & Display (Takes 5 cols) */}
            <section className="lg:col-span-5 space-y-6">
              
              {/* Display Tabs Controls */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-2 shadow-sm/5 flex space-x-1">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold tracking-tight transition-all duration-150 flex items-center justify-center gap-1.5 ${
                    activeTab === 'preview'
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Visual Card</span>
                </button>
                <button
                  onClick={() => setActiveTab('json')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold tracking-tight transition-all duration-150 flex items-center justify-center gap-1.5 ${
                    activeTab === 'json'
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <Database className="h-3.5 w-3.5" />
                  <span>JSON Schema</span>
                </button>
                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold tracking-tight transition-all duration-150 flex items-center justify-center gap-1.5 ${
                    activeTab === 'prompt'
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Prompt</span>
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold tracking-tight transition-all duration-150 flex items-center justify-center gap-1.5 ${
                    activeTab === 'history'
                      ? "bg-neutral-900 text-white shadow-sm"
                      : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                  }`}
                >
                  <History className="h-3.5 w-3.5" />
                  <span>History</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="transition-all duration-200">
                
                {/* Tab: Visual Card */}
                {activeTab === 'preview' && (
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">Interactive Product Preview</span>
                    <ProductCard 
                      productData={currentResult?.extractedData || null} 
                      isLoading={isExtracting} 
                    />
                    {currentResult?.extractedData && (
                      <div className="space-y-3">
                        <div className="bg-white border border-neutral-200 rounded-xl p-4 text-xs space-y-1.5 text-neutral-500">
                          <div className="flex justify-between">
                            <span>Parser Strategy:</span>
                            <b className="text-neutral-800">Structured JSON Output</b>
                          </div>
                          <div className="flex justify-between">
                            <span>Clean text length analyzed:</span>
                            <b className="text-neutral-800">{currentResult.rawInputLength.toLocaleString()} characters</b>
                          </div>
                          <div className="flex justify-between">
                            <span>Extraction timestamp:</span>
                            <b className="text-neutral-800">{currentResult.timestamp}</b>
                          </div>
                        </div>

                        <button
                          onClick={() => setAppMode('analyst')}
                          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-700"
                        >
                          <TrendingDown className="h-4 w-4" />
                          <span>Analyze Price Signals in Price Monitor ➔</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: JSON Schema */}
                {activeTab === 'json' && (
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">Extracted Structured JSON</span>
                    {currentResult?.extractedData ? (
                      <JsonViewer jsonObj={currentResult.extractedData} />
                    ) : (
                      <div className="border-2 border-dashed border-neutral-200 bg-neutral-50/50 rounded-2xl p-12 text-center text-neutral-500 text-sm min-h-[300px] flex flex-col items-center justify-center">
                        <Database className="h-8 w-8 text-neutral-400 mb-3" />
                        <p>Run the extraction tool to compile HTML content into valid JSON.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Prompt Compiler */}
                {activeTab === 'prompt' && (
                  <div className="space-y-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block px-1">Developer Code Compilation</span>
                    <PromptPlayground 
                      htmlSnippet={htmlContent} 
                      customFields={customFields} 
                    />
                  </div>
                )}

                {/* Tab: History Log */}
                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-400 block">Recent Executions</span>
                      {history.length > 0 && (
                        <button 
                          onClick={handleClearHistory}
                          className="text-xs text-rose-600 hover:underline hover:text-rose-700 font-semibold"
                        >
                          Clear All Log
                        </button>
                      )}
                    </div>

                    {history.length === 0 ? (
                      <div className="border-2 border-dashed border-neutral-200 bg-neutral-50/50 rounded-2xl p-12 text-center text-neutral-500 text-sm min-h-[300px] flex flex-col items-center justify-center">
                        <History className="h-8 w-8 text-neutral-400 mb-3 animate-pulse" />
                        <p>Your extraction history is empty. Recent parser runs will be tracked here locally.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                        {history.map((item) => (
                          <div 
                            key={item.id} 
                            onClick={() => {
                              setCurrentResult(item);
                              setActiveTab('preview');
                            }}
                            className={`p-4 rounded-xl border text-left cursor-pointer transition-all duration-150 bg-white ${
                              currentResult?.id === item.id 
                                ? "border-neutral-900 shadow-sm" 
                                : "border-neutral-200 hover:border-neutral-300"
                            }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="inline-flex items-center text-[10px] font-mono text-neutral-400">
                                <Clock className="h-3 w-3 mr-1" /> {item.timestamp}
                              </span>
                              <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                                item.success 
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                                  : "bg-rose-50 text-rose-800 border border-rose-100"
                              }`}>
                                {item.success ? "Success" : "Failed"}
                              </span>
                            </div>

                            <h4 className="text-xs font-semibold text-neutral-800 line-clamp-2">
                              {item.extractedData?.productTitle || "Failed Extraction Result"}
                            </h4>

                            {item.success && item.extractedData && (
                              <div className="flex items-center gap-2 mt-2 text-[10px] text-neutral-500 font-mono">
                                <span>Price: <b className="text-neutral-700">{item.extractedData.currentPrice !== null ? `${item.extractedData.currentPrice} ${item.extractedData.currencyCode}` : "N/A"}</b></span>
                                <span>•</span>
                                <span>Analyzed: <b className="text-neutral-700">{item.rawInputLength.toLocaleString()} chars</b></span>
                              </div>
                            )}

                            {item.error && (
                              <p className="text-[10px] text-rose-600 mt-1 truncate">{item.error}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>

            </section>

          </div>
        ) : appMode === 'analyst' ? (
          /* New Price Intelligence Analyst Layout */
          <PriceIntelligence 
            onAnalyzeComplete={() => {}}
            extractedTitle={currentResult?.extractedData?.productTitle}
            extractedPrice={currentResult?.extractedData?.currentPrice}
            extractedCurrency={currentResult?.extractedData?.currencyCode}
          />
        ) : (
          /* New Alerts Tracker Layout */
          <AlertsTracker 
            trackedProducts={trackedProducts}
            alertLogs={alertLogs}
            isFetchingTracker={isFetchingTracker}
            isTriggeringCron={isTriggeringCron}
            trackerError={trackerError}
            trackTitle={trackTitle}
            setTrackTitle={setTrackTitle}
            trackTargetPrice={trackTargetPrice}
            setTrackTargetPrice={setTrackTargetPrice}
            trackCurrency={trackCurrency}
            setTrackCurrency={setTrackCurrency}
            trackEmail={trackEmail}
            setTrackEmail={setTrackEmail}
            trackHtml={trackHtml}
            setTrackHtml={setTrackHtml}
            trackMessage={trackMessage}
            setTrackMessage={setTrackMessage}
            handleAddTrackedProduct={handleAddTrackedProduct}
            handleToggleProduct={handleToggleProduct}
            handleDeleteProduct={handleDeleteProduct}
            handleSimulatePrice={handleSimulatePrice}
            handleTriggerCron={handleTriggerCron}
            fetchTrackerData={fetchTrackerData}
          />
        )}

      </main>

      {/* Footer information bar */}
      <footer className="bg-white border-t border-neutral-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="h-4 w-4 text-neutral-400" />
            <span>© 2026 E-commerce Intelligence Suite. All rights reserved.</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-neutral-300">|</span>
            <span>API: <b className="text-neutral-700">@google/genai (v2.4.0)</b></span>
            <span className="text-neutral-300">|</span>
            <span>Client: <b className="text-neutral-700">React + Vite</b></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
