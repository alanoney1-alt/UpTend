/**
 * Unit Tests for ServiceEsgBadge Component
 *
 * Tests rendering of ESG badges with various score levels and metrics
 */

import { render, screen } from "@testing-library/react";
import { ServiceEsgBadge } from "@/components/esg/service-esg-badge";
import { describe, it, expect } from "vitest";

describe("ServiceEsgBadge Component", () => {
  describe("Compact Mode", () => {
    it("renders compact badge with high score (80+)", () => {
      render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={87}
          compact={true}
        />
      );

      const badge = screen.getByText(/87/);
      expect(badge).toBeInTheDocument();
    });

    it("renders compact badge with medium score (60-79)", () => {
      render(
        <ServiceEsgBadge
          serviceType="gutter_cleaning"
          esgScore={72}
          compact={true}
        />
      );

      const badge = screen.getByText(/72/);
      expect(badge).toBeInTheDocument();
    });

    it("renders compact badge with low score (<60)", () => {
      render(
        <ServiceEsgBadge
          serviceType="pool_cleaning"
          esgScore={45}
          compact={true}
        />
      );

      const badge = screen.getByText(/45/);
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Full Mode", () => {
    it("renders service label correctly", () => {
      render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={87}
          compact={false}
        />
      );

      expect(screen.getByText("Pressure Washing")).toBeInTheDocument();
    });

    it("displays CO2 savings when provided", () => {
      render(
        <ServiceEsgBadge
          serviceType="landscaping"
          esgScore={90}
          co2SavedLbs={25.5}
          compact={false}
        />
      );

      expect(screen.getByText(/25.5 lbs CO₂/)).toBeInTheDocument();
    });

    it("displays water savings when provided", () => {
      render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={85}
          waterSavedGallons={192}
          compact={false}
        />
      );

      expect(screen.getByText(/192 gal/)).toBeInTheDocument();
    });

    it("displays both CO2 and water savings", () => {
      render(
        <ServiceEsgBadge
          serviceType="pool_cleaning"
          esgScore={88}
          co2SavedLbs={15.2}
          waterSavedGallons={450}
          compact={false}
        />
      );

      expect(screen.getByText(/15.2 lbs CO₂/)).toBeInTheDocument();
      expect(screen.getByText(/450 gal/)).toBeInTheDocument();
    });

    it("displays energy savings when provided", () => {
      render(
        <ServiceEsgBadge
          serviceType="landscaping"
          esgScore={92}
          energySavedKwh={5.3}
          compact={false}
        />
      );

      expect(screen.getByText(/5.3 kWh/)).toBeInTheDocument();
    });

    it("hides metrics section when no metrics provided", () => {
      const { container } = render(
        <ServiceEsgBadge
          serviceType="handyman"
          esgScore={75}
          compact={false}
        />
      );

      const metricsContainer = container.querySelector(".flex.gap-4");
      expect(metricsContainer).not.toBeInTheDocument();
    });
  });

  describe("Badge Variants by Score", () => {
    it("applies correct variant for high score (80+)", () => {
      const { container } = render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={85}
          compact={true}
        />
      );

      const badge = container.querySelector('[data-variant="default"]');
      expect(badge).toBeInTheDocument();
    });

    it("applies correct variant for medium score (60-79)", () => {
      const { container } = render(
        <ServiceEsgBadge
          serviceType="gutter_cleaning"
          esgScore={70}
          compact={true}
        />
      );

      const badge = container.querySelector('[data-variant="secondary"]');
      expect(badge).toBeInTheDocument();
    });

    it("applies correct variant for low score (<60)", () => {
      const { container } = render(
        <ServiceEsgBadge
          serviceType="home_cleaning"
          esgScore={55}
          compact={true}
        />
      );

      const badge = container.querySelector('[data-variant="destructive"]');
      expect(badge).toBeInTheDocument();
    });
  });

  describe("Service Type Labels", () => {
    it("displays friendly label for pressure_washing", () => {
      render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={87}
          compact={false}
        />
      );

      expect(screen.getByText("Pressure Washing")).toBeInTheDocument();
    });

    it("displays friendly label for junk_removal", () => {
      render(
        <ServiceEsgBadge
          serviceType="junk_removal"
          esgScore={92}
          compact={false}
        />
      );

      expect(screen.getByText("Junk Removal")).toBeInTheDocument();
    });

    it("falls back to formatted service type for unknown services", () => {
      render(
        <ServiceEsgBadge
          serviceType="unknown_service"
          esgScore={80}
          compact={false}
        />
      );

      expect(screen.getByText(/unknown service/i)).toBeInTheDocument();
    });
  });

  describe("Score Rounding", () => {
    it("rounds score to nearest integer", () => {
      render(
        <ServiceEsgBadge
          serviceType="landscaping"
          esgScore={87.6}
          compact={true}
        />
      );

      expect(screen.getByText(/88/)).toBeInTheDocument();
    });

    it("rounds CO2 to 1 decimal place", () => {
      render(
        <ServiceEsgBadge
          serviceType="pressure_washing"
          esgScore={85}
          co2SavedLbs={25.678}
          compact={false}
        />
      );

      expect(screen.getByText(/25.7 lbs CO₂/)).toBeInTheDocument();
    });

    it("rounds water to nearest integer", () => {
      render(
        <ServiceEsgBadge
          serviceType="pool_cleaning"
          esgScore={88}
          waterSavedGallons={192.8}
          compact={false}
        />
      );

      expect(screen.getByText(/193 gal/)).toBeInTheDocument();
    });
  });
});
