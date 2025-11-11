import { calculateBookingTotal } from "./pricing";
import { toDateOnly } from "./dates";

describe("calculateBookingTotal", () => {
  it("calculates base nights", () => {
    const quote = calculateBookingTotal({
      start: toDateOnly("2025-01-10"),
      end: toDateOnly("2025-01-13"),
      nightlyBase: 100000,
    });

    expect(quote.nights).toBe(3);
    expect(quote.nightlySubtotal).toBe(300000);
    expect(quote.total).toBe(300000);
  });

  it("applies overrides and jacuzzi extras", () => {
    const quote = calculateBookingTotal({
      start: toDateOnly("2025-02-10"),
      end: toDateOnly("2025-02-13"),
      nightlyBase: 100000,
      includeJacuzzi: true,
      jacuzziRate: 20000,
      priceOverrides: [
        { date: "2025-02-11", nightly_rate: 130000 },
        { date: "2025-02-12", nightly_rate: 90000 },
      ],
    });

    expect(quote.nightlyBreakdown).toMatchObject({
      "2025-02-10": 100000,
      "2025-02-11": 130000,
      "2025-02-12": 90000,
    });
    expect(quote.nightlySubtotal).toBe(320000);
    expect(quote.extras.jacuzzi).toBe(60000);
    expect(quote.total).toBe(380000);
  });

  it("throws when end date is not after start date", () => {
    expect(() =>
      calculateBookingTotal({
        start: toDateOnly("2025-02-10"),
        end: toDateOnly("2025-02-10"),
        nightlyBase: 100000,
      }),
    ).toThrow();
  });
});
