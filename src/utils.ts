/**
 * Currency conversion and formatting utilities for ProViva Wellness.
 * Exchange rate: 1 USD = 15.00 GHS (Ghana Cedis)
 */

export const EXCHANGE_RATE = 15.00;

export type CurrencyType = "USD" | "GHS";

/**
 * Converts a price in USD to GHS if the active currency is GHS.
 */
export function convertPrice(priceInUSD: number, currency: CurrencyType): number {
  if (currency === "GHS") {
    return priceInUSD * EXCHANGE_RATE;
  }
  return priceInUSD;
}

/**
 * Formats a price in USD to either GHS (GH₵) or USD ($).
 */
export function formatPrice(priceInUSD: number, currency: CurrencyType): string {
  const converted = convertPrice(priceInUSD, currency);
  if (currency === "GHS") {
    return `GH₵ ${converted.toLocaleString("en-GH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `$${converted.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Automatically generates a responsive srcSet and sizes configuration.
 * For Unsplash images, it generates width-scaled descriptors to optimize performance and data usage.
 * For local files, it provides double-density descriptor options (1x, 2x).
 */
export function generateSrcSet(src: string): { srcSet?: string; sizes?: string } {
  if (!src) return {};

  // Handle Unsplash images which support dynamic server-side resizing
  if (src.includes("unsplash.com")) {
    const baseUrl = src.split(/[?&]w=\d+/)[0]; // strip existing width param
    const joinChar = baseUrl.includes("?") ? "&" : "?";
    
    // Widths tailored for responsive layout breakpoints
    const widths = [320, 480, 640, 800, 1024, 1200, 1600];
    const srcSet = widths
      .map((w) => `${baseUrl}${joinChar}w=${w}&q=75&auto=format&fit=crop ${w}w`)
      .join(", ");

    return {
      srcSet,
      sizes: "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
    };
  }

  // Fallback for local storefront assets: simple src is much more robust
  return {};
}

