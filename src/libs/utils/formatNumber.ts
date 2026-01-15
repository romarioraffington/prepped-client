/**
 * Formats a number by adding commas as thousand separators
 * @param num - The number to format
 * @returns The formatted number as a string
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString("en-US");
};

/**
 * Formats a number to a compact format (e.g., 12000 -> "12k", 12500 -> "12.5k")
 * @param num - The number to format
 * @returns The formatted number as a string
 */
export const formatCompactNumber = (num: number): string => {
  if (!num) {
    return "";
  }

  if (num < 1000) {
    return num.toString();
  }

  if (num < 10000) {
    const thousands = num / 1000;
    return thousands % 1 === 0 ? `${thousands}k` : `${thousands.toFixed(1)}k`;
  }

  if (num < 1000000) {
    const thousands = Math.floor(num / 1000);
    return `${thousands}k`;
  }

  if (num < 1000000000) {
    const millions = num / 1000000;
    return millions % 1 === 0 ? `${millions}M` : `${millions.toFixed(1)}M`;
  }

  const billions = num / 1000000000;
  return billions % 1 === 0 ? `${billions}B` : `${billions.toFixed(1)}B`;
};
