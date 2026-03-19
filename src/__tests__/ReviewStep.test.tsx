import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReviewStep from "@/components/ReviewStep";
import type { CaseData } from "@/lib/ocr";

const mockCases: CaseData[] = [
  {
    previousDate: "01/01/2024",
    courtHall: "Hall 3",
    caseNumber: "CS/123/2024",
    parties: "Kumar vs State",
    stage: "Arguments",
    nextDate: "15/01/2024",
    confidence: "high",
  },
  {
    previousDate: "02/01/2024",
    courtHall: "Hall 5",
    caseNumber: "CR/456/2024",
    parties: "Singh vs Sharma",
    stage: "Evidence",
    nextDate: "20/01/2024",
    confidence: "low",
  },
];

const mockImageUrl = "data:image/png;base64,fakeimage";
const mockOnBack = jest.fn();
const mockOnComplete = jest.fn();

function renderReviewStep(props?: Partial<Parameters<typeof ReviewStep>[0]>) {
  return render(
    <ReviewStep
      cases={mockCases}
      imageUrl={mockImageUrl}
      onBack={mockOnBack}
      onComplete={mockOnComplete}
      {...props}
    />
  );
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("ReviewStep", () => {
  it("renders the uploaded image", () => {
    renderReviewStep();
    const img = screen.getByRole("img", { name: /uploaded/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", mockImageUrl);
  });

  it("renders table with correct column headers", () => {
    renderReviewStep();
    const headers = ["Case Number", "Court Hall", "Stage", "Next Date", "Parties"];
    headers.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  it("displays case data in table rows", () => {
    renderReviewStep();
    expect(screen.getByText("CS/123/2024")).toBeInTheDocument();
    expect(screen.getByText("Kumar vs State")).toBeInTheDocument();
    expect(screen.getByText("Hall 3")).toBeInTheDocument();
    expect(screen.getByText("CR/456/2024")).toBeInTheDocument();
    expect(screen.getByText("Singh vs Sharma")).toBeInTheDocument();
  });

  it("low-confidence rows show warning indicator", () => {
    renderReviewStep();
    const warningIcons = screen.getAllByText("\u26a0\ufe0f");
    expect(warningIcons).toHaveLength(1);
    const row = warningIcons[0].closest("tr");
    expect(row).not.toBeNull();
    expect(within(row!).getByText("CR/456/2024")).toBeInTheDocument();
  });

  it("all rows are selected by default", () => {
    renderReviewStep();
    const checkboxes = screen.getAllByRole("checkbox");
    checkboxes.forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });

  it("clicking a checkbox toggles row selection", async () => {
    const user = userEvent.setup();
    renderReviewStep();
    const checkboxes = screen.getAllByRole("checkbox");
    const firstRowCheckbox = checkboxes[1];
    expect(firstRowCheckbox).toBeChecked();

    await user.click(firstRowCheckbox);
    expect(firstRowCheckbox).not.toBeChecked();

    await user.click(firstRowCheckbox);
    expect(firstRowCheckbox).toBeChecked();
  });

  it("Select All selects all rows", async () => {
    const user = userEvent.setup();
    renderReviewStep();
    const checkboxes = screen.getAllByRole("checkbox");
    const selectAllCheckbox = checkboxes[0];

    await user.click(checkboxes[1]);
    expect(checkboxes[1]).not.toBeChecked();

    await user.click(selectAllCheckbox);
    checkboxes.forEach((cb) => {
      expect(cb).toBeChecked();
    });
  });

  it("Deselect All deselects all rows", async () => {
    const user = userEvent.setup();
    renderReviewStep();
    const checkboxes = screen.getAllByRole("checkbox");
    const selectAllCheckbox = checkboxes[0];

    await user.click(selectAllCheckbox);
    checkboxes.forEach((cb) => {
      expect(cb).not.toBeChecked();
    });
  });

  it("clicking a cell enables inline editing", async () => {
    const user = userEvent.setup();
    renderReviewStep();

    const cell = screen.getByText("CS/123/2024");
    await user.click(cell);

    const input = screen.getByDisplayValue("CS/123/2024");
    expect(input).toBeInTheDocument();
    expect(input.tagName).toBe("INPUT");
  });

  it("editing a cell and pressing Enter saves the change", async () => {
    const user = userEvent.setup();
    renderReviewStep();

    const cell = screen.getByText("CS/123/2024");
    await user.click(cell);

    const input = screen.getByDisplayValue("CS/123/2024");
    await user.tripleClick(input);
    await user.keyboard("CS/999/2024{Enter}");

    expect(screen.getByText("CS/999/2024")).toBeInTheDocument();
    expect(screen.queryByText("CS/123/2024")).not.toBeInTheDocument();
  });

  it("Add to Calendar button is disabled when no rows selected", async () => {
    const user = userEvent.setup();
    renderReviewStep();
    const checkboxes = screen.getAllByRole("checkbox");

    await user.click(checkboxes[0]);

    const addButton = screen.getByRole("button", { name: /add to calendar/i });
    expect(addButton).toBeDisabled();
  });

  it("Add to Calendar button calls onComplete with selected cases", async () => {
    const user = userEvent.setup();
    renderReviewStep();

    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[2]);

    const addButton = screen.getByRole("button", { name: /add to calendar/i });
    await user.click(addButton);

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith([mockCases[0]]);
  });

  it("Back button calls onBack", async () => {
    const user = userEvent.setup();
    renderReviewStep();

    const backButton = screen.getByRole("button", { name: /back/i });
    await user.click(backButton);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("on mobile viewport, image section is collapsible", async () => {
    const user = userEvent.setup();

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 500,
    });
    window.dispatchEvent(new Event("resize"));

    renderReviewStep();

    const toggleButton = screen.getByRole("button", { name: /image/i });
    expect(toggleButton).toBeInTheDocument();

    expect(screen.getByRole("img", { name: /uploaded/i })).toBeInTheDocument();

    await user.click(toggleButton);

    expect(screen.queryByRole("img", { name: /uploaded/i })).not.toBeInTheDocument();

    const panel = document.querySelector("[data-image-panel]");
    expect(panel).toHaveAttribute("data-collapsed", "true");
  });
});
