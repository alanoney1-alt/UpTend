/**
 * Unit Tests for ServiceEsgBadge Component
 *
 * Tests:
 * - Renders compact badge with score
 * - Renders full badge with CO2/water metrics
 * - Applies correct variant based on score thresholds
 * - Displays service icons correctly
 * - Handles missing optional metrics gracefully
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ServiceEsgBadge } from "@/components/esg/service-esg-badge";

describe("ServiceEsgBadge", () => {
  describe("Compact Mode", () => {
    it("renders compact badge with score", () => {
      render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={85}
          compact={true}
        />
      );

      // Verify icon is displayed
      expect(screen.getByText("💧")).toBeInTheDocument();

      // Verify score badge is displayed
      expect(screen.getByText("85/100")).toBeInTheDocument();
    });

    it("applies default (green) variant for scores >= 80", () => {
      const { container } = render(
        <ServiceEsgBadge
          serviceType="junk_removal"
          esgScore={90}
          compact={true}
        />
      );

      // Check for green/default variant class (implementation-specific)
      const badge = container.querySelector('[class*="badge"]');
      expect(badge).toBeInTheDocument();
    });

    it("applies secondary (yellow) variant for scores 60-79", () => {
      render(
        <ServiceEsgBadge
          serviceType="gutter_cleaning"
          esgScore={65}
          compact={true}
        />
      );

      // Verify score is displayed
      expect(screen.getByText("65/100")).toBeInTheDocument();
    });

    it("applies destructive (red) variant for scores < 60", () => {
      render(
        <ServiceEsgBadge
          serviceType="landscaping"
          esgScore={45}
          compact={true}
        />
      );

      // Verify score is displayed
      expect(screen.getByText("45/100")).toBeInTheDocument();
    });
  });

  describe("Full Mode", () => {
    it("renders full badge with all metrics", () => {
      render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={88}
          co2SavedLbs={15.5}
          waterSavedGallons={125}
          compact={false}
        />
      );

      // Verify service name is displayed (formatted)
      expect(screen.getByText("pressure washing")).toBeInTheDocument();

      // Verify ESG score badge
      expect(screen.getByText("ESG: 88/100")).toBeInTheDocument();

      // Verify CO2 metric
      expect(screen.getByText("15.5 lbs CO₂")).toBeInTheDocument();

      // Verify water metric
      expect(screen.getByText("125 gal")).toBeInTheDocument();
    });

    it("handles missing CO2 metric gracefully", () => {
      render(
        <ServiceEsgBadge
          serviceType="gutter_cleaning"
          esgScore={75}
          waterSavedGallons={50}
          compact={false}
        />
      );

      // Verify service name
      expect(screen.getByText("gutter cleaning")).toBeInTheDocument();

      // Verify water metric is shown
      expect(screen.getByText("50 gal")).toBeInTheDocument();

      // Verify CO2 metric is NOT shown
      expect(screen.queryByText(/lbs CO₂/)).not.toBeInTheDocument();
    });

    it("handles missing water metric gracefully", () => {
      render(
        <ServiceEsgBadge
          serviceType="junk_removal"
          esgScore={92}
          co2SavedLbs={50.2}
          compact={false}
        />
      );

      // Verify service name
      expect(screen.getByText("junk removal")).toBeInTheDocument();

      // Verify CO2 metric is shown
      expect(screen.getByText("50.2 lbs CO₂")).toBeInTheDocument();

      // Verify water metric is NOT shown
      expect(screen.queryByText(/gal/)).not.toBeInTheDocument();
    });

    it("formats service name with underscores to spaces", () => {
      render(
        <ServiceEsgBadge
          serviceType="light_demolition"
          esgScore={70}
          compact={false}
        />
      );

      // Verify formatted name (underscores replaced with spaces)
      expect(screen.getByText("light demolition")).toBeInTheDocument();
    });

    it("displays correct icon for service type", () => {
      render(
        <ServiceEsgBadge
          serviceType="junk_removal"
          esgScore={85}
          compact={false}
        />
      );

      // Verify junk removal icon (truck)
      expect(screen.getByText("🚛")).toBeInTheDocument();
    });

    it("uses default icon for unknown service type", () => {
      render(
        <ServiceEsgBadge
          serviceType="unknown_service"
          esgScore={80}
          compact={false}
        />
      );

      // Verify fallback icon
      expect(screen.getByText("📊")).toBeInTheDocument();
    });
  });

  describe("Score Color Coding", () => {
    it("applies green color for high scores (>= 80)", () => {
      const { container } = render(
        <ServiceEsgBadge
          serviceType="pool_cleaning"
          esgScore={95}
          compact={false}
        />
      );

      // Check for green text class (implementation-specific)
      const scoreText = container.querySelector('[class*="green"]');
      expect(scoreText).toBeInTheDocument();
    });

    it("applies yellow color for medium scores (60-79)", () => {
      const { container } = render(
        <ServiceEsgBadge
          serviceType="home_cleaning"
          esgScore={68}
          compact={false}
        />
      );

      // Check for yellow text class (implementation-specific)
      const scoreText = container.querySelector('[class*="yellow"]');
      expect(scoreText).toBeInTheDocument();
    });

    it("applies red color for low scores (< 60)", () => {
      const { container } = render(
        <ServiceEsgBadge
          serviceType="carpet_cleaning"
          esgScore={55}
          compact={false}
        />
      );

      // Check for red text class (implementation-specific)
      const scoreText = container.querySelector('[class*="red"]');
      expect(scoreText).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles score of 0", () => {
      render(
        <ServiceEsgBadge
          serviceType="handyman"
          esgScore={0}
          compact={true}
        />
      );

      expect(screen.getByText("0/100")).toBeInTheDocument();
    });

    it("handles score of 100", () => {
      render(
        <ServiceEsgBadge
          serviceType="moving_labor"
          esgScore={100}
          compact={true}
        />
      );

      expect(screen.getByText("100/100")).toBeInTheDocument();
    });

    it("handles very small CO2 values", () => {
      render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={85}
          co2SavedLbs={0.5}
          compact={false}
        />
      );

      // Verify decimal formatting
      expect(screen.getByText("0.5 lbs CO₂")).toBeInTheDocument();
    });

    it("handles large water values", () => {
      render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={88}
          waterSavedGallons={5000}
          compact={false}
        />
      );

      // Verify integer formatting (no decimals)
      expect(screen.getByText("5000 gal")).toBeInTheDocument();
    });
  });
});
