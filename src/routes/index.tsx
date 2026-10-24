import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis, Legend,
} from "recharts";
import { ShoppingBasket, DollarSign, Receipt, Star, Package, TrendingUp, RotateCcw } from "lucide-react";
import { SALES, PRODUCT_LINES, PAYMENTS, MONTHS, BRANCHES, type Sale } from "@/lib/sales-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Supermarket Sales Analytics Dashboard" },
      { name: "description", content: "Interactive dashboard of 1,000 supermarket transactions: sales by branch, product line, payment, customer and time." },
      { property: "og:title", content: "Supermarket Sales Analytics Dashboard" },
      { property: "og:description", content: "Filter and explore supermarket sales KPIs and charts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--chart-6)"];
const money = (n: number) => "$" + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

type Filters = {
  city: string[]; productLine: string[]; customerType: string[];
  gender: string[]; payment: string[]; month: string[];
};
const EMPTY: Filters = { city: [], productLine: [], customerType: [], gender: [], payment: [], month: [] };

const FILTER_DEFS: { key: keyof Filters; label: string; options: readonly string[] }[] = [
  { key: "city", label: "Branch / City", options: BRANCHES.map((b) => b.city) },
  { key: "month", label: "Month", options: MONTHS },
  { key: "productLine", label: "Product line", options: PRODUCT_LINES },
  { key: "customerType", label: "Customer", options: ["Member", "Normal"] },
  { key: "gender", label: "Gender", options: ["Female", "Male"] },
  { key: "payment", label: "Payment", options: PAYMENTS },
];

function groupSum(rows: Sale[], key: (s: Sale) => string | number) {
  const m = new Map<string | number, { sales: number; count: number; income: number; qty: number; rating: number }>();
  for (const r of rows) {
    const k = key(r);
    const v = m.get(k) ?? { sales: 0, count: 0, income: 0, qty: 0, rating: 0 };
    v.sales += r.total; v.count++; v.income += r.grossIncome; v.qty += r.quantity; v.rating += r.rating;
    m.set(k, v);
  }
  return [...m.entries()].map(([name, v]) => ({
    name, sales: Math.round(v.sales), count: v.count, income: Math.round(v.income),
    qty: v.qty, rating: +(v.rating / v.count).toFixed(2),
  }));
}

