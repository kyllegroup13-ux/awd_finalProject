import { Head, usePage } from '@inertiajs/react';
import { CalendarDays, Download, RefreshCw, Search, ShoppingCart, TrendingUp, UserRound, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { OwnerSidebar } from '@/components/owner-sidebar';

type Day = {
    period: string;
    total_revenue: string | number;
    total_gross_income: string | number;
    transaction_count: string | number;
};
type AnalyticsResponse = {
    daily: Day[];
    weekly: Day[];
    monthly: Day[];
};
type ProductStat = {
    product_name: string;
    units_sold: number | string;
    revenue: number | string;
};
type ProductAnalyticsResponse = {
    best_selling_product: ProductStat | null;
    least_selling_product: ProductStat | null;
};
type PageProps = { auth?: { user?: { name: string } | null } };

const money = (value: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
const compactMoney = (value: number) =>
    value >= 1000000 ? `₱${(value / 1000000).toFixed(1)}m` : value >= 1000 ? `₱${(value / 1000).toFixed(1)}k` : `₱${Math.round(value)}`;
const dateString = (date: Date) =>
    [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const todayString = () => dateString(new Date());
const daysAgo = (count: number) => {
    const date = new Date();
    date.setDate(date.getDate() - count);
    return dateString(date);
};
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

type ChartEntry = { label: string; revenue: number; count: number };
function RevenueChart({ entries }: { entries: ChartEntry[] }) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const width = 900;
    const height = 280;
    const left = 70;
    const right = 20;
    const top = 23;
    const bottom = 49;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const maximum = Math.max(...entries.map((entry) => entry.revenue), 1);
    const positions = entries.map((entry, index) => ({
        x: left + (entries.length === 1 ? chartWidth / 2 : (index / (entries.length - 1)) * chartWidth),
        y: top + chartHeight - (entry.revenue / maximum) * chartHeight,
    }));
    const linePoints = positions.map(({ x, y }) => `${x},${y}`).join(' ');
    const areaPoints =
        positions.length > 0 ? `${positions[0].x},${top + chartHeight} ${linePoints} ${positions[positions.length - 1].x},${top + chartHeight}` : '';

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Sales revenue and transaction count by reporting period">
            <defs>
                <linearGradient id="report-area-fill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#7657F6" stopOpacity="0.18" />
                    <stop offset="100%" stopColor="#7657F6" stopOpacity="0" />
                </linearGradient>
                <filter id="report-tooltip-shadow" x="-30%" y="-30%" width="160%" height="180%">
                    <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#171324" floodOpacity="0.2" />
                </filter>
            </defs>
            {[0, 0.25, 0.5, 0.75, 1].map((step) => {
                const y = top + chartHeight * (1 - step);
                return (
                    <g key={step}>
                        <line
                            x1={left}
                            y1={y}
                            x2={width - right}
                            y2={y}
                            stroke="#E9EAF0"
                            strokeWidth="1"
                            strokeDasharray={step === 0 ? undefined : '3 5'}
                        />
                        <text x={left - 12} y={y + 4} textAnchor="end" fill="#9AA0AD" fontSize="11">
                            {compactMoney(maximum * step)}
                        </text>
                    </g>
                );
            })}
            <polygon points={areaPoints} fill="url(#report-area-fill)" />
            <polyline points={linePoints} fill="none" stroke="#7657F6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            {activeIndex !== null && (
                <line
                    x1={positions[activeIndex].x}
                    y1={top}
                    x2={positions[activeIndex].x}
                    y2={top + chartHeight}
                    stroke="#7657F6"
                    strokeWidth="1"
                    strokeDasharray="3 4"
                    opacity="0.35"
                    pointerEvents="none"
                />
            )}
            {entries.map((entry, index) => {
                const point = positions[index];
                const tooltipWidth = 188;
                const tooltipHeight = 62;
                const tooltipX = Math.min(Math.max(point.x - tooltipWidth / 2, 2), width - tooltipWidth - 2);
                const tooltipBelow = point.y < 86;
                const tooltipY = tooltipBelow ? Math.min(point.y + 16, height - tooltipHeight - 8) : point.y - tooltipHeight - 12;
                const pointerX = Math.min(Math.max(point.x, tooltipX + 12), tooltipX + tooltipWidth - 12);

                return (
                    <g
                        key={`${entry.label}-${index}`}
                        tabIndex={0}
                        role="img"
                        aria-label={`${entry.label}: ${money(entry.revenue)} revenue from ${entry.count} sales`}
                        className="cursor-pointer outline-none"
                        onMouseEnter={() => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(null)}
                        onFocus={() => setActiveIndex(index)}
                        onBlur={() => setActiveIndex(null)}
                    >
                        <circle cx={point.x} cy={point.y} r="12" fill="transparent" />
                        <circle cx={point.x} cy={point.y} r={activeIndex === index ? 8 : 6} fill="white" stroke="#7657F6" strokeWidth="2" />
                        <circle cx={point.x} cy={point.y} r={activeIndex === index ? 4 : 3.5} fill="#7657F6" />
                        {activeIndex === index && (
                            <g pointerEvents="none" filter="url(#report-tooltip-shadow)">
                                <path
                                    d={
                                        tooltipBelow
                                            ? `M ${pointerX - 6} ${tooltipY} L ${pointerX} ${tooltipY - 7} L ${pointerX + 6} ${tooltipY} Z`
                                            : `M ${pointerX - 6} ${tooltipY + tooltipHeight} L ${pointerX} ${tooltipY + tooltipHeight + 7} L ${pointerX + 6} ${tooltipY + tooltipHeight} Z`
                                    }
                                    fill="#211D30"
                                />
                                <rect x={tooltipX} y={tooltipY} width={tooltipWidth} height={tooltipHeight} rx="10" fill="#211D30" stroke="#3A344E" />
                                <circle cx={tooltipX + 15} cy={tooltipY + 17} r="4" fill="#A78BFA" />
                                <text x={tooltipX + 26} y={tooltipY + 20} fill="#C4BDD6" fontSize="10" fontWeight="500">
                                    {entry.label}
                                </text>
                                <text x={tooltipX + 14} y={tooltipY + 43} fill="white" fontSize="14" fontWeight="700">
                                    {money(entry.revenue)}
                                </text>
                                <text x={tooltipX + 14} y={tooltipY + 56} fill="#C4BDD6" fontSize="9">
                                    {entry.count.toLocaleString('en-PH')} {entry.count === 1 ? 'sale' : 'sales'}
                                </text>
                            </g>
                        )}
                        <text x={point.x} y={height - 22} textAnchor="middle" fontSize="11" fill="#737782">
                            {entry.label}
                        </text>
                    </g>
                );
            })}
        </svg>
    );
}

