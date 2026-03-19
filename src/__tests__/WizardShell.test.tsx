import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WizardShell from "@/components/WizardShell";

describe("WizardShell", () => {
  const defaultProps = {
    currentStep: 0,
    onBack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders 3 steps with correct labels", () => {
    render(<WizardShell {...defaultProps} />);

    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
    expect(screen.getByText("Add")).toBeInTheDocument();
  });

  it("highlights current step (step 0)", () => {
    render(<WizardShell {...defaultProps} currentStep={0} />);

    const uploadStep = screen.getByTestId("step-0");
    expect(uploadStep).toHaveClass("text-indigo-600");
  });

  it("highlights current step (step 1)", () => {
    render(<WizardShell {...defaultProps} currentStep={1} />);

    const reviewStep = screen.getByTestId("step-1");
    expect(reviewStep).toHaveClass("text-indigo-600");
  });

  it("highlights current step (step 2)", () => {
    render(<WizardShell {...defaultProps} currentStep={2} />);

    const addStep = screen.getByTestId("step-2");
    expect(addStep).toHaveClass("text-indigo-600");
  });

  it("hides back button on step 0", () => {
    render(<WizardShell {...defaultProps} currentStep={0} />);

    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
  });

  it("shows back button on step 1", () => {
    render(<WizardShell {...defaultProps} currentStep={1} />);

    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("shows back button on step 2", () => {
    render(<WizardShell {...defaultProps} currentStep={2} />);

    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("calls onBack when back button is clicked", async () => {
    const onBack = jest.fn();
    const user = userEvent.setup();

    render(<WizardShell currentStep={1} onBack={onBack} />);

    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("renders children content", () => {
    render(
      <WizardShell {...defaultProps}>
        <div>Step content here</div>
      </WizardShell>
    );

    expect(screen.getByText("Step content here")).toBeInTheDocument();
  });
});
