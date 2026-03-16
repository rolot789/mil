// Types for the barcode data
export interface BarcodeEntry {
  id: string;
  serial: string;
}

// Fetch and search the local list.json dataset
export async function findEntryById(militaryId: string): Promise<BarcodeEntry | null> {
  const response = await fetch("/list.json");
  const data: BarcodeEntry[] = await response.json();
  const trimmed = militaryId.trim();
  return data.find((entry) => entry.id === trimmed) ?? null;
}

// Generate the entry and exit barcode values from a serial
export function getBarcodeValues(serial: string) {
  return {
    entry: `EN${serial}`,
    exit: `EX${serial}`,
  };
}