function Dashboard() {
  const [f, setF] = useState<Filters>(EMPTY);
  const toggle = (k: keyof Filters, v: string) =>
    setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const active = Object.values(f).some((a) => a.length);

  const rows = useMemo(
    () => SALES.filter((s) => (Object.keys(f) as (keyof Filters)[]).every((k) => !f[k].length || f[k].includes(s[k] as string))),
    [f],
  );

  const kpi = useMemo(() => {
    const sales = rows.reduce((a, r) => a + r.total, 0);
    const income = rows.reduce((a, r) => a + r.grossIncome, 0);
    const qty = rows.reduce((a, r) => a + r.quantity, 0);
    const rating = rows.length ? rows.reduce((a, r) => a + r.rating, 0) / rows.length : 0;
    return { sales, income, qty, rating, count: rows.length, avg: rows.length ? sales / rows.length : 0 };
  }, [rows]);

  const byCity = useMemo(() => groupSum(rows, (r) => r.city), [rows]);
  const byProduct = useMemo(() => groupSum(rows, (r) => r.productLine).sort((a, b) => b.sales - a.sales), [rows]);
  const byPayment = useMemo(() => groupSum(rows, (r) => r.payment), [rows]);
  const byHour = useMemo(() => groupSum(rows, (r) => r.hour).sort((a, b) => +a.name - +b.name), [rows]);
  const byDate = useMemo(() => groupSum(rows, (r) => r.date).sort((a, b) => String(a.name).localeCompare(String(b.name))), [rows]);
  const byMonth = useMemo(() => MONTHS.map((m) => groupSum(rows.filter((r) => r.month === m), () => m)[0] ?? { name: m, sales: 0, income: 0, count: 0 }), [rows]);
  const custGender = useMemo(() => ["Member", "Normal"].map((c) => {
    const o: Record<string, number | string> = { name: c };
    for (const g of ["Female", "Male"]) o[g] = Math.round(rows.filter((r) => r.customerType === c && r.gender === g).reduce((a, r) => a + r.total, 0));
    return o;
  }), [rows]);
  const ratingDist = useMemo(() => {
    const bins = [4, 5, 6, 7, 8, 9].map((b) => ({ name: `${b}–${b + 1}`, count: 0 }));
    rows.forEach((r) => { const b = bins[Math.min(5, Math.floor(r.rating) - 4)]; if (b) b.count++; });
    return bins;
  }, [rows]);
  const top = useMemo(() => [...rows].sort((a, b) => b.total - a.total).slice(0, 8), [rows]);

  return (
    <div className="min-h-dvh bg-background">
      <header className="bg-hero-gradient text-hero-foreground">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex items-center gap-2 text-sm opacity-80"><ShoppingBasket aria-hidden="true" className="h-4 w-4" /> Supermarket Sales Analysis</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-4xl">Sales Analytics Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm opacity-80">
            {kpi.count.toLocaleString()} of {SALES.length.toLocaleString()} transactions · 3 branches · Jan–Mar 2019
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Filters */}
        <section className="rounded-2xl border bg-card p-4 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Filters</h2>
            {active && (
              <button type="button" onClick={() => setF(EMPTY)} className="flex min-h-9 items-center gap-1 rounded px-2 text-sm focus-visible:ring-2 focus-visible:ring-ring text-primary hover:underline">
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" /> Reset
              </button>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {FILTER_DEFS.map((d) => (
              <div key={d.key} role="group" aria-label={d.label}>
                <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{d.label}</div>
                <div className="flex flex-wrap gap-1.5">
                  {d.options.map((o) => {
                    const on = f[d.key].includes(o);
                    return (
                      <button key={o} type="button" aria-pressed={on} onClick={() => toggle(d.key, o)}
                        className={`min-h-9 rounded-full border px-3.5 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-0 sm:py-1 ${on ? "border-primary bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"}`}>
                        {o}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* KPIs */}
        <section aria-live="polite" aria-label="Key metrics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          <Kpi icon={DollarSign} label="Total sales" value={money(kpi.sales)} />
          <Kpi icon={TrendingUp} label="Gross income" value={money(kpi.income)} />
          <Kpi icon={Receipt} label="Transactions" value={kpi.count.toLocaleString()} />
          <Kpi icon={DollarSign} label="Avg. basket" value={"$" + kpi.avg.toFixed(2)} />
          <Kpi icon={Package} label="Units sold" value={kpi.qty.toLocaleString()} />
          <Kpi icon={Star} label="Avg. rating" value={kpi.rating.toFixed(2)} />
        </section>

        {rows.length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">No transactions match these filters.</div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ChartCard title="Daily sales trend" className="md:col-span-2">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={byDate}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(v) => String(v).slice(5)} minTickGap={24} />
                  <YAxis tick={{ fontSize: 10 }} width={45} />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Area type="monotone" dataKey="sales" stroke="var(--chart-1)" fill="url(#g1)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Monthly sales">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickFormatter={(v) => String(v).slice(0, 3)} />
                  <YAxis tick={{ fontSize: 10 }} width={45} />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Bar dataKey="sales" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sales by product line" className="md:col-span-2">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byProduct} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Bar dataKey="sales" radius={[0, 6, 6, 0]}>
                    {byProduct.map((_, i) => <Cell key={i} fill={COLORS[i % 6]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Payment methods">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={byPayment} dataKey="sales" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {byPayment.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sales & income by city">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byCity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} width={45} />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="sales" name="Sales" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="income" name="Gross income" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Customer type × gender">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={custGender}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} width={45} />
                  <Tooltip formatter={(v: number) => money(v)} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Female" stackId="a" fill="var(--chart-3)" />
                  <Bar dataKey="Male" stackId="a" fill="var(--chart-4)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Sales by hour of day">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byHour}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v}h`} />
                  <YAxis tick={{ fontSize: 10 }} width={45} />
                  <Tooltip formatter={(v: number) => money(v)} labelFormatter={(v) => `${v}:00`} />
                  <Bar dataKey="sales" fill="var(--chart-5)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Customer rating distribution">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={ratingDist}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 10 }} width={35} />
                  <Tooltip />
                  <Bar dataKey="count" name="Transactions" fill="var(--chart-6)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Product line summary" className="md:col-span-2">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr><th scope="col" className="py-2">Product line</th><th className="text-right">Sales</th><th className="text-right">Units</th><th className="text-right">Txns</th><th className="text-right">Rating</th></tr>
                  </thead>
                  <tbody>
                    {byProduct.map((p) => (
                      <tr key={p.name} className="border-t">
                        <td className="py-2">{p.name}</td><td className="text-right">{money(p.sales)}</td>
                        <td className="text-right">{p.qty}</td><td className="text-right">{p.count}</td><td className="text-right">{p.rating}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>

            <ChartCard title="Top transactions" className="md:col-span-2 lg:col-span-3">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-left text-xs uppercase text-muted-foreground">
                    <tr><th scope="col" className="py-2">Invoice</th><th>Date</th><th>City</th><th>Product</th><th>Customer</th><th>Payment</th><th className="text-right">Qty</th><th className="text-right">Total</th></tr>
                  </thead>
                  <tbody>
                    {top.map((t) => (
                      <tr key={t.invoiceId + t.date} className="border-t">
                        <td className="py-2 font-mono text-xs">{t.invoiceId}</td><td>{t.date}</td><td>{t.city}</td>
                        <td>{t.productLine}</td><td>{t.customerType} · {t.gender}</td><td>{t.payment}</td>
                        <td className="text-right">{t.quantity}</td><td className="text-right font-semibold">${t.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ChartCard>
          </div>
        )}
        <p className="pb-4 text-center text-xs text-muted-foreground">Descriptive analytics only — results are not predictions or causal explanations.</p>
      </main>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-3 shadow-card sm:p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="truncate">{label}</span></div>
      <div className="mt-1 truncate text-lg font-semibold tracking-tight sm:text-2xl" style={{ fontFamily: "var(--font-display)" }}>{value}</div>
    </div>
  );
}

function ChartCard({ title, className = "", children }: { title: string; className?: string; children: React.ReactNode }) {
  return (
    <section aria-label={title} className={`min-w-0 rounded-2xl border bg-card p-3 shadow-card sm:p-4 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}
