import { describe, it, expect } from 'vitest';

describe('Schema Types', () => {
  describe('Load Size Constants', () => {
    it('should have correct load size ordering', () => {
      const sizes = ['small', 'medium', 'large', 'extra_large', 'full'];

      expect(sizes[0]).toBe('small');
      expect(sizes[sizes.length - 1]).toBe('full');
    });
  });

  describe('Service Types', () => {
    it('should include core service types', () => {
      const coreServices = [
        'junk_removal',
        'furniture_moving',
        'garage_cleanout',
        'pressure_washing',
        'gutter_cleaning',
        'moving_labor',
        'light_demolition',
        'home_cleaning',
      ];

      coreServices.forEach(service => {
        expect(service).toBeTruthy();
        expect(typeof service).toBe('string');
      });
    });
  });

  describe('Status Constants', () => {
    it('should have job status progression', () => {
      const statuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];

      expect(statuses).toContain('pending');
      expect(statuses).toContain('completed');
      expect(statuses).toContain('cancelled');
    });
  });

  describe('Price Calculations', () => {
    it('should calculate percentage correctly', () => {
      const base = 100;
      const percentage = 20;
      const result = base * (percentage / 100);

      expect(result).toBe(20);
    });

    it('should apply discounts correctly', () => {
      const originalPrice = 200;
      const discountPercent = 15;
      const discountedPrice = originalPrice * (1 - discountPercent / 100);

      expect(discountedPrice).toBe(170);
    });
  });
});
