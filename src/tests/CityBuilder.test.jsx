import { render, screen } from "@testing-library/react";
import { CityBuilder } from "../app/components/reports/CityBuilder";

describe("CityBuilder", () => {
  test("shows the loading state while data is being fetched", () => {
    render(<CityBuilder greenCount={0} badCount={0} health={100} loading={true} />);
    expect(screen.getByText(/loading your city/i)).toBeInTheDocument();
  });

  test("renders 100% health and a thriving message when there's no pollution", () => {
    render(<CityBuilder greenCount={5} badCount={0} health={100} weekWeather={[]} loading={false} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByText(/no pollution this week/i)).toBeInTheDocument();
  });

  test("city health decreases in the meter as pollution actions increase", () => {
    const { rerender } = render(<CityBuilder greenCount={5} badCount={1} health={83} weekWeather={[]} loading={false} />);
    expect(screen.getByText("83%")).toBeInTheDocument();

    rerender(<CityBuilder greenCount={2} badCount={6} health={25} weekWeather={[]} loading={false} />);
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText(/pollution elements this week/i)).toBeInTheDocument();
  });
});