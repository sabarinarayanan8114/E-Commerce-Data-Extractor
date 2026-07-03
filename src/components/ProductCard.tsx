import React from "react";
import { ProductData } from "../types";
import { 
  ShoppingBag, 
  Tag, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  CheckCircle, 
  XCircle, 
  Percent 
} from "lucide-react";

interface ProductCardProps {
  productData: ProductData | null;
  isLoading: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ productData, isLoading }) => {
  if (isLoading) {
    return (
      <div id="product-card-skeleton" className="border border-neutral-100 bg-white rounded-2xl p-6 shadow-sm animate-pulse space-y-4">
        <div className="h-4 bg-neutral-100 rounded w-1/4"></div>
        <div className="h-40 bg-neutral-50 rounded-xl flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-neutral-300 animate-spin" />
        </div>
        <div className="space-y-2">
          <div className="h-6 bg-neutral-100 rounded w-3/4"></div>
          <div className="h-4 bg-neutral-100 rounded w-1/2"></div>
        </div>
        <div className="pt-4 border-t border-neutral-100 flex justify-between">
          <div className="h-8 bg-neutral-100 rounded w-1/3"></div>
          <div className="h-8 bg-neutral-100 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  if (!productData) {
    return (
      <div id="product-card-empty" className="border-2 border-dashed border-neutral-200 bg-neutral-50/50 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
        <div className="p-3 bg-neutral-100 rounded-full text-neutral-400 mb-4">
          <ShoppingBag className="h-6 w-6" />
        </div>
        <h3 className="text-neutral-700 font-medium text-base mb-1">No Extraction Selected</h3>
        <p className="text-neutral-500 text-sm max-w-sm">
          Select a sample template or paste HTML on the left and run the extractor to generate a live product preview card.
        </p>
      </div>
    );
  }

  const { productTitle, currentPrice, currencyCode, additionalFields } = productData;

  // Format currency nicely
  const formatPrice = (price: number | null, currency: string | null) => {
    if (price === null) return "N/A";
    const code = currency || "USD";
    try {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: code,
        maximumFractionDigits: 2
      }).format(price);
    } catch {
      // Fallback
      const symbols: Record<string, string> = {
        USD: "$",
        INR: "₹",
        GBP: "£",
        EUR: "€",
        JPY: "¥"
      };
      const sym = symbols[code] || code + " ";
      return `${sym}${price}`;
    }
  };

  // Determine an icon and gradient color based on product title
  const getProductVisualProps = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes("echo") || lower.includes("speaker") || lower.includes("alexa")) {
      return {
        bgGradient: "from-blue-50 to-indigo-100 text-indigo-600",
        label: "Smart Device",
        icon: Sparkles
      };
    }
    if (lower.includes("earphone") || lower.includes("headphone") || lower.includes("rockerz") || lower.includes("audio")) {
      return {
        bgGradient: "from-amber-50 to-orange-100 text-orange-600",
        label: "Audio Accessory",
        icon: Layers
      };
    }
    if (lower.includes("kindle") || lower.includes("book") || lower.includes("gatsby") || lower.includes("paper")) {
      return {
        bgGradient: "from-emerald-50 to-teal-100 text-emerald-600",
        label: "Reading & E-Reader",
        icon: Tag
      };
    }
    return {
      bgGradient: "from-neutral-50 to-slate-100 text-slate-600",
      label: "E-Commerce Product",
      icon: ShoppingBag
    };
  };

  const visualProps = getProductVisualProps(productTitle);
  const IconComponent = visualProps.icon;

  return (
    <div id="product-card-preview" className="border border-neutral-200 bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Visual Badge Header */}
      <div className={`px-6 py-4 bg-gradient-to-r ${visualProps.bgGradient} flex justify-between items-center border-b border-neutral-100`}>
        <div className="flex items-center space-x-2">
          <IconComponent className="h-4.5 w-4.5" />
          <span className="text-xs font-semibold uppercase tracking-wider">{visualProps.label}</span>
        </div>
        <div className="flex items-center space-x-1">
          {currentPrice !== null ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
              <CheckCircle className="h-3 w-3 mr-1" /> Active Price
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 text-neutral-800">
              <XCircle className="h-3 w-3 mr-1" /> Unavailable
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Title */}
        <h3 className="text-neutral-800 font-semibold text-lg leading-snug tracking-tight">
          {productTitle}
        </h3>

        {/* Pricing Summary */}
        <div className="flex items-baseline justify-between py-3 border-y border-neutral-100">
          <div>
            <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mb-0.5">Current Price</p>
            {currentPrice !== null ? (
              <div className="flex items-baseline space-x-1">
                <span className="text-2xl font-bold text-neutral-950">
                  {formatPrice(currentPrice, currencyCode)}
                </span>
                <span className="text-xs font-medium text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded">
                  {currencyCode}
                </span>
              </div>
            ) : (
              <span className="text-lg font-semibold text-neutral-500 italic">
                Price Not Found (null)
              </span>
            )}
          </div>

          {currentPrice !== null && (
            <div className="text-right">
              <p className="text-neutral-400 text-xs font-medium uppercase tracking-wider mb-0.5">Currency</p>
              <span className="text-sm font-semibold text-neutral-700 bg-neutral-50 border border-neutral-200 px-2 py-0.5 rounded">
                {currencyCode || "None"}
              </span>
            </div>
          )}
        </div>

        {/* Dynamic Additional Fields */}
        {additionalFields && Object.keys(additionalFields).length > 0 ? (
          <div>
            <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Extracted Custom Fields</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(additionalFields).map(([key, value]) => {
                let formattedValue = String(value);
                if (typeof value === 'boolean') {
                  formattedValue = value ? "Yes" : "No";
                }

                // Make keys nice
                const label = key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, (str) => str.toUpperCase());

                return (
                  <div key={key} className="bg-neutral-50 border border-neutral-100 rounded-xl p-3 flex flex-col justify-between">
                    <span className="text-[11px] font-medium text-neutral-400">{label}</span>
                    <span className="text-sm font-semibold text-neutral-800 mt-0.5 truncate" title={formattedValue}>
                      {formattedValue || "—"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-2 text-neutral-400 text-xs italic">
            No additional custom schema fields extracted yet. Use the fields configuration panel to specify rating, brand, or stock status!
          </div>
        )}
      </div>
    </div>
  );
};
