/**
 * Convert JSON array to CSV string
 */
export function generateCSV(data = []) {
  if (!data.length) return "";

  const headers = Object.keys(data[0]).join(",");
  const rows = data.map((row) =>
    Object.values(row).join(",")
  );

  return [headers, ...rows].join("\n");
}
