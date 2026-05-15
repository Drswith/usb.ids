export function formatDateTime(timestamp: number): string {
  return new Date(timestamp)
    .toISOString()
    .replace("T", " ")
    .replace(/\.\d{3}Z$/, " UTC");
}

export function formatDateTimeUTC(timestamp: number): string {
  return new Date(timestamp).toISOString();
}
