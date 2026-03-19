import { render, screen, fireEvent } from "@testing-library/react";
import LoginPage from "@/components/LoginPage";

// Mock next-auth/react
const mockSignIn = jest.fn();
jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

describe("LoginPage", () => {
  beforeEach(() => {
    mockSignIn.mockClear();
  });

  it("renders the app name", () => {
    render(<LoginPage />);
    expect(screen.getByText("CaseDiary")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<LoginPage />);
    expect(screen.getByText("Digitize your court diary")).toBeInTheDocument();
  });

  it("renders three feature bullet points", () => {
    render(<LoginPage />);
    expect(screen.getByText("Upload")).toBeInTheDocument();
    expect(screen.getByText("AI extracts")).toBeInTheDocument();
    expect(screen.getByText("One click")).toBeInTheDocument();
  });

  it("renders the Google sign-in button", () => {
    render(<LoginPage />);
    expect(
      screen.getByRole("button", { name: /sign in with google/i })
    ).toBeInTheDocument();
  });

  it("calls signIn with google provider when button is clicked", () => {
    render(<LoginPage />);
    const button = screen.getByRole("button", {
      name: /sign in with google/i,
    });

    fireEvent.click(button);

    expect(mockSignIn).toHaveBeenCalledWith("google", {
      callbackUrl: "/dashboard",
    });
  });
});
