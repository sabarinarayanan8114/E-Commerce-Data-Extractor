import React, { useState } from "react";
import { TrackedProduct, AlertLog } from "../types";
import { 
  Bell, 
  Layers, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  RefreshCw, 
  History, 
  Clock, 
  Mail, 
  Plus, 
  Play, 
  Check, 
  Info, 
  AlertTriangle,
  ArrowRight,
  ExternalLink
} from "lucide-react";

interface AlertsTrackerProps {
  trackedProducts: TrackedProduct[];
  alertLogs: AlertLog[];
  isFetchingTracker: boolean;
  isTriggeringCron: boolean;
  trackerError: string | null;
  trackTitle: string;
  setTrackTitle: (v: string) => void;
  trackTargetPrice: string;
  setTrackTargetPrice: (v: string) => void;
  trackCurrency: string;
  setTrackCurrency: (v: string) => void;
  trackEmail: string;
  setTrackEmail: (v: string) => void;
  trackHtml: string;
  setTrackHtml: (v: string) => void;
  trackMessage: string | null;
  setTrackMessage: (v: string | null) => void;
  handleAddTrackedProduct: (e: React.FormEvent) => void;
  handleToggleProduct: (id: string) => void;
  handleDeleteProduct: (id: string) => void;
  handleSimulatePrice: (id: string, simulatedPrice: number) => void;
  handleTriggerCron: () => void;
  fetchTrackerData: () => void;
}

