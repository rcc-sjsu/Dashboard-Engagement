import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, "");

export const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL);
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NODE_ENV === "development"
    ? "http://localhost:3000"
    : "https://rcc-dashboard-engagement-web.vercel.app";
};


