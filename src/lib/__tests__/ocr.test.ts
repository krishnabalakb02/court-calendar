import {
  parseGeminiResponse,
  inferYear,
  normalizeDateSeparator,
  applyYearToDates,
  type CaseData,
  type GeminiRow,
} from "../ocr";

const VALID_GEMINI_RESPONSE: GeminiRow[] = [
  {
    previousDate: "10/01",
    courtHall: "Hall 3",
    caseNumber: "CS/123/2024",
    parties: "Kumar vs State",
    stage: "Arguments",
    nextDate: "25/02",
    confidence: "high",
  },
  {
    previousDate: "12/01",
    courtHall: "Hall 7",
    caseNumber: "CR/456/2024",
    parties: "Sharma vs Gupta",
    stage: "Evidence",
    nextDate: "03/03",
    confidence: "low",
  },
];

const PAGE_HEADER_DATE = "15/01/2025";

describe("parseGeminiResponse", () => {
  it("parses valid JSON array into CaseData[]", () => {
    const result = parseGeminiResponse(JSON.stringify(VALID_GEMINI_RESPONSE), PAGE_HEADER_DATE);
    expect(result).toHaveLength(2);
    expect(result[0].caseNumber).toBe("CS/123/2024");
    expect(result[0].parties).toBe("Kumar vs State");
    expect(result[0].stage).toBe("Arguments");
    expect(result[0].courtHall).toBe("Hall 3");
  });

  it("applies page year to DD/MM dates", () => {
    const result = parseGeminiResponse(JSON.stringify(VALID_GEMINI_RESPONSE), PAGE_HEADER_DATE);
    expect(result[0].previousDate).toBe("10/01/2025");
    expect(result[0].nextDate).toBe("25/02/2025");
  });

  it("preserves dates that already have a year", () => {
    const rows: GeminiRow[] = [
      {
        previousDate: "10/01/2024",
        courtHall: "Hall 1",
        caseNumber: "CS/1/2024",
        parties: "A vs B",
        stage: "Hearing",
        nextDate: "20/02/2024",
        confidence: "high",
      },
    ];
    const result = parseGeminiResponse(JSON.stringify(rows), PAGE_HEADER_DATE);
    expect(result[0].previousDate).toBe("10/01/2024");
    expect(result[0].nextDate).toBe("20/02/2024");
  });

  it("returns empty array for empty JSON array", () => {
    const result = parseGeminiResponse("[]", PAGE_HEADER_DATE);
    expect(result).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    const result = parseGeminiResponse("", PAGE_HEADER_DATE);
    expect(result).toEqual([]);
  });

  it("returns empty array for malformed JSON", () => {
    const result = parseGeminiResponse("not valid json {{{", PAGE_HEADER_DATE);
    expect(result).toEqual([]);
  });

  it("extracts JSON from markdown code fences", () => {
    const wrapped = "```json\n" + JSON.stringify(VALID_GEMINI_RESPONSE) + "\n```";
    const result = parseGeminiResponse(wrapped, PAGE_HEADER_DATE);
    expect(result).toHaveLength(2);
    expect(result[0].caseNumber).toBe("CS/123/2024");
  });

  it("handles partial data -- fills available fields, leaves rest empty", () => {
    const partial: Partial<GeminiRow>[] = [
      {
        caseNumber: "CS/999/2024",
        parties: "Unknown",
        confidence: "low",
      },
    ];
    const result = parseGeminiResponse(JSON.stringify(partial), PAGE_HEADER_DATE);
    expect(result).toHaveLength(1);
    expect(result[0].caseNumber).toBe("CS/999/2024");
    expect(result[0].previousDate).toBe("");
    expect(result[0].nextDate).toBe("");
    expect(result[0].courtHall).toBe("");
    expect(result[0].stage).toBe("");
    expect(result[0].confidence).toBe("low");
  });
});

describe("confidence flags", () => {
  it("preserves high confidence", () => {
    const result = parseGeminiResponse(JSON.stringify(VALID_GEMINI_RESPONSE), PAGE_HEADER_DATE);
    expect(result[0].confidence).toBe("high");
  });

  it("preserves low confidence", () => {
    const result = parseGeminiResponse(JSON.stringify(VALID_GEMINI_RESPONSE), PAGE_HEADER_DATE);
    expect(result[1].confidence).toBe("low");
  });

  it("defaults to low when confidence is missing", () => {
    const rows = [
      {
        previousDate: "10/01",
        courtHall: "Hall 3",
        caseNumber: "CS/123/2024",
        parties: "Kumar vs State",
        stage: "Arguments",
        nextDate: "25/02",
      },
    ];
    const result = parseGeminiResponse(JSON.stringify(rows), PAGE_HEADER_DATE);
    expect(result[0].confidence).toBe("low");
  });
});

describe("inferYear", () => {
  it("extracts year from DD/MM/YYYY header", () => {
    expect(inferYear("15/01/2025")).toBe("2025");
  });

  it("extracts year from DD-MM-YYYY header", () => {
    expect(inferYear("15-01-2025")).toBe("2025");
  });

  it("returns undefined for date without year", () => {
    expect(inferYear("15/01")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(inferYear("")).toBeUndefined();
  });

  it("returns undefined for undefined input", () => {
    expect(inferYear(undefined)).toBeUndefined();
  });
});

describe("normalizeDateSeparator", () => {
  it("converts dash to slash", () => {
    expect(normalizeDateSeparator("15-01-2025")).toBe("15/01/2025");
  });

  it("keeps slashes as-is", () => {
    expect(normalizeDateSeparator("15/01/2025")).toBe("15/01/2025");
  });

  it("handles DD-MM without year", () => {
    expect(normalizeDateSeparator("15-01")).toBe("15/01");
  });

  it("returns empty for empty input", () => {
    expect(normalizeDateSeparator("")).toBe("");
  });
});

describe("applyYearToDates", () => {
  it("appends year to DD/MM date", () => {
    expect(applyYearToDates("20/02", "2025")).toBe("20/02/2025");
  });

  it("does not modify DD/MM/YYYY date", () => {
    expect(applyYearToDates("20/02/2024", "2025")).toBe("20/02/2024");
  });

  it("returns empty for empty date", () => {
    expect(applyYearToDates("", "2025")).toBe("");
  });

  it("returns date as-is when no year provided", () => {
    expect(applyYearToDates("20/02", undefined)).toBe("20/02");
  });
});
