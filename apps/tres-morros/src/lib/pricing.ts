import {
  differenceInCalendarDays,
  eachDayOfInterval,
  subDays,
} from "date-fns";

export interface PriceOverride {
  date: string;
  nightly_rate: number;
}

export interface PriceQuoteInput {
  start: Date;
  end: Date;
  nightlyBase: number;
  includeJacuzzi?: boolean;
  jacuzziRate?: number;
  priceOverrides?: PriceOverride[];
}

export interface PriceQuote {
  nights: number;
  nightlySubtotal: number;
  extras: {
    jacuzzi: number;
  };
  total: number;
  nightlyBreakdown: Record<string, number>;
  currency: "CLP";
}

export const calculateBookingTotal = ({
  start,
  end,
  nightlyBase,
  includeJacuzzi = false,
  jacuzziRate = 0,
  priceOverrides = [],
}: PriceQuoteInput): PriceQuote => {
  const nights = differenceInCalendarDays(end, start);

  if (nights <= 0) {
    throw new Error("La fecha de término debe ser posterior al check-in.");
  }

  const overrideMap = new Map(
    priceOverrides.map((item) => [item.date, item.nightly_rate]),
  );

  const chargeableDays = eachDayOfInterval({
    start,
    end: subDays(end, 1),
  });

  let nightlySubtotal = 0;
  const nightlyBreakdown: Record<string, number> = {};

  for (const day of chargeableDays) {
    const iso = day.toISOString().slice(0, 10);
    const rate = overrideMap.get(iso) ?? nightlyBase;
    nightlyBreakdown[iso] = rate;
    nightlySubtotal += rate;
  }

  const jacuzziTotal = includeJacuzzi ? jacuzziRate * nights : 0;
  const total = nightlySubtotal + jacuzziTotal;

  return {
    nights,
    nightlySubtotal,
    extras: {
      jacuzzi: jacuzziTotal,
    },
    total,
    nightlyBreakdown,
    currency: "CLP",
  };
};

export const formatClp = (value: number) =>
  new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
