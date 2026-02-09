import { describe, it, expect, vi } from 'vitest';

// Mock the storage module to avoid database dependency
vi.mock('../storage', () => ({
  storage: {
    getEsgImpactLogByRequest: vi.fn(),
    getServiceRequest: vi.fn(),
    createCarbonCredit: vi.fn(),
    getBusinessAccount: vi.fn(),
    updateBusinessAccount: vi.fn(),
  },
}));

// Set DATABASE_URL for any code that checks it
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/uptend_test';

const { CARBON_CREDIT_MARKET_VALUE, estimateCarbonCreditRevenue } = await import('./carbonCreditService');

describe('Carbon Credit Service', () => {
  describe('estimateCarbonCreditRevenue', () => {
    it('should calculate annual credits for a small HOA', () => {
      const result = estimateCarbonCreditRevenue({
        numberOfProperties: 50,
        avgJobsPerPropertyPerYear: 0.3,
        avgWeightPerJobLbs: 500,
        diversionRate: 0.65,
      });

      expect(result.annualCredits).toBeGreaterThan(0);
      expect(result.monthlyCredits).toBe(Math.round((result.annualCredits / 12) * 100) / 100);
      expect(result.annualRevenueAvg).toBe(
        Math.round(result.annualCredits * CARBON_CREDIT_MARKET_VALUE.voluntary_avg)
      );
    });

    it('should calculate higher credits for larger HOAs', () => {
      const small = estimateCarbonCreditRevenue({ numberOfProperties: 50 });
      const large = estimateCarbonCreditRevenue({ numberOfProperties: 200 });

      expect(large.annualCredits).toBeGreaterThan(small.annualCredits);
      expect(large.annualRevenueAvg).toBeGreaterThan(small.annualRevenueAvg);
    });

    it('should use default values when optional params are not provided', () => {
      const result = estimateCarbonCreditRevenue({ numberOfProperties: 100 });

      expect(result.annualCredits).toBeGreaterThan(0);
      expect(result.annualRevenueLow).toBeLessThan(result.annualRevenueAvg);
      expect(result.annualRevenueAvg).toBeLessThan(result.annualRevenueHigh);
    });

    it('should scale with diversion rate', () => {
      const lowDiversion = estimateCarbonCreditRevenue({
        numberOfProperties: 100,
        diversionRate: 0.5,
      });
      const highDiversion = estimateCarbonCreditRevenue({
        numberOfProperties: 100,
        diversionRate: 0.8,
      });

      expect(highDiversion.annualCredits).toBeGreaterThan(lowDiversion.annualCredits);
    });
  });

  describe('CARBON_CREDIT_MARKET_VALUE', () => {
    it('should have correct market value hierarchy', () => {
      expect(CARBON_CREDIT_MARKET_VALUE.voluntary_low).toBeLessThan(
        CARBON_CREDIT_MARKET_VALUE.voluntary_avg
      );
      expect(CARBON_CREDIT_MARKET_VALUE.voluntary_avg).toBeLessThan(
        CARBON_CREDIT_MARKET_VALUE.voluntary_high
      );
      expect(CARBON_CREDIT_MARKET_VALUE.voluntary_high).toBeLessThan(
        CARBON_CREDIT_MARKET_VALUE.compliance_avg
      );
      expect(CARBON_CREDIT_MARKET_VALUE.compliance_avg).toBeLessThan(
        CARBON_CREDIT_MARKET_VALUE.verified_premium
      );
    });
  });
});
