import type { Metadata } from "next";
import { DB_UPDATED, EDITORIAL_TEAM } from "@/lib/authorship";

export const METHODOLOGY_URL = "/methodology";

export function getReviewedAt() {
  return DB_UPDATED;
}

export function getReviewedBy() {
  return EDITORIAL_TEAM.name;
}

export function buildDbPageRobots(index: boolean): NonNullable<Metadata["robots"]> {
  return {
    index,
    follow: true,
    googleBot: {
      index,
      follow: true,
      "max-image-preview": "large",
    },
  };
}

export function buildTrustUpdatedLabel(dataVintage: string): string {
  return `Data verified ${DB_UPDATED} · data snapshot ${dataVintage}`;
}

export function getDbPageGate({
  alternativeLinkCount,
  dataVintage,
  topAnswer,
}: {
  alternativeLinkCount: number;
  dataVintage: string;
  topAnswer: string;
}) {
  const sentenceCount = topAnswer
    .split(/[.!?]+/)
    .map((part) => part.trim())
    .filter(Boolean).length;

  return {
    pass:
      sentenceCount >= 2 &&
      alternativeLinkCount >= 3 &&
      Boolean(DB_UPDATED) &&
      Boolean(EDITORIAL_TEAM.name) &&
      Boolean(dataVintage) &&
      Boolean(METHODOLOGY_URL),
  };
}
