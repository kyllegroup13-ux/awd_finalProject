import { Head, usePage } from '@inertiajs/react';
import {
    CalendarDays, Download, RefreshCw, Search, ShoppingCart,
    TrendingUp, UserRound, Wallet,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { OwnerSidebar } from '@/components/owner-sidebar';

type Day = {
    period: string;
    total_revenue: string | number;
    transaction_count: string | number;
};
type AnalyticsResponse = {
    daily: Day[];
    weekly: Day[];
    monthly: Day[];
};
type PageProps = { auth?: { user?: { name: string } | null } };

const money = (value: number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(value);
const compactMoney = (value: number) =>
    value >= 1000000 ? `₱${(value / 1000000).toFixed(1)}m` :
    value >= 1000 ? `₱${(value / 1000).toFixed(1)}k` : `₱${Math.round(value)}`;
const dateString = (date: Date) => [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
const todayString = () => dateString(new Date());
const daysAgo = (count: number) => {
    const date = new Date();
    date.setDate(date.getDate() - count);
    return dateString(date);
};
const dayLabel = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });

type ChartEntry = { label: string; revenue: number; count: number };
function revenueChart(entries: ChartEntry[]) {
    const width = 900;
    const height = 280;
    const left = 70;
    const right = 20;
    const top = 23;
    const bottom = 49;
    const chartWidth = width - left - right;
    const chartHeight = height - top - bottom;
    const maximum = Math.max(...entries.map((entry) => entry.revenue), 1);
    const barStep = chartWidth / Math.max(entries.length, 1);
    const barWidth = Math.min(42, barStep * 0.55);

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Sales revenue by reporting period">
            {[0, 0.25, 0.5, 0.75, 1].map((step) => {
                const y = top + chartHeight * (1 - step);
                return (
                    <g key={step}>
                        <line x1={left} y1={y} x2={width - right} y2={y} stroke="#E5E7EB" strokeWidth="1" />
                        <text x={left - 12} y={y + 4} textAnchor="end" fill="#697386" fontSize="12">{compactMoney(maximum * step)}</text>
                    </g>
                );
            })}
            {entries.map((entry, i) => {
                const barHeight = (entry.revenue / maximum) * chartHeight;
                const x = left + i * barStep + (barStep - barWidth) / 2;
                return (
                    <g key={`${entry.label}-${i}`}>
                        <rect x={x} y={top + chartHeight - barHeight} width={barWidth} height={barHeight} rx="4" fill="#6158FF">
                            <title>{`${entry.label}: ${money(entry.revenue)} from ${entry.count} transactions`}</title>
                        </rect>
                        <text x={left + (i + 0.5) * barStep} y={height - 22} textAnchor="middle" fontSize="11" fill="#687083">{entry.label}</text>
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

    const filtered = useMemo(() => daily.filter((item) => item.period >= range.from && item.period <= range.to), [daily, range]);
    const totalRevenue = filtered.reduce((sum, item) => sum + (Number(item.total_revenue) || 0), 0);
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
            ['Date', 'Completed Transactions', 'Revenue PHP'],
            ...filtered.map((day) => [day.period, String(day.transaction_count), String(day.total_revenue)]),
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
            <div className="min-h-screen bg-[#E9E9E9] text-[#171717] md:flex">
                <OwnerSidebar />

                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[68px] items-center justify-between bg-[#E9EFF6] px-6 sm:px-8">
                        <div>
                            <h1 className="text-lg font-extrabold leading-tight">Sales Reports</h1>
                            <p className="text-[11px] text-gray-500">Generate and view sales reports</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="hidden sm:inline">{auth?.user?.name ?? 'Owner'}</span>
                            <div className="flex size-9 items-center justify-center rounded-full border border-gray-400 bg-gray-200"><UserRound className="size-5 text-gray-500" /></div>
                        </div>
                    </header>

                    <main className="mx-auto max-w-7xl space-y-5 p-5 sm:p-8 lg:pt-12">
                        <form onSubmit={applyFilter} className="flex flex-wrap items-end gap-4">
                            <label className="flex min-w-[170px] flex-1 flex-col gap-2 text-sm font-semibold sm:max-w-[245px]">
                                From
                                <input type="date" value={fromInput} onChange={(event) => setFromInput(event.target.value)} className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#6158FF]" />
                            </label>
                            <label className="flex min-w-[170px] flex-1 flex-col gap-2 text-sm font-semibold sm:max-w-[245px]">
                                To
                                <input type="date" value={toInput} onChange={(event) => setToInput(event.target.value)} className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-[#6158FF]" />
                            </label>
                            <button type="submit" className="flex h-11 min-w-[128px] items-center justify-center gap-2 rounded-lg bg-[#6158FF] px-6 text-sm font-bold text-white hover:bg-[#5047E7]">
                                <Search className="size-4" />Search
                            </button>
                            <button type="button" onClick={exportCsv} disabled={loading || !!error || filtered.length === 0} className="flex h-11 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-semibold hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50">
                                <Download className="size-4" />Export CSV
                            </button>
                        </form>
                        {filterError && <p role="alert" className="text-sm text-red-600">{filterError}</p>}
                        {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                            <span>{error}</span><button type="button" onClick={() => setReloadKey((key) => key + 1)} className="flex items-center gap-1 font-semibold underline"><RefreshCw className="size-4" />Retry</button>
                        </div>}

                        <section className="rounded-lg bg-white px-4 py-5 shadow-sm sm:px-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <div><h2 className="text-base font-bold">Sales Overview</h2><p className="text-xs text-gray-500">Revenue from completed sales within the selected date range</p></div>
                                <div className="flex items-center gap-2 text-xs text-gray-500"><span className="size-3 rounded bg-[#6158FF]" />Revenue (PHP)</div>
                            </div>
                            {loading ? <p className="flex h-[285px] items-center justify-center text-sm text-gray-500">Loading report...</p> :
                                chart.length > 0 ? revenueChart(chart) : <div className="flex h-[285px] flex-col items-center justify-center gap-2 text-sm text-gray-500"><CalendarDays className="size-8 text-gray-300" />No completed sales in this date range.</div>}
                        </section>

                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="flex min-h-[112px] items-center gap-3 rounded-xl bg-[#55E64D] p-5">
                                <div className="rounded-lg bg-white/45 p-2 text-green-800"><Wallet className="size-6" /></div>
                                <div><p className="text-xs font-semibold">Total Sales</p><p className="text-xl font-black sm:text-2xl">{money(totalRevenue)}</p></div>
                            </div>
                            <div className="flex min-h-[112px] items-center gap-3 rounded-xl bg-[#50A5DB] p-5">
                                <div className="rounded-lg bg-white/40 p-2 text-blue-800"><ShoppingCart className="size-6" /></div>
                                <div><p className="text-xs font-semibold">Total Transactions</p><p className="text-2xl font-black">{totalTransactions.toLocaleString('en-PH')}</p></div>
                            </div>
                            <div className="flex min-h-[112px] items-center gap-3 rounded-xl bg-[#F7BA61] p-5">
                                <div className="rounded-lg bg-white/40 p-2 text-amber-800"><TrendingUp className="size-6" /></div>
                                <div><p className="text-xs font-semibold">Average Sale</p><p className="text-xl font-black sm:text-2xl">{money(averageSale)}</p></div>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500">Report includes completed sales only. All three summary cards use the selected date range. Export CSV contains daily aggregated figures, not individual receipts.</p>
                    </main>
                </div>
            </div>
        </>
    );
}
