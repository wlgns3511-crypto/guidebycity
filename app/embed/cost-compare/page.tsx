import { Metadata } from "next";
import { CostCompareCalculator } from "@/components/CostCompareCalculator";

export const metadata: Metadata = {
  title: "Cost Compare Calculator - Embeddable Widget",
  robots: "noindex, nofollow",
};

export default function EmbedCostComparePage() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <CostCompareCalculator cityName="" defaultCostIndex={100} />
      <p style={{ textAlign: "center", fontSize: 11, color: "#94a3b8", marginTop: 12 }}>
        Powered by{" "}
        <a href="https://guidebycity.com" target="_blank" rel="noopener" style={{ color: "#3b82f6", textDecoration: "underline" }}>
          GuideByCity
        </a>
      </p>
    </div>
  );
}
