export function formatImprovement(value) {
  if (value == null || isNaN(value)) return "N/A"; // handle null, undefined, NaN

  // choose decimal precision
  const formatted = Math.abs(value) >= 1 ? value.toFixed(2) : value.toFixed(3);

  // prepend + for positive values
  return `${value > 0 ? "+" : ""}${formatted}%`;
}