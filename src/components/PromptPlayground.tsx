import React, { useState } from "react";
import { ExtractionField } from "../types";
import { Code, Terminal, Sparkles, Copy, Check } from "lucide-react";

interface PromptPlaygroundProps {
  htmlSnippet: string;
  customFields: ExtractionField[];
}

export const PromptPlayground: React.FC<PromptPlaygroundProps> = ({ htmlSnippet, customFields }) => {
  const [copied, setCopied] = useState(false);

  // Generate python preview
  const generatePythonPreview = () => {
    const fieldsList = [
      "1. Product Title",
      "2. Current Price (as a float, exclude currency symbols)",
      "3. Currency Code (e.g., INR, USD)"
    ];

    let count = 4;
    customFields.forEach(field => {
      if (field.enabled) {
        fieldsList.push(`${count}. ${field.label} (${field.type.toLowerCase()})`);
        count++;
      }
    });

    const fieldsString = fieldsList.map(f => `   ${f}`).join("\n");

    return `# Python code from your developer environment:
from bs4 import BeautifulSoup
import google.generativeai as genai

# Prepare the BeautifulSoup object to extract text or keep raw structure
soup = BeautifulSoup(html_content, 'html.parser')

# Construct the Gemini API Prompt
prompt = f"""
You are an expert E-commerce Data Extraction Specialist. 
Analyze the following HTML content from an Amazon product page and extract the following information in JSON format:

${fieldsList.map(f => f.replace(/^\d+\.\s*/, '- ')).join("\n")}

HTML Content:
{soup.get_text()[:5000]} 

Instructions:
- If the price is not found, return 'null' for the price field.
- Ensure the output is strictly valid JSON with no extra text or explanations.
"""

# Call the Gemini model to parse e-commerce data
model = genai.GenerativeModel("gemini-3.5-flash")
response = model.generate_content(prompt)
print(response.text)`;
  };

  const pythonCode = generatePythonPreview();

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="prompt-playground" className="bg-neutral-900 text-neutral-100 rounded-2xl overflow-hidden border border-neutral-800 shadow-sm flex flex-col h-full min-h-[400px]">
      {/* Tab Header */}
      <div className="px-5 py-4 bg-neutral-950 border-b border-neutral-800 flex justify-between items-center">
        <div className="flex items-center space-x-2.5">
          <Terminal className="h-4.5 w-4.5 text-neutral-400" />
          <span className="text-sm font-semibold tracking-tight text-neutral-200">Python Script Compilation</span>
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy Python</span>
            </>
          )}
        </button>
      </div>

      {/* Code Area */}
      <div className="p-5 flex-1 font-mono text-xs leading-relaxed overflow-auto max-h-[500px]">
        <pre className="text-neutral-300 whitespace-pre">
          {pythonCode.split("\n").map((line, idx) => {
            // Very simple simulated python highlighter
            let className = "text-neutral-300";
            if (line.startsWith("#")) {
              className = "text-neutral-500 italic"; // comments
            } else if (line.startsWith("import ") || line.startsWith("from ")) {
              className = "text-indigo-400"; // imports
            } else if (line.includes("f\"\"\"") || line.includes("\"\"\"") || line.startsWith("    - ") || line.startsWith("You are an ") || line.startsWith("Analyze the ") || line.startsWith("Instructions:")) {
              className = "text-amber-300/90"; // docstrings/prompts
            } else if (line.includes("def ") || line.includes("print(")) {
              className = "text-emerald-400"; // keyword/func
            }
            return (
              <div key={idx} className="flex hover:bg-neutral-800/40 px-1 py-0.5 rounded transition-colors">
                <span className="w-8 select-none text-neutral-600 text-right pr-3">{idx + 1}</span>
                <span className={className}>{line}</span>
              </div>
            );
          })}
        </pre>
      </div>

      {/* Bottom info section */}
      <div className="px-5 py-4 bg-neutral-950 border-t border-neutral-800 text-xs text-neutral-400 flex items-center space-x-2">
        <Sparkles className="h-4 w-4 text-indigo-400 flex-shrink-0" />
        <p>
          We use Gemini's <b className="text-neutral-200">Structured JSON Output</b> mode server-side. This guarantees the model outputs flawless JSON adhering strictly to the properties and data types you define above.
        </p>
      </div>
    </div>
  );
};
