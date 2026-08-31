import { render, screen, fireEvent, act } from "@testing-library/react";
import { EcoCatch } from "../app/components/reports/EcoCatch";

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("EcoCatch", () => {
  test("shows the Play button in the idle state", () => {
    render(<EcoCatch />);
    expect(screen.getByRole("button", { name: /play/i })).toBeInTheDocument();
  });

  test("score increases by 10 when a green item is caught", () => {
    jest.spyOn(Math, "random").mockReturnValue(0); // forces every spawned item to be "green"

    const { container } = render(<EcoCatch />);
    fireEvent.click(screen.getByRole("button", { name: /play/i }));

    act(() => {
      jest.advanceTimersByTime(800); // SPAWN_MS — lets the spawner fire once
    });

    const item = container.querySelector(".eco-catch-item");
    expect(item).not.toBeNull();
    fireEvent.click(item);

    expect(screen.getByText((_, el) => el?.textContent === "Score 10")).toBeInTheDocument();
  });

  test("Earth health drops by 10 when a red item is caught", () => {
    jest.spyOn(Math, "random").mockReturnValue(0.99); // forces every spawned item to be "red"

    const { container } = render(<EcoCatch />);
    fireEvent.click(screen.getByRole("button", { name: /play/i }));

    act(() => {
      jest.advanceTimersByTime(800);
    });

    const item = container.querySelector(".eco-catch-item");
    fireEvent.click(item);

    const healthBar = Array.from(container.querySelectorAll("div")).find((d) => d.style.width === "90%");
    expect(healthBar).toBeTruthy();
  });
});