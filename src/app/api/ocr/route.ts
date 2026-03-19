import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { parseGeminiResponse, buildGeminiPrompt, type CaseData } from "@/lib/ocr";

interface OcrResponse {
  cases: CaseData[];
  pageDate?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<OcrResponse>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { cases: [], error: "GEMINI_API_KEY is not configured" },
      { status: 500 },
    );
  }

  // Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { cases: [], error: "Invalid form data" },
      { status: 400 },
    );
  }

  const file = formData.get("image");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { cases: [], error: "No image file provided. Send as FormData with key 'image'." },
      { status: 400 },
    );
  }

  // Convert file to base64 for Gemini
  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Data = buffer.toString("base64");
  const mimeType = (file as File).type || "image/jpeg";

  // Call Gemini 2.5 Flash
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  let rawText: string;
  try {
    const result = await model.generateContent([
      { text: buildGeminiPrompt() },
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
    ]);

    const response = result.response;
    rawText = response.text();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Gemini API error";
    return NextResponse.json(
      { cases: [], error: `Gemini API error: ${message}` },
      { status: 502 },
    );
  }

  // Extract page header date from __PAGE_HEADER__ sentinel row if present
  let pageDate: string | undefined;
  let allCases: CaseData[];
  try {
    // First, do a raw parse to find the page header sentinel
    const rawParsed = JSON.parse(
      rawText.trim().replace(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/, "$1"),
    );
    if (Array.isArray(rawParsed)) {
      const headerRow = rawParsed.find(
        (r: Record<string, unknown>) => r.caseNumber === "__PAGE_HEADER__",
      );
      if (headerRow) {
        pageDate = headerRow.parties || headerRow.nextDate || headerRow.previousDate;
      }
    }
  } catch {
    // If raw parse fails, parseGeminiResponse will handle it gracefully
  }

  // Parse through our robust parser, using pageDate for year inference
  allCases = parseGeminiResponse(rawText, pageDate ?? "");

  // Filter out the sentinel row from results
  const cases = allCases.filter((c) => c.caseNumber !== "__PAGE_HEADER__");

  return NextResponse.json({ cases, pageDate });
}
