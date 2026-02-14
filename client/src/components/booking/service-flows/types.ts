export interface ServiceFlowProps {
  onComplete: (data: ServiceFlowResult) => void;
  onBack?: () => void;
  propertyData?: {
    bedrooms?: number | null;
    bathrooms?: number | null;
    livingArea?: number | null;
    sqftRange?: string;
    stories?: string;
  };
}

export interface ServiceFlowResult {
  quoteMethod: "manual";
  serviceType: string;
  estimatedPrice: number;
  monthlyPrice?: number;
  isRecurring?: boolean;
  userInputs: Record<string, any>;
  requiresHitlValidation: boolean;
  lineItems: Array<{ label: string; price: number; quantity?: number }>;
  discounts?: Array<{ label: string; amount: number }>;
}

export const AI_SCAN_SERVICES = [
  "carpet_cleaning",
  "landscaping",
  "pressure_washing",
  "light_demolition",
];

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(val);
}
