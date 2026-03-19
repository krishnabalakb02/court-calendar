import { render, screen } from "@testing-library/react";
import Header from "@/components/Header";

// Mock next-auth/react
const mockUseSession = jest.fn();
jest.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
  signOut: jest.fn(),
}));

describe("Header", () => {
  it("renders nothing when there is no session", () => {
    mockUseSession.mockReturnValue({ data: null });
    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });

  it("renders CaseDiary branding when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "Test User", email: "test@test.com", image: null },
      },
    });
    render(<Header />);
    expect(screen.getByText("CaseDiary")).toBeInTheDocument();
  });

  it("renders user name when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Krishna",
          email: "krishna@test.com",
          image: "https://example.com/avatar.jpg",
        },
      },
    });
    render(<Header />);
    expect(screen.getByText("Krishna")).toBeInTheDocument();
  });

  it("renders sign out button when authenticated", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { name: "Test User", email: "test@test.com", image: null },
      },
    });
    render(<Header />);
    expect(
      screen.getByRole("button", { name: /sign out/i })
    ).toBeInTheDocument();
  });

  it("renders user avatar when image is available", () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          name: "Test User",
          email: "test@test.com",
          image: "https://example.com/avatar.jpg",
        },
      },
    });
    render(<Header />);
    const avatar = screen.getByAltText("Test User");
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });
});
