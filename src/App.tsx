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
          /* HTML Extraction Layout */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Input Panel & Setup */}
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
                        <span className="text-[10px] font-bold uppercase tracking-wider block mb-1 text-neutral-400">
                          {prod.id === "echo-dot" ? "USA Store" : prod.id === "boat-rockerz" ? "India Store" : prod.id === "kindle-paperwhite" ? "UK Store" : "Store Item"}
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
                      setSelectedSampleId(""); 
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

                <div className="text-[11px] text-neutral-500 flex items-center space-x-1">
                  <CornerDownRight className="h-3 w-3 text-neutral-400" />
                  <span>Our server auto-strips scripts/styles and trims text to the first 30,000 characters to optimize parsing cost & speed.</span>
                </div>
              </div>

              {/* Extraction Fields Configuration Schema */}
              <div className="bg-white rounded-2xl border border-neutral-200 p-5 shadow-sm/5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4.5 w-4.5 text-neutral-500" />
                    <h2 className="text-sm font-semibold tracking-tight text-neutral-900">Structured Data Schema Fields</h2>
                  </div>
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded">
                    {customFields.filter(f => f.enabled).length} Active Keys
                  </span>
                </div>

                <p className="text-xs text-neutral-500 leading-normal">
                  The primary variables (<b>productTitle</b>, <b>currentPrice</b>, <b>currencyCode</b>, and <b>imageUrl</b>) are fixed schemas natively compiled by our parser engine. Add customized key targets below:
                </p>

                {/* Grid Lists of Custom fields */}
                <div className="border border-neutral-100 rounded-xl overflow-hidden divide-y divide-neutral-100 text-xs">
                  {customFields.map((field) => (
                    <div key={field.key} className={`p-3.5 flex items-start justify-between gap-4 transition-colors ${field.enabled ? 'bg-white' : 'bg-neutral-50/50 opacity-60'}`}>
                      <div className="space-y-0.5 max-w-[80%]">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-neutral-900 bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200/60">{field.key}</span>
                          <span className="font-semibold text-neutral-700">— {field.label}</span>
                          <span className="text-[9px] font-mono font-medium text-neutral-400 bg-neutral-50 border px-1 rounded uppercase">{field.type}</span>
                        </div>
                        <p className="text-neutral-500 text-[11px] leading-normal">{field.description}</p>
                      </div>

                      <div className="flex items-center space-x-1.5 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleToggleField(field.key)}
                          className="text-neutral-400 hover:text-neutral-900 p-1 rounded transition-colors"
                          title={field.enabled ? "Disable Field" : "Enable Field"}
                        >
                          {field.enabled ? <ToggleRight className="h-5 w-5 text-neutral-900" /> : <ToggleLeft className="h-5 w-5" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveField(field.key)}
                          className="text-neutral-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Delete Property"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Custom Field Form */}
                <form onSubmit={handleAddField} className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-neutral-200/60 pb-2">
                    <h3 className="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                      <Plus className="h-3.5 w-3.5" /> Inject Custom Schema Object Target
                    </h3>
                  </div>

                  {fieldError && (
                    <div className="p-2.5 rounded-lg text-[11px] font-medium bg-red-50 border border-red-100 text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span>{fieldError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600">Object Key (camelCase)</label>
                      <input
                        type="text"
                        value={newKey}
                        onChange={(e) => setNewKey(e.target.value)}
                        placeholder="e.g. couponDiscount"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white focus:outline-none font-mono text-[11px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600">Display Label</label>
                      <input
                        type="text"
                        value={newLabel}
                        onChange={(e) => setNewLabel(e.target.value)}
                        placeholder="e.g. Coupon Applied"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold text-neutral-600">Value Type</label>
                      <select
                        value={newType}
                        onChange={(e: any) => setNewType(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white focus:outline-none"
                      >
                        <option value="STRING">STRING Text</option>
                        <option value="NUMBER">NUMBER Value</option>
                        <option value="BOOLEAN">BOOLEAN Condition</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <label className="block text-[11px] font-bold text-neutral-600">Target Field Prompt Description instructions</label>
                    <input
                      type="text"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="e.g. Look for green checkbox labels containing savings or percentage drops..."
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-neutral-900 text-white rounded-lg text-[11px] font-bold shadow-sm hover:bg-neutral-800 transition-colors"
                    >
                      Append Custom Property Schema
                    </button>
                  </div>
                </form>
              </div>

              {/* Primary Extract Action Trigger */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className={`w-full py-4 rounded-xl font-bold text-sm tracking-tight shadow-md transition-all flex items-center justify-center gap-2 text-white ${
                    isExtracting 
                      ? 'bg-neutral-800 opacity-80 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99]'
                  }`}
                >
                  {isExtracting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Gemini Live Neural Assembly Parsing in Progress...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4.5 w-4.5" />
                      <span>Run Structured Data Extraction Engine</span>
                    </>
                  )}
                </button>
                {errorMessage && (
                  <div className="mt-3 p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-700 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>
            </section>

            {/* Right Column: Structured Output Monitor (Takes 5 cols) */}
            <section className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
                {/* Internal Output Tab Switcher */}
                <div className="bg-neutral-50 border-b border-neutral-200 px-4 pt-3 flex space-x-1.5 select-none text-xs">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-2 rounded-t-xl font-bold border-t border-x transition-colors ${
                      activeTab === 'preview'
                        ? 'bg-white border-neutral-200 text-neutral-950 font-extrabold shadow-[0_-2px_6px_rgba(0,0,0,0.015)]'
                        : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Visual Card
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`px-3 py-2 rounded-t-xl font-bold border-t border-x transition-colors ${
                      activeTab === 'json'
                        ? 'bg-white border-neutral-200 text-neutral-950 font-extrabold shadow-[0_-2px_6px_rgba(0,0,0,0.015)]'
                        : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    JSON Schema
                  </button>
                  <button
                    onClick={() => setActiveTab('prompt')}
                    className={`px-3 py-2 rounded-t-xl font-bold border-t border-x transition-colors ${
                      activeTab === 'prompt'
                        ? 'bg-white border-neutral-200 text-neutral-950 font-extrabold shadow-[0_-2px_6px_rgba(0,0,0,0.015)]'
                        : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    Generated Prompt
                  </button>
                  <button
                    onClick={() => setActiveTab('history')}
                    className={`px-3 py-2 rounded-t-xl font-bold border-t border-x transition-colors flex items-center gap-1 ${
                      activeTab === 'history'
                        ? 'bg-white border-neutral-200 text-neutral-950 font-extrabold shadow-[0_-2px_6px_rgba(0,0,0,0.015)]'
                        : 'bg-transparent border-transparent text-neutral-500 hover:text-neutral-800'
                    }`}
                  >
                    History ({history.length})
                  </button>
                </div>

                {/* Tab Frame Contents */}
                <div className="p-5 flex-1 flex flex-col bg-white">
                  {activeTab === 'preview' && (
                    <div className="flex-1 flex flex-col justify-between h-full space-y-4">
                      {currentResult?.extractedData ? (
                        <>
                          <ProductCard data={currentResult.extractedData} customSchemaFields={customFields} />
                          <div className="bg-neutral-50 border border-neutral-200/80 rounded-xl p-4 text-xs space-y-2.5">
                            <h4 className="font-bold text-neutral-900 flex items-center gap-1.5">
                              <Terminal className="h-3.5 w-3.5 text-neutral-500" /> Pipeline Operations Bridge
                            </h4>
                            <p className="text-neutral-500 text-[11px] leading-normal">
                              This payload is fully structured. Choose a downstream workflow engine action:
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-sans">
                              <button
                                onClick={() => setAppMode('analyst')}
                                className="w-full px-3 py-2 border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 text-indigo-700 font-bold rounded-lg transition-colors text-left flex items-center justify-between"
                              >
                                <span>Evaluate Price Drop</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={handleTransferToTracker}
                                className="w-full px-3 py-2 border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700 font-bold rounded-lg transition-colors text-left flex items-center justify-between"
                              >
                                <span>Automate 24/7 Alerts</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-xs text-neutral-400 my-auto space-y-3">
                          <div className="p-3 bg-neutral-50 text-neutral-300 rounded-full border border-neutral-200/60 shadow-inner">
                            <Database className="h-6 w-6" />
                          </div>
                          <div className="space-y-1 max-w-[280px]">
                            <p className="font-bold text-neutral-700">No Extracted Data Sample Loaded</p>
                            <p className="text-neutral-400 text-[11px]">Click "Run Data Extraction Engine" above to trigger structured text collection or load a default profile.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'json' && (
                    <JsonViewer 
                      data={currentResult?.extractedData} 
                      timestamp={currentResult?.timestamp} 
                      rawInputLength={currentResult?.rawInputLength} 
                    />
                  )}

                  {activeTab === 'prompt' && (
                    <PromptPlayground 
                      htmlSample={htmlContent} 
                      customFields={customFields.filter(f => f.enabled)} 
                      compiledPrompt={currentResult?.prompt} 
                    />
                  )}

                  {activeTab === 'history' && (
                    <div className="flex-1 flex flex-col justify-between h-full text-xs space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <span className="font-bold text-neutral-700">Cache History Stack</span>
                        {history.length > 0 && (
                          <button
                            onClick={handleClearHistory}
                            className="text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="h-3 w-3" /> Reset Storage Logs
                          </button>
                        )}
                      </div>

                      {history.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-neutral-400 py-12">
                          <History className="h-5 w-5 text-neutral-300 mb-2" />
                          <p className="font-medium text-[11px]">No local cache instances discovered.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                          {history.map((hist) => (
                            <button
                              key={hist.id}
                              onClick={() => setCurrentResult(hist)}
                              className={`w-full text-left p-3 rounded-xl border text-[11px] flex items-center justify-between transition-all ${
                                currentResult?.id === hist.id
                                  ? 'border-neutral-900 bg-neutral-900 text-white'
                                  : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800'
                              }`}
                            >
                              <div className="space-y-0.5 max-w-[85%]">
                                <p className="font-bold tracking-tight truncate">
                                  {hist.success ? hist.extractedData?.productTitle : `Failed Thread log (${hist.error})`}
                                </p>
                                <div className="flex items-center space-x-2 text-[10px] opacity-75">
                                  <span className="font-mono flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {hist.timestamp}</span>
                                  <span>•</span>
                                  <span>{(hist.rawInputLength / 1024).toFixed(1)} KB HTML input</span>
                                </div>
                              </div>
                              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        ) : appMode === 'analyst' ? (
          /* Price Analyst Mode */
          <PriceIntelligence 
            extractedProduct={currentResult?.extractedData || null} 
            onNavigateToTracker={handleTransferToTracker}
          />
        ) : (
          /* 24/7 Automated Pricing Alerts Module */
          <AlertsTracker
            trackedProducts={trackedProducts}
            alertLogs={alertLogs}
            isFetching={isFetchingTracker}
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
            handleAddTrackedProduct={handleAddTrackedProduct}
            handleToggleProduct={handleToggleProduct}
            handleDeleteProduct={handleDeleteProduct}
            handleSimulatePrice={handleSimulatePrice}
            handleTriggerCron={handleTriggerCron}
            selectedLog={selectedLog}
            setSelectedLog={setSelectedLog}
          />
        )}
      </main>

      {/* global UI footer watermark */}
      <footer className="border-t border-neutral-200 bg-white py-6 mt-12 text-center text-xs text-neutral-400 font-medium">
        <p>© 2026 E-Commerce Intelligence Dashboard. Integrated with Gemini 3.5 Flash server pipelines via client JSON constraints.</p>
      </footer>
    </div>
  );
}
