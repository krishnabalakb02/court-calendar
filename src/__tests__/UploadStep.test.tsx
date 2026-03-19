import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UploadStep from "@/components/UploadStep";

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Mock URL.createObjectURL / revokeObjectURL (not available in jsdom)
global.URL.createObjectURL = jest.fn(() => "blob:http://localhost/fake-url");
global.URL.revokeObjectURL = jest.fn();

// Helper to create a mock File
function createMockFile(name: string, size: number, type: string): File {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], name, { type });
}

describe("UploadStep", () => {
  const defaultProps = {
    onComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  it("renders drop zone with correct text", () => {
    render(<UploadStep {...defaultProps} />);

    expect(
      screen.getByText(/drag & drop/i)
    ).toBeInTheDocument();
  });

  it("accepts valid JPG file", async () => {
    const user = userEvent.setup();
    const mockCases = [
      {
        caseNumber: "CS/123/2024",
        parties: "Kumar vs State",
        previousDate: "01/01/2024",
        courtHall: "1",
        stage: "Arguments",
        nextDate: "15/01/2024",
        confidence: "high",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cases: mockCases }),
    });

    render(<UploadStep {...defaultProps} />);

    const file = createMockFile("test.jpg", 1024, "image/jpeg");
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    // Should show thumbnail preview
    await waitFor(() => {
      expect(screen.getByTestId("image-preview")).toBeInTheDocument();
    });
  });

  it("accepts valid PNG file", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cases: [] }),
    });

    render(<UploadStep {...defaultProps} />);

    const file = createMockFile("test.png", 1024, "image/png");
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByTestId("image-preview")).toBeInTheDocument();
    });
  });

  it("rejects invalid file types (PDF) via drop", async () => {
    render(<UploadStep {...defaultProps} />);

    const file = createMockFile("test.pdf", 1024, "application/pdf");
    const dropZone = screen.getByTestId("drop-zone");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText(/only jpg, png, and heic/i)).toBeInTheDocument();
    });
  });

  it("rejects invalid file types (GIF) via drop", async () => {
    render(<UploadStep {...defaultProps} />);

    const file = createMockFile("test.gif", 1024, "image/gif");
    const dropZone = screen.getByTestId("drop-zone");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText(/only jpg, png, and heic/i)).toBeInTheDocument();
    });
  });

  it("rejects files over 10MB via drop", async () => {
    render(<UploadStep {...defaultProps} />);

    const file = createMockFile("big.jpg", 11 * 1024 * 1024, "image/jpeg");
    const dropZone = screen.getByTestId("drop-zone");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(screen.getByText(/file must be under 10mb/i)).toBeInTheDocument();
    });
  });

  it("shows thumbnail preview after valid file selection", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cases: [] }),
    });

    const mockUrl = "blob:http://localhost/fake-url";
    global.URL.createObjectURL = jest.fn(() => mockUrl);
    global.URL.revokeObjectURL = jest.fn();

    render(<UploadStep {...defaultProps} />);

    const file = createMockFile("test.jpg", 1024, "image/jpeg");
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      const preview = screen.getByTestId("image-preview");
      expect(preview).toBeInTheDocument();
    });
  });

  it("shows loading spinner during OCR processing", async () => {
    const user = userEvent.setup();

    let resolveOcr!: (value: unknown) => void;
    const ocrPromise = new Promise((resolve) => {
      resolveOcr = resolve;
    });

    mockFetch.mockReturnValueOnce(ocrPromise);

    render(<UploadStep {...defaultProps} />);

    const file = createMockFile("test.jpg", 1024, "image/jpeg");
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
    });

    resolveOcr({
      ok: true,
      json: async () => ({ cases: [] }),
    });
  });

  it("calls onComplete with extracted data on OCR success", async () => {
    const user = userEvent.setup();
    const onComplete = jest.fn();
    const mockCases = [
      {
        caseNumber: "CS/123/2024",
        parties: "Kumar vs State",
        previousDate: "01/01/2024",
        courtHall: "1",
        stage: "Arguments",
        nextDate: "15/01/2024",
        confidence: "high",
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cases: mockCases }),
    });

    render(<UploadStep onComplete={onComplete} />);

    const file = createMockFile("test.jpg", 1024, "image/jpeg");
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(mockCases);
    });
  });

  it("shows error message on OCR failure and stays on upload step", async () => {
    const user = userEvent.setup();

    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ cases: [], error: "Gemini API error" }),
    });

    render(<UploadStep {...defaultProps} />);

    const file = createMockFile("test.jpg", 1024, "image/jpeg");
    const input = screen.getByTestId("file-input");
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/failed to process/i)).toBeInTheDocument();
    });

    expect(defaultProps.onComplete).not.toHaveBeenCalled();
  });
});
