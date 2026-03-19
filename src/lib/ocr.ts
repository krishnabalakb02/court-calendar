/**
 * OCR parsing and processing utilities for court ledger images.
 * Pure functions — no API calls, fully testable.
 */

export interface CaseData {
  previousDate: string;    // DD/MM/YYYY
  courtHall: string;
  caseNumber: string;
  parties: string;         // English/Latin transliterated
  stage: string;
  nextDate: string;        // DD/MM/YYYY
  confidence: "high" | "low";
}

/** Shape of a single row as returned by Gemini */
export interface GeminiRow {
  previousDate?: string;
  courtHall?: string;
  caseNumber?: string;
  parties?: string;
  stage?: string;
  nextDate?: string;
  confidence?: string;
}

// --------------- Date helpers ---------------

/**
 * Replace dash separators with slashes: DD-MM-YYYY -> DD/MM/YYYY
 */
export function normalizeDateSeparator(date: string): string {
  return date.replace(/-/g, "/");
}

/**
 * Extract a four-digit year from a date string (DD/MM/YYYY or DD-MM-YYYY).
 * Returns undefined if no year part is found.
 */
export function inferYear(headerDate: string | undefined): string | undefined {
  if (!headerDate) return undefined;
  const normalized = normalizeDateSeparator(headerDate);
  const parts = normalized.split("/");
  if (parts.length === 3 && parts[2].length === 4) {
    return parts[2];
  }
  return undefined;
}

/**
 * If the date is DD/MM (no year), append the given year.
 * If it already has a year or is empty, return as-is.
 */
export function applyYearToDates(date: string, year: string | undefined): string {
  if (!date) return "";
  const normalized = normalizeDateSeparator(date);
  const parts = normalized.split("/");
  if (parts.length === 2 && year) {
    return `${normalized}/${year}`;
  }
  return normalized;
}

// --------------- Main parser ---------------

/**
 * Parse the raw text response from Gemini into CaseData[].
 *
 * Handles:
 * - Raw JSON arrays
 * - JSON wrapped in markdown code fences
 * - Partial/missing fields
 * - Malformed JSON (returns [])
 * - Year inference from page header date
 */
export function parseGeminiResponse(
  raw: string,
  pageHeaderDate: string,
): CaseData[] {
  if (!raw || !raw.trim()) return [];

  const year = inferYear(pageHeaderDate);

  // Strip markdown code fences if present
  let jsonStr = raw.trim();
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  return parsed.map((row: GeminiRow) => ({
    previousDate: applyYearToDates(normalizeDateSeparator(row.previousDate ?? ""), year),
    courtHall: row.courtHall ?? "",
    caseNumber: row.caseNumber ?? "",
    parties: row.parties ?? "",
    stage: row.stage ?? "",
    nextDate: applyYearToDates(normalizeDateSeparator(row.nextDate ?? ""), year),
    confidence: row.confidence === "high" ? "high" : "low",
  }));
}

// --------------- Gemini prompt ---------------

/**
 * Build the structured prompt sent to Gemini 2.5 Flash for ledger OCR.
 */
export function buildGeminiPrompt(): string {
  return `You are an expert OCR system for Indian court case diary ledger pages.

Analyze the attached photo of a handwritten court ledger page and extract every case row.

The ledger has these columns (left to right):
1. Previous Date — the last hearing date
2. Court Hall — hall number or name
3. Particulars — case number and party names (e.g. "CS/123/2024 Kumar vs State")
4. Stage — current stage of the case (e.g. Arguments, Evidence, Orders)
5. Next Date — the next hearing date

Instructions:
- First, read the page header to find the page date (usually printed at the top). This gives you the year context.
- For each row, extract all columns. Split "Particulars" into caseNumber and parties.
- Transliterate ALL text into English/Latin script. If names are in Devanagari or another script, romanize them.
- Dates should be in DD/MM format. If you can read the full year, include it as DD/MM/YYYY.
- For each row, assess legibility and assign confidence: "high" if you can read all fields clearly, "low" if any field is uncertain or partially illegible.
- If a cell is empty or unreadable, use an empty string "".
- Return ONLY a JSON array (no markdown, no explanation).

Return this exact JSON structure:
[
  {
    "previousDate": "DD/MM" or "DD/MM/YYYY",
    "courtHall": "string",
    "caseNumber": "string",
    "parties": "string (English/Latin script)",
    "stage": "string",
    "nextDate": "DD/MM" or "DD/MM/YYYY",
    "confidence": "high" or "low"
  }
]

Also include the page header date as the FIRST element with caseNumber set to "__PAGE_HEADER__" and the parties field containing the full header date string (DD/MM/YYYY).

Return ONLY the JSON array.`;
}
