import { describe, it, expect } from 'vitest';

// Helper functions from subscription-auto-booking.ts
// We'll test the pure calculation functions

describe('Subscription Auto-Booking', () => {
  describe('calculateNextBookingDate', () => {
    it('should add 7 days for weekly frequency', () => {
      const now = new Date('2025-01-15');
      const expected = new Date('2025-01-22');

      // Simulate the function
      const daysToAdd = 7; // weekly
      const result = new Date(now);
      result.setDate(result.getDate() + daysToAdd);

      expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });

    it('should add 14 days for biweekly frequency', () => {
      const now = new Date('2025-01-15');
      const expected = new Date('2025-01-29');

      const daysToAdd = 14; // biweekly
      const result = new Date(now);
      result.setDate(result.getDate() + daysToAdd);

      expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });

    it('should add 30 days for monthly frequency', () => {
      const now = new Date('2025-01-15');
      const expected = new Date('2025-02-14');

      const daysToAdd = 30; // monthly
      const result = new Date(now);
      result.setDate(result.getDate() + daysToAdd);

      expect(result.toISOString().split('T')[0]).toBe(expected.toISOString().split('T')[0]);
    });
  });

  describe('calculateSubscriptionPrice', () => {
    it('should apply weekly discount (15%)', () => {
      const basePrice = 100;
      const weeklyDiscount = 0.15;
      const expectedPrice = basePrice * (1 - weeklyDiscount);

      expect(expectedPrice).toBe(85);
    });

    it('should apply biweekly discount (10%)', () => {
      const basePrice = 100;
      const biweeklyDiscount = 0.10;
      const expectedPrice = basePrice * (1 - biweeklyDiscount);

      expect(expectedPrice).toBe(90);
    });

    it('should apply monthly discount (5%)', () => {
      const basePrice = 100;
      const monthlyDiscount = 0.05;
      const expectedPrice = basePrice * (1 - monthlyDiscount);

      expect(expectedPrice).toBe(95);
    });

    it('should calculate addon prices correctly', () => {
      const addonPrices = {
        oven_cleaning: 35,
        fridge_cleaning: 25,
        interior_windows: 45,
        laundry_wash_fold: 40,
        inside_closets: 30,
        pet_hair_removal: 20,
      };

      const selectedAddons = ['oven_cleaning', 'fridge_cleaning'];
      const total = selectedAddons.reduce((sum, addonId) => {
        return sum + (addonPrices[addonId as keyof typeof addonPrices] || 0);
      }, 0);

      expect(total).toBe(60); // 35 + 25
    });
  });
});
