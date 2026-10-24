// Sample dataset matching the project's 17-field supermarket sales schema
// (1,000 transactions, Jan–Mar 2019). Generated with a fixed seed so results are stable.
export type Sale = {
  invoiceId: string;
  branch: "A" | "B" | "C";
  city: "Yangon" | "Mandalay" | "Naypyitaw";
  customerType: "Member" | "Normal";
  gender: "Female" | "Male";
  productLine: string;
  unitPrice: number;
  quantity: number;
  tax: number;
  total: number;
  date: string; // YYYY-MM-DD
  month: string;
  hour: number;
  payment: "Ewallet" | "Cash" | "Credit card";
  cogs: number;
  grossMarginPct: number;
  grossIncome: number;
  rating: number;
};

export const PRODUCT_LINES = [
  "Health and beauty",
  "Electronic accessories",
  "Home and lifestyle",
  "Sports and travel",
  "Food and beverages",
  "Fashion accessories",
];
export const BRANCHES = [
  { branch: "A", city: "Yangon" },
  { branch: "B", city: "Mandalay" },
  { branch: "C", city: "Naypyitaw" },
] as const;
export const PAYMENTS = ["Ewallet", "Cash", "Credit card"] as const;
export const MONTHS = ["January", "February", "March"];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n: number) => Math.round(n * 100) / 100;

function generate(): Sale[] {
  const rnd = mulberry32(2019);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)] as T;
  const rows: Sale[] = [];
  const start = Date.UTC(2019, 0, 1);
  for (let i = 0; i < 1000; i++) {
    const b = pick(BRANCHES);
    const unitPrice = r2(10 + rnd() * 90);
    const quantity = 1 + Math.floor(rnd() * 10);
    const cogs = r2(unitPrice * quantity);
    const tax = r2(cogs * 0.05);
    const d = new Date(start + Math.floor(rnd() * 89) * 86400000);
    const a = () => String(Math.floor(rnd() * 900 + 100));
    rows.push({
      invoiceId: `${a()}-${a().slice(0, 2)}-${a()}${Math.floor(rnd() * 10)}`,
      branch: b.branch,
      city: b.city,
      customerType: rnd() < 0.5 ? "Member" : "Normal",
      gender: rnd() < 0.5 ? "Female" : "Male",
      productLine: pick(PRODUCT_LINES),
      unitPrice,
      quantity,
      tax,
      total: r2(cogs + tax),
      date: d.toISOString().slice(0, 10),
      month: MONTHS[d.getUTCMonth()] ?? "March",
      hour: 10 + Math.floor(rnd() * 11),
      payment: pick(PAYMENTS),
      cogs,
      grossMarginPct: 4.761904762,
      grossIncome: tax,
      rating: r2(4 + Math.floor(rnd() * 61) / 10),
    });
  }
  return rows.sort((x, y) => x.date.localeCompare(y.date));
}

export const SALES: Sale[] = generate();
