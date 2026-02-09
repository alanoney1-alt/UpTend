/**
 * Multi-Service Discount Engine
 * Automatic discounts when booking 2+ services in one session
 */

export interface MultiServiceDiscount {
  serviceCount: number;
  discountPercent: number;
  label: string;
}

export const MULTI_SERVICE_DISCOUNTS: MultiServiceDiscount[] = [
  {
    serviceCount: 2,
    discountPercent: 5,
    label: "2 Services - 5% Off",
  },
  {
    serviceCount: 3,
    discountPercent: 10,
    label: "3 Services - 10% Off",
  },
  {
    serviceCount: 4,
    discountPercent: 15,
    label: "4+ Services - 15% Off",
  },
];

/**
 * Get multi-service discount percentage based on number of services
 */
export function getMultiServiceDiscount(serviceCount: number): {
  discountPercent: number;
  label: string;
} {
  if (serviceCount >= 4) {
    return {
      discountPercent: 15,
      label: "Multi-Service Discount (15%)",
    };
  }

  if (serviceCount === 3) {
    return {
      discountPercent: 10,
      label: "Multi-Service Discount (10%)",
    };
  }

  if (serviceCount === 2) {
    return {
      discountPercent: 5,
      label: "Multi-Service Discount (5%)",
    };
  }

  return {
    discountPercent: 0,
    label: "",
  };
}

/**
 * Calculate total price with multi-service discount applied
 */
export function calculateMultiServicePrice(services: { price: number }[]): {
  subtotal: number;
  discount: number;
  discountPercent: number;
  total: number;
  breakdown: {
    label: string;
    amount: number;
  }[];
} {
  const subtotal = services.reduce((sum, service) => sum + service.price, 0);
  const { discountPercent, label } = getMultiServiceDiscount(services.length);
  const discount = Math.round(subtotal * (discountPercent / 100));
  const total = subtotal - discount;

  const breakdown = [
    {
      label: "Services Subtotal",
      amount: subtotal,
    },
  ];

  if (discount > 0) {
    breakdown.push({
      label: label,
      amount: -discount,
    });
  }

  breakdown.push({
    label: "Total",
    amount: total,
  });

  return {
    subtotal,
    discount,
    discountPercent,
    total,
    breakdown,
  };
}

/**
 * Check if customer qualifies for multi-service discount
 */
export function qualifiesForMultiServiceDiscount(serviceCount: number): boolean {
  return serviceCount >= 2;
}
