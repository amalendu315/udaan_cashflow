export * from "./db-query";
export * from "./log-action";
export * from "./fetch-wrapper";
export * from "./constants";
export * from "./blob-util";

export const formatCurrency = (amount: number): string => {
  if (isNaN(amount) || amount === null) return "₹0.00";

  return `₹${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount)}`;
};
