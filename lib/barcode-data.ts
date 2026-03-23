import { createClient } from "@/lib/supabase/client";

// Types for the barcode data
export interface BarcodeEntry {
  id: string;
  serial: string;
}

// Fetch and search from Supabase mil_db table
export async function findEntryById(militaryId: string): Promise<BarcodeEntry | null> {
  const supabase = createClient();
  const trimmed = militaryId.trim();

  const { data, error } = await supabase
    .from("mil_db")
    .select("id, serial")
    .eq("id", trimmed)
    .single();

  if (error || !data) return null;
  return { id: data.id, serial: data.serial };
}

// Generate the entry and exit barcode values from a serial
export function getBarcodeValues(serial: string) {
  return {
    entry: `EN${serial}`,
    exit: `EX${serial}`,
  };
}