function makeBuckets(days: Day[], from: string, to: string): ChartEntry[] {
    const start = new Date(`${from}T12:00:00`);
    const end = new Date(`${to}T12:00:00`);
    const rangeDays = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    const bucketType = rangeDays > 70 ? 'month' : rangeDays > 21 ? 'week' : 'day';
    const buckets = new Map<string, ChartEntry>();
    for (const day of days) {
        const date = new Date(`${day.period}T12:00:00`);
        let key = day.period;
        let label = dayLabel(day.period);
        if (bucketType === 'month') {
            key = day.period.slice(0, 7);
            label = date.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' });
        } else if (bucketType === 'week') {
            const monday = new Date(date);
            const weekday = (monday.getDay() + 6) % 7;
            monday.setDate(monday.getDate() - weekday);
            key = dateString(monday);
            label = dayLabel(key);
        }
        const existing = buckets.get(key) ?? { label, revenue: 0, count: 0 };
        existing.revenue += Number(day.total_revenue) || 0;
        existing.count += Number(day.transaction_count) || 0;
        buckets.set(key, existing);
    }
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, entry]) => entry);
}

export default function OwnerReports() {
    const { auth } = usePage().props as unknown as PageProps;
    const [daily, setDaily] = useState<Day[]>([]);
    const [fromInput, setFromInput] = useState(() => daysAgo(29));
    const [toInput, setToInput] = useState(todayString);
    const [range, setRange] = useState(() => ({ from: daysAgo(29), to: todayString() }));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [productStats, setProductStats] = useState<ProductAnalyticsResponse | null>(null);
    const [productLoading, setProductLoading] = useState(true);
    const [productError, setProductError] = useState('');
    const [filterError, setFilterError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);

    useEffect(() => {
        const controller = new AbortController();
        async function load() {
            setLoading(true);
            setError('');
            try {
                const response = await fetch('/owner/sales-analytics/trends', {
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error(`Unable to load report (${response.status}).`);
                const result = (await response.json()) as AnalyticsResponse;
                if (!Array.isArray(result.daily)) throw new Error('Sales report response is missing daily data.');
                if (!controller.signal.aborted) setDaily(result.daily);
            } catch (caught) {
                if (!controller.signal.aborted) setError(caught instanceof Error ? caught.message : 'Unable to load sales report.');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        void load();
        return () => controller.abort();
    }, [reloadKey]);

    useEffect(() => {
        const controller = new AbortController();
        async function loadProductStats() {
            setProductLoading(true);
            setProductError('');
            setProductStats(null);
            try {
                const params = new URLSearchParams({ from: range.from, to: range.to });
                const response = await fetch(`/owner/sales-analytics/products?${params.toString()}`, {
                    credentials: 'same-origin',
                    headers: { Accept: 'application/json' },
                    signal: controller.signal,
                });
                if (!response.ok) throw new Error(`Unable to load product sales (${response.status}).`);
                const result = (await response.json()) as ProductAnalyticsResponse;
                if (
                    !result ||
                    typeof result !== 'object' ||
                    !('best_selling_product' in result) ||
                    !('least_selling_product' in result)
                ) {
                    throw new Error('Product sales response is incomplete.');
                }
                if (!controller.signal.aborted) setProductStats(result);
            } catch (caught) {
                if (!controller.signal.aborted) {
                    setProductError(caught instanceof Error ? caught.message : 'Unable to load product sales.');
                }
            } finally {
                if (!controller.signal.aborted) setProductLoading(false);
            }
        }
        void loadProductStats();
        return () => controller.abort();
    }, [range, reloadKey]);

    const filtered = useMemo(() => daily.filter((item) => item.period >= range.from && item.period <= range.to), [daily, range]);
    const totalRevenue = filtered.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0);
    const grossIncome = filtered.reduce((sum, item) => sum + (Number(item.total_gross_income) || 0), 0);
    const totalTransactions = filtered.reduce((sum, item) => sum + (Number(item.transaction_count) || 0), 0);
    const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const chart = useMemo(() => makeBuckets(filtered, range.from, range.to), [filtered, range]);

    function applyFilter(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!fromInput || !toInput) {
            setFilterError('Select both a From and a To date.');
        } else if (fromInput > toInput) {
            setFilterError('The To date must be the same as or later than the From date.');
        } else {
            setFilterError('');
            setRange({ from: fromInput, to: toInput });
        }
    }

    function exportCsv() {
        const rows = [
            ['Date', 'Completed Transactions', 'Revenue PHP', 'Gross Income PHP'],
            ...filtered.map((day) => [
                day.period,
                String(day.transaction_count),
                String(day.total_revenue),
                String(day.total_gross_income),
            ]),
        ];
        const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(',')).join('\r\n');
        const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' }));
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `m3-sales-report-${range.from}-to-${range.to}.csv`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(url);
    }

    return (
        <>
            <Head title="Sales Reports | M3 Dry Goods" />
            <div className="min-h-screen bg-[#F5F6F8] text-[#19191C] md:flex">
                <OwnerSidebar />

                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[76px] items-center justify-between border-b border-gray-200/80 bg-white px-5 sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="hidden size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:flex">
                                <TrendingUp className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-lg leading-tight font-extrabold">Sales Reports</h1>
                                <p className="text-xs text-gray-500">Analyze revenue and completed transactions</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden text-sm font-semibold text-gray-700 sm:inline">{auth?.user?.name ?? 'Owner'}</span>
                            <div className="flex size-10 items-center justify-center rounded-full bg-[#19191C] text-white">
                                <UserRound className="size-5" />
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
                        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-violet-600 uppercase">Analytics</p>
                                <h2 className="text-2xl font-bold tracking-tight text-[#19191C] sm:text-3xl">Sales performance</h2>
                                <p className="mt-2 text-sm text-gray-500">Track revenue and transaction activity for a date range.</p>
                            </div>
                            <button
                                type="button"
                                onClick={exportCsv}
                                disabled={loading || !!error || filtered.length === 0}
                                className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
                            >
                                <Download className="size-4 text-violet-600" />
                                Export CSV
                            </button>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40">
                            <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                                <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                    <CalendarDays className="size-5" />
                                </span>
                                <div>
                                    <h3 className="text-base font-bold text-[#19191C]">Report date range</h3>
                                    <p className="mt-0.5 text-xs text-gray-500">Choose dates to update the report summary and chart.</p>
                                </div>
                            </div>
                            <form
                                onSubmit={applyFilter}
                                className="grid gap-3 p-4 sm:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto] sm:items-end sm:p-5"
                            >
                                <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-600">
                                    From date
                                    <input
                                        type="date"
                                        value={fromInput}
                                        onChange={(event) => setFromInput(event.target.value)}
                                        className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-[#202023] transition outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                    />
                                </label>
                                <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-600">
                                    To date
                                    <input
                                        type="date"
                                        value={toInput}
                                        onChange={(event) => setToInput(event.target.value)}
                                        className="h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-[#202023] transition outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                    />
                                </label>
                                <button
                                    type="submit"
                                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#625DFF] px-6 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-indigo-600"
                                >
                                    <Search className="size-4" />
                                    Apply dates
                                </button>
                            </form>
                            {filterError && (
                                <p role="alert" className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:mx-5">
                                    {filterError}
                                </p>
                            )}
                        </section>

                        {error && (
                            <div
                                role="alert"
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                <span>{error}</span>
                                <button
                                    type="button"
                                    onClick={() => setReloadKey((key) => key + 1)}
                                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
                                >
                                    <RefreshCw className="size-4" />
                                    Retry
                                </button>
                            </div>
                        )}

                        <section className="grid gap-4 sm:grid-cols-3">
                            {[
                                {
                                    label: 'Total revenue',
                                    value: money(totalRevenue),
                                    icon: Wallet,
                                    style: 'bg-emerald-50 text-emerald-600',
                                    note: 'Completed sales in this range',
                                },
                                {
                                    label: 'Gross Income',
                                    value: money(grossIncome),
                                    icon: Wallet,
                                    style: 'bg-violet-50 text-violet-600',
                                    note: 'Sales subtotal before discounts',
                                },
                                {
                                    label: 'Average sale',
                                    value: money(averageSale),
                                    icon: TrendingUp,
                                    style: 'bg-blue-50 text-blue-600',
                                    note: 'Revenue per transaction',
                                },
                            ].map((card) => {
                                const Icon = card.icon;
                                return (
                                    <article
                                        key={card.label}
                                        className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                                <p className="mt-3 text-2xl font-bold tracking-tight text-[#19191C] sm:text-3xl">{card.value}</p>
                                            </div>
                                            <span className={`flex size-11 items-center justify-center rounded-xl ${card.style}`}>
                                                <Icon className="size-5" />
                                            </span>
                                        </div>
                                        <p className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-500">{card.note}</p>
                                    </article>
                                );
                            })}
                        </section>

                        <section className="grid gap-4 sm:grid-cols-2">
                            {[
                                {
                                    label: 'Best-selling product',
                                    product: productStats?.best_selling_product ?? null,
                                    style: 'bg-emerald-50 text-emerald-600',
                                },
                                {
                                    label: 'Least-selling product',
                                    product: productStats?.least_selling_product ?? null,
                                    style: 'bg-amber-50 text-amber-600',
                                },
                            ].map((card) => (
                                <article
                                    key={card.label}
                                    className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-500">{card.label}</p>
                                            {productLoading ? (
                                                <p className="mt-3 text-sm text-gray-500">Loading product sales...</p>
                                            ) : card.product ? (
                                                <>
                                                    <p className="mt-3 truncate text-xl font-bold tracking-tight text-[#19191C]">
                                                        {card.product.product_name}
                                                    </p>
                                                    <p className="mt-2 text-sm text-gray-600">
                                                        {Number(card.product.units_sold).toLocaleString('en-PH')} units sold
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="mt-3 text-sm text-gray-500">No product sales in this date range</p>
                                            )}
                                        </div>
                                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${card.style}`}>
                                            <ShoppingCart className="size-5" />
                                        </span>
                                    </div>
                                    <p className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-500">
                                        {card.product && !productLoading ? `Product revenue: ${money(Number(card.product.revenue) || 0)}` : 'Based on completed sales'}
                                    </p>
                                </article>
                            ))}
                        </section>
                        {productError && (
                            <div
                                role="alert"
                                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                <span>{productError}</span>
                                <button
                                    type="button"
                                    onClick={() => setReloadKey((key) => key + 1)}
                                    className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
                                >
                                    <RefreshCw className="size-4" />
                                    Retry
                                </button>
                            </div>
                        )}

                        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40 sm:p-6">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-[#19191C]">Revenue over time</h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Completed sales grouped by day, week, or month based on the selected range.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                                    <span className="h-0.5 w-4 rounded-full bg-violet-500" />
                                    Revenue (PHP)
                                </div>
                            </div>
                            {loading ? (
                                <div className="flex h-[285px] items-center justify-center gap-3 text-sm text-gray-500">
                                    <span className="size-5 animate-spin rounded-full border-2 border-violet-200 border-t-violet-600" />
                                    Loading report...
                                </div>
                            ) : chart.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <div className="min-w-[700px]">
                                        <RevenueChart entries={chart} />
                                    </div>
                                </div>
                            ) : (
                                <div className="flex h-[285px] flex-col items-center justify-center gap-2 rounded-xl bg-gray-50 text-center">
                                    <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-gray-300 shadow-sm">
                                        <CalendarDays className="size-6" />
                                    </span>
                                    <p className="text-sm font-semibold text-gray-700">No sales in this date range</p>
                                    <p className="text-xs text-gray-500">Try selecting a different period.</p>
                                </div>
                            )}
                        </section>
                        <p className="flex items-start gap-2 text-xs leading-5 text-gray-500">
                            <CalendarDays className="mt-0.5 size-4 shrink-0" />
                            Report includes completed sales only. Summary cards use the selected date range. CSV export contains daily aggregated
                            figures, not individual receipts.
                        </p>
                    </main>
                </div>
            </div>
        </>
    );
}