export function AlertsTracker({
  trackedProducts,
  alertLogs,
  isFetchingTracker,
  isTriggeringCron,
  trackerError,
  trackTitle,
  setTrackTitle,
  trackTargetPrice,
  setTrackTargetPrice,
  trackCurrency,
  setTrackCurrency,
  trackEmail,
  setTrackEmail,
  trackHtml,
  setTrackHtml,
  trackMessage,
  setTrackMessage,
  handleAddTrackedProduct,
  handleToggleProduct,
  handleDeleteProduct,
  handleSimulatePrice,
  handleTriggerCron,
  fetchTrackerData
}: AlertsTrackerProps) {
  const [selectedLog, setSelectedLog] = useState<AlertLog | null>(null);
  const [simulationPrices, setSimulationPrices] = useState<Record<string, string>>({});

  const handleSimPriceChange = (productId: string, val: string) => {
    setSimulationPrices(prev => ({
      ...prev,
      [productId]: val
    }));
  };

  return (
    <div id="alerts-tracker-dashboard" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* Left Main Pane: Tracked Products & Registration (Takes 7 cols) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Tracked Products List */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm/5">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-950">Active Price Targets</h2>
                <p className="text-[11px] text-neutral-500 font-medium">Items currently scheduled for background cron scraping and evaluation</p>
              </div>
            </div>
            
            <button
              onClick={fetchTrackerData}
              disabled={isFetchingTracker}
              className="p-2 text-neutral-500 hover:text-neutral-900 bg-neutral-50 hover:bg-neutral-100 rounded-xl transition-all cursor-pointer border border-neutral-200"
              title="Refresh Tracker Data"
            >
              <RefreshCw className={`h-4 w-4 ${isFetchingTracker ? "animate-spin text-indigo-600" : ""}`} />
            </button>
          </div>

          {trackerError && (
            <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 text-xs text-rose-800 flex items-start space-x-2.5 mb-6">
              <AlertTriangle className="h-4 w-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p>{trackerError}</p>
            </div>
          )}

          {trackedProducts.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-200 bg-neutral-50/30 rounded-2xl p-12 text-center text-neutral-500 text-xs flex flex-col items-center justify-center space-y-3">
              <Bell className="h-10 w-10 text-neutral-300 animate-bounce" />
              <div className="space-y-1">
                <p className="font-bold text-neutral-700">No tracked items found</p>
                <p className="max-w-xs mx-auto">Use the <b>HTML Parser</b> tab to extract any product page, and click <b>Add to 24/7 Tracker</b>, or register one manually using the form below!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {trackedProducts.map(product => {
                const simPrice = simulationPrices[product.id] || "";
                const currentPriceVal = product.lastPrice || 0;
                const qualifiesForAlert = product.lastPrice !== null && product.lastPrice <= product.targetPrice;

                return (
                  <div 
                    key={product.id} 
                    className={`border rounded-2xl p-5 transition-all bg-white shadow-sm/5 ${
                      qualifiesForAlert 
                        ? "border-emerald-200 bg-gradient-to-br from-white to-emerald-50/5" 
                        : "border-neutral-200 hover:border-neutral-300"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            product.isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-neutral-100 text-neutral-400 border border-neutral-200"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${product.isActive ? "bg-emerald-600 animate-pulse" : "bg-neutral-400"}`}></span>
                            {product.isActive ? "Active Monitoring" : "Paused"}
                          </span>
                          
                          <span className="text-[10px] text-neutral-400 font-mono">ID: {product.id}</span>
                        </div>

                        <h3 className="text-xs font-bold text-neutral-900 leading-tight line-clamp-1">{product.title}</h3>
                        
                        <div className="text-[11px] text-neutral-500 flex flex-wrap gap-x-4 gap-y-1 pt-1 font-medium">
                          <span>Recipient: <b className="text-neutral-700">{product.email}</b></span>
                          <span>•</span>
                          <span>Last checked: <b className="text-neutral-700">{product.lastChecked || "Never"}</b></span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleToggleProduct(product.id)}
                          className="p-1.5 text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50 rounded-lg transition-all cursor-pointer"
                          title={product.isActive ? "Pause Monitoring" : "Resume Monitoring"}
                        >
                          {product.isActive ? (
                            <ToggleRight className="h-6 w-6 text-indigo-600" />
                          ) : (
                            <ToggleLeft className="h-6 w-6 text-neutral-400" />
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                          title="Stop Tracking"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    {/* Price Status Bento Box */}
                    <div className="grid grid-cols-3 gap-3 bg-neutral-50/60 rounded-xl p-3 mt-4 text-center border border-neutral-100">
                      <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Target Trigger</span>
                        <span className="text-xs font-extrabold text-neutral-900 font-mono">
                          {product.currencyCode} {product.targetPrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="border-x border-neutral-200">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Last Scraped</span>
                        <span className={`text-xs font-extrabold font-mono ${qualifiesForAlert ? "text-emerald-700" : "text-neutral-900"}`}>
                          {product.lastPrice !== null ? `${product.currencyCode} ${product.lastPrice.toFixed(2)}` : "Pending"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block">Status</span>
                        <span className={`text-[10px] font-extrabold ${qualifiesForAlert ? "text-emerald-700" : "text-neutral-600"}`}>
                          {qualifiesForAlert ? "🚀 ALERT HIT!" : "Monitoring"}
                        </span>
                      </div>
                    </div>

                    {/* Simulation Panel for demo */}
                    <div className="bg-indigo-50/30 border border-indigo-100 rounded-xl p-3 mt-4 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center space-x-2 text-[11px] text-indigo-950">
                        <Info className="h-4 w-4 text-indigo-600 flex-shrink-0" />
                        <span><b>Test Price Drops instantly:</b> Enter a new price below to simulate.</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          placeholder={`Price (e.g. ${(product.targetPrice * 0.9).toFixed(0)})`}
                          value={simPrice}
                          onChange={(e) => handleSimPriceChange(product.id, e.target.value)}
                          className="w-24 px-2 py-1 bg-white border border-neutral-200 rounded-lg text-xs font-mono text-center"
                        />
                        <button
                          onClick={() => {
                            if (!simPrice) return;
                            handleSimulatePrice(product.id, Number(simPrice));
                            handleSimPriceChange(product.id, "");
                          }}
                          disabled={!simPrice}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center space-x-1"
                        >
                          <Play className="h-3 w-3 fill-current" />
                          <span>Simulate</span>
                        </button>
                      </div>
                    </div>

                    {/* Mini Sparkline logs */}
                    {product.history && product.history.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-neutral-100">
                        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                          <History className="h-3 w-3" /> Historical Log Stream
                        </span>
                        <div className="flex items-center space-x-2 overflow-x-auto py-1 pr-1">
                          {product.history.map((h, idx) => (
                            <div key={idx} className="bg-neutral-100/75 border border-neutral-200 rounded-md px-2 py-1 text-[9px] font-mono text-neutral-500 flex-shrink-0">
                              <span className="text-neutral-400 block">{h.timestamp.split(', ')[1] || h.timestamp}</span>
                              <b className="text-neutral-800">{product.currencyCode} {h.price.toFixed(2)}</b>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Manual Tracker Form Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm/5">
          <div className="flex items-center space-x-2.5 mb-5">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-950">Add Custom Product Manually</h2>
              <p className="text-[11px] text-neutral-500 font-medium">Inject raw HTML source and configure alerts for any product 24/7</p>
            </div>
          </div>

          <form onSubmit={handleAddTrackedProduct} className="space-y-4">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Echo Dot Smart Speaker"
                  value={trackTitle}
                  onChange={(e) => setTrackTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 rounded-xl text-xs transition-all outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Alert Target Price ({trackCurrency}) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs text-neutral-400 font-bold">{trackCurrency}</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 45.00"
                    value={trackTargetPrice}
                    onChange={(e) => setTrackTargetPrice(e.target.value)}
                    className="w-full pl-12 pr-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 rounded-xl text-xs transition-all outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Subscriber Alert Email *</label>
                <input
                  type="email"
                  placeholder="e.g. my-alerts@example.com"
                  value={trackEmail}
                  onChange={(e) => setTrackEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 rounded-xl text-xs transition-all outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Currency Code</label>
                <select
                  value={trackCurrency}
                  onChange={(e) => setTrackCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 rounded-xl text-xs transition-all outline-none font-bold text-neutral-800"
                >
                  <option value="USD">USD ($)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">Raw HTML Content Source *</label>
                <button
                  type="button"
                  onClick={() => {
                    // Populate from preloaded Echo Dot sample for speed
                    setTrackHtml(`<html><body><div class="product-info"><h1>Echo Dot Speaker (5th Gen)</h1><span class="price">$49.99</span></div></body></html>`);
                  }}
                  className="text-[10px] text-indigo-600 hover:underline font-bold"
                >
                  Load Sample HTML
                </button>
              </div>
              <textarea
                placeholder="Paste the product webpage's HTML here. Gemini will scan this content automatically during tracking intervals to find the live price!"
                rows={5}
                value={trackHtml}
                onChange={(e) => setTrackHtml(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 focus:bg-white focus:border-neutral-900 rounded-xl text-xs transition-all outline-none font-mono"
              ></textarea>
            </div>

            {trackMessage && (
              <div className={`p-3 rounded-xl text-xs ${
                trackMessage.startsWith("Success")
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                  : "bg-rose-50 text-rose-800 border border-rose-100"
              }`}>
                {trackMessage}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-4 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Register Product for Background 24/7 Monitoring</span>
            </button>
          </form>
        </div>

      </div>

      {/* Right Sidebar Pane: Automation Center & Mail Outbox Logs (Takes 5 cols) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* CRON Scheduler Card */}
        <div className="bg-neutral-950 text-white rounded-2xl border border-neutral-800 p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 h-28 w-28 bg-indigo-500 rounded-full -mr-8 -mt-8 opacity-10 blur-xl pointer-events-none"></div>
          
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-900/30">
              <Clock className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider block">Automation Cron Core</span>
              <h3 className="text-sm font-bold text-white tracking-tight">Active node-cron Service</h3>
            </div>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed mb-4">
            A background daemon is configured using <code>node-cron</code> to automatically parse active targets 24/7. It utilizes the Gemini AI model to fetch and structured-parse prices at set intervals.
          </p>

          <div className="bg-neutral-900 rounded-xl p-3 border border-neutral-800 text-[11px] mb-4 space-y-1">
            <div className="flex justify-between text-neutral-400">
              <span>CRON Interval:</span>
              <b className="text-indigo-400">Every 30 Minutes</b>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Task Engine:</span>
              <b className="text-neutral-200">Gemini-3.5-Flash</b>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>Alert Library:</span>
              <b className="text-neutral-200">nodemailer (with SMTP bypass)</b>
            </div>
          </div>

          <button
            onClick={handleTriggerCron}
            disabled={isTriggeringCron}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center space-x-2"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTriggeringCron ? "animate-spin" : ""}`} />
            <span>Force Run Tracker Cycle Now 🚀</span>
          </button>
        </div>

        {/* Sent Alerts Outbox Log (Nodemailer logs) */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm/5">
          <div className="flex items-center space-x-2.5 mb-4">
            <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-950">Sent Alerts Outbox</h2>
              <p className="text-[11px] text-neutral-500 font-medium">Outbound email logs dispatched by nodemailer</p>
            </div>
          </div>

          <p className="text-[11px] text-neutral-400 leading-relaxed mb-4">
            If your SMTP environment variables are not configured in <code>.env</code>, outbound emails fall back gracefully to **Simulated Outbox Mode** and log details below.
          </p>

          {alertLogs.length === 0 ? (
            <div className="border-2 border-dashed border-neutral-100 rounded-xl p-8 text-center text-neutral-400 text-xs flex flex-col items-center justify-center space-y-2">
              <Mail className="h-6 w-6 text-neutral-300" />
              <p>No outbound email alerts sent yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {alertLogs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="p-3 border border-neutral-150 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 hover:border-neutral-300 cursor-pointer text-left transition-all text-xs"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                      log.status === 'sent'
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-100"
                        : log.status === 'failed'
                        ? "bg-rose-50 text-rose-800 border border-rose-100"
                        : "bg-indigo-50 text-indigo-800 border border-indigo-100"
                    }`}>
                      {log.status === 'sent' ? 'SMTP Sent' : log.status === 'failed' ? 'Failed' : 'Simulated'}
                    </span>
                    <span className="text-[9px] text-neutral-400 font-mono">{log.timestamp.split(', ')[1] || log.timestamp}</span>
                  </div>
                  <h4 className="font-bold text-neutral-800 truncate mb-0.5">{log.subject}</h4>
                  <p className="text-[10px] text-neutral-500 font-medium truncate">To: {log.recipient}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Email Body Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden border border-neutral-200 shadow-2xl animate-in fade-in zoom-in-95 duration-150 flex flex-col">
            
            {/* Modal Header */}
            <div className="bg-neutral-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Mail className="h-5 w-5 text-indigo-400" />
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-neutral-400">SMTP Outbox Dispatch</h3>
                  <p className="text-sm font-bold text-white line-clamp-1">{selectedLog.productTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-neutral-400 hover:text-white font-bold text-xs p-1.5 rounded-lg hover:bg-neutral-800 cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-4 overflow-y-auto max-h-[450px]">
              <div className="space-y-1.5 border-b border-neutral-100 pb-3 text-xs text-neutral-500">
                <div className="flex justify-between">
                  <span>To:</span>
                  <b className="text-neutral-800">{selectedLog.recipient}</b>
                </div>
                <div className="flex justify-between">
                  <span>Subject:</span>
                  <b className="text-neutral-800 truncate">{selectedLog.subject}</b>
                </div>
                <div className="flex justify-between">
                  <span>Delivered At:</span>
                  <b className="text-neutral-800 font-mono">{selectedLog.timestamp}</b>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <b className={`uppercase font-mono text-[9px] px-1.5 rounded ${
                    selectedLog.status === 'sent' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-indigo-50 text-indigo-800 border border-indigo-100'
                  }`}>
                    {selectedLog.status}
                  </b>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Message Plain Text</span>
                <pre className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-[11px] text-neutral-800 font-mono whitespace-pre-wrap leading-relaxed">
                  {selectedLog.body}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-neutral-50 border-t border-neutral-100 p-4 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
