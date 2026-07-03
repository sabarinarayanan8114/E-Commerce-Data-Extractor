import React, { useState } from "react";
import { Copy, Check, CheckCircle2 } from "lucide-react";

interface JsonViewerProps {
  jsonObj: any;
  title?: string;
}

export const JsonViewer: React.FC<JsonViewerProps> = ({ jsonObj, title = "JSON Output" }) => {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(jsonObj, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to colorize JSON string
  const colorizeJson = (jsonStr: string) => {
    if (!jsonStr) return "";
    
    // Regex matching keys, strings, numbers, booleans, null
    const parts = jsonStr.split(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g);
    
    return parts.map((part, index) => {
      if (!part) return null;
      
      let className = "text-neutral-300";
      
      if (/^"/.test(part)) {
        if (/:$/.test(part)) {
          className = "text-sky-400 font-medium"; // Key
        } else {
          className = "text-amber-300"; // String value
        }
      } else if (/^(true|false)$/.test(part)) {
        className = "text-emerald-400 font-semibold"; // Boolean
      } else if (/null/.test(part)) {
        className = "text-rose-400 font-semibold"; // Null
      } else if (/^-?\d/.test(part)) {
        className = "text-violet-400 font-medium"; // Number
      }
      
      return (
        <span key={index} className={className}>
          {part}
        </span>
      );
    });
  };

  return (
    <div id="json-viewer-container" className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden flex flex-col h-full min-h-[300px]">
      {/* Header */}
      <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{title}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center text-xs text-neutral-400 bg-neutral-800 px-2.5 py-1 rounded-lg">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" /> RFC 8259 Compliant
          </span>
          <button
            onClick={handleCopy}
            className="text-neutral-400 hover:text-neutral-200 p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            title="Copy JSON to clipboard"
          >
            {copied ? (
              <Check className="h-4.5 w-4.5 text-emerald-400" />
            ) : (
              <Copy className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>

      {/* Code body */}
      <div className="p-5 flex-1 font-mono text-xs overflow-auto max-h-[500px]">
        <pre className="whitespace-pre">{colorizeJson(jsonString)}</pre>
      </div>
    </div>
  );
};
