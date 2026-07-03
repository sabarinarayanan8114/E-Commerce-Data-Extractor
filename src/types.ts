export interface ProductData {
  productTitle: string;
  currentPrice: number | null;
  currencyCode: string | null;
  additionalFields?: Record<string, any>;
}

export interface ExtractionResult {
  id: string;
  timestamp: string;
  rawInputLength: number;
  extractedData: ProductData | null;
  prompt: string;
  success: boolean;
  error: string | null;
}

export interface SampleHTML {
  id: string;
  label: string;
  description: string;
  html: string;
}

export interface ExtractionField {
  key: string;
  label: string;
  description: string;
  type: 'STRING' | 'NUMBER' | 'BOOLEAN';
  enabled: boolean;
}

export interface PriceAnalysisData {
  status: 'alert' | 'no-alert' | 'error';
  reason: string;
  current_price: number;
  recommendation: 'Buy' | 'Wait';
}

export interface PriceAnalysisResult {
  id: string;
  timestamp: string;
  productTitle: string;
  currentPrice: number;
  currencyCode: string;
  typicalPrice: number;
  low30Days: number | null;
  analysis: PriceAnalysisData | null;
  prompt: string;
  success: boolean;
  error: string | null;
}

export interface TrackedProduct {
  id: string;
  title: string;
  targetPrice: number;
  currencyCode: string;
  email: string;
  lastPrice: number | null;
  lastChecked: string | null;
  history: Array<{ timestamp: string; price: number }>;
  htmlSource: string;
  isActive: boolean;
}

export interface AlertLog {
  id: string;
  productTitle: string;
  currentPrice: number;
  targetPrice: number;
  recipient: string;
  timestamp: string;
  status: 'sent' | 'simulated' | 'failed';
  subject: string;
  body: string;
}

