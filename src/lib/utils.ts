import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const SCHOOL_DAY_ORDER = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
] as const;

export const SCHOOL_DAY_LABELS: Record<(typeof SCHOOL_DAY_ORDER)[number], string> = {
  MONDAY: "Monday",
  TUESDAY: "Tuesday",
  WEDNESDAY: "Wednesday",
  THURSDAY: "Thursday",
  FRIDAY: "Friday",
};

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate an AccessID for a user based on their school code.
 * Format: KMC-XXXXXX or PRS-XXXXXX (6 random alphanumeric uppercase chars)
 */
export function generateAccessId(schoolCode: "KMC" | "PRS"): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${schoolCode}-${result}`;
}

/**
 * Format a number as Nigerian Naira currency.
 */
export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get initials from a full name.
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Calculate grade from a percentage score (Nigerian standard).
 */
export function calculateGrade(score: number): { grade: string; remark: string } {
  if (score >= 75) return { grade: "A", remark: "Excellent" };
  if (score >= 65) return { grade: "B", remark: "Very Good" };
  if (score >= 55) return { grade: "C", remark: "Good" };
  if (score >= 45) return { grade: "D", remark: "Fair" };
  if (score >= 35) return { grade: "E", remark: "Poor" };
  return { grade: "F", remark: "Fail" };
}

/**
 * Format ISO date string to readable format.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function getCurrentSchoolDay(date = new Date()): (typeof SCHOOL_DAY_ORDER)[number] | null {
  const weekday = date.getDay();

  if (weekday < 1 || weekday > 5) {
    return null;
  }

  return SCHOOL_DAY_ORDER[weekday - 1];
}

/**
 * Truncate text with ellipsis.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}
