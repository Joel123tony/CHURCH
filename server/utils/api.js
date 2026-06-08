export function extractData(res) {
  const data = res?.data;

  if (!data) return [];

  // case 1: already array
  if (Array.isArray(data)) return data;

  // case 2: wrapped API response
  if (Array.isArray(data.data)) return data.data;

  // fallback
  return [];
}