import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import ActivityLogger from "../app/pages/ActivityLogger";

// Mock the Firebase-backed hooks so the test never touches real Firestore
jest.mock("../hooks/useAuth", () => ({
  useAuth: () => ({ user: { uid: "test-uid", displayName: "Test User" }, logout: jest.fn() }),
}));

const mockAddAction = jest.fn(() => Promise.resolve());
jest.mock("../hooks/useActions", () => ({
  useActions: () => ({ addAction: mockAddAction, saving: false, error: null }),
}));

jest.mock("../hooks/useLiveScore", () => ({
  useLiveScore: () => ({ totalCarbon: 3.2, loading: false }),
}));

const renderLogger = () =>
  render(
    <MemoryRouter>
      <ActivityLogger />
    </MemoryRouter>
  );

describe("ActivityLogger", () => {
  beforeEach(() => {
    mockAddAction.mockClear();
  });

  test("submit button is disabled when distance is empty", () => {
    renderLogger();
    const submitBtn = screen.getByRole("button", { name: /log this activity/i });
    expect(submitBtn).toBeDisabled();
  });

  test("submit button enables once a valid distance is entered", () => {
    renderLogger();
    const distanceInput = screen.getByPlaceholderText("e.g. 24.5");
    fireEvent.change(distanceInput, { target: { value: "20" } });

    const submitBtn = screen.getByRole("button", { name: /log this activity/i });
    expect(submitBtn).not.toBeDisabled();
  });

  test("form clears distance input after successful submit", async () => {
    renderLogger();
    const distanceInput = screen.getByPlaceholderText("e.g. 24.5");
    fireEvent.change(distanceInput, { target: { value: "20" } });

    const submitBtn = screen.getByRole("button", { name: /log this activity/i });
    fireEvent.click(submitBtn);

    // handleSubmit is async (awaits addAction before clearing state),
    // so wait for the cleared value instead of asserting synchronously
    await waitFor(() => expect(distanceInput.value).toBe(""));
    expect(mockAddAction).toHaveBeenCalledWith("test-uid", "travel", "car", 20, expect.any(Number));
  });

  test("submit is a no-op (addAction not called) while distance is empty", () => {
    renderLogger();
    const submitBtn = screen.getByRole("button", { name: /log this activity/i });
    fireEvent.click(submitBtn);
    expect(mockAddAction).not.toHaveBeenCalled();
  });
});