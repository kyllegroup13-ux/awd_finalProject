import { Head, Link, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowRight, ArrowUpRight, Box, CalendarDays, ChartNoAxesCombined, Tag, UserRound, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

import { OwnerSidebar } from '@/components/owner-sidebar';

type RecentSale = {
    id: number;
    receipt_number: string;
    total_amount: string | number;
    created_at: string;
    cashier: { name: string } | null;
};
type LowStockVariant = {
    id: number;
    sku: string;
    stock_quantity: number;
    reorder_level: number;
    product: { name: string } | null;
};
type DashboardProps = {
    todaySales?: number | string;
    totalProducts?: number;
    lowStockCount?: number;
    recentSales?: RecentSale[];
    lowStockVariants?: LowStockVariant[];
    auth?: { user?: { name: string } | null };
};
type Trends = {
    monthly: Array<{ period: string; total_revenue: string | number }>;
};

const peso = (value: string | number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);

function SalesChart({ months }: { months: Trends['monthly'] }) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const recent = months.slice(-6);
    const values = recent.map((m) => Number(m.total_revenue) || 0);
    const maxValue = Math.max(...values, 1);
    const width = 600;
    const height = 190;
    const left = 54;
    const right = 16;
    const top = 14;
    const bottom = 37;
    const plotWidth = width - left - right;
    const plotHeight = height - top - bottom;
    const positions = values.map((value, i) => ({
        x: left + (recent.length === 1 ? plotWidth / 2 : (i / (recent.length - 1)) * plotWidth),
        y: top + plotHeight - (value / maxValue) * plotHeight,
    }));
    const points = positions.map(({ x, y }) => `${x},${y}`).join(' ');
    const areaPoints =
        positions.length > 0 ? `${positions[0].x},${top + plotHeight} ${points} ${positions[positions.length - 1].x},${top + plotHeight}` : '';

    if (recent.length === 0) {
        return (
            <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
                <div className="flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                    <ChartNoAxesCombined className="size-5" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No sales data yet</p>
                <p className="text-xs text-gray-500">Monthly revenue will appear here after sales are recorded.</p>
            </div>
        );
    }

    return (
        <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[520px]" role="img" aria-label="Monthly revenue trend chart">
                <defs>
                    <linearGradient id="sales-area-fill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#7657F6" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#7657F6" stopOpacity="0" />
                    </linearGradient>
                    <filter id="sales-tooltip-shadow" x="-30%" y="-30%" width="160%" height="180%">
                        <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#171324" floodOpacity="0.22" />
                    </filter>
                </defs>
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                    const y = top + plotHeight * (1 - fraction);
                    return (
                        <g key={fraction}>
                            <line
                                x1={left}
                                x2={width - right}
                                y1={y}
                                y2={y}
                                stroke="#E9EAF0"
                                strokeWidth="1"
                                strokeDasharray={fraction === 0 ? undefined : '3 5'}
                            />
                            <text x={left - 10} y={y + 4} textAnchor="end" fill="#9AA0AD" fontSize="10">
                                {Math.round((maxValue * fraction) / 1000)}k
                            </text>
                        </g>
                    );
                })}
                <polygon points={areaPoints} fill="url(#sales-area-fill)" />
                <polyline points={points} fill="none" stroke="#7657F6" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {hoveredIndex !== null && (
                    <line
                        x1={positions[hoveredIndex].x}
                        x2={positions[hoveredIndex].x}
                        y1={top}
                        y2={top + plotHeight}
                        stroke="#7657F6"
                        strokeWidth="1"
                        strokeDasharray="3 4"
                        opacity="0.35"
                        pointerEvents="none"
                    />
                )}
                {positions.map((p, i) => {
                    const monthLabel = new Date(`${recent[i].period}-01T12:00:00`).toLocaleDateString('en-PH', {
                        month: 'long',
                        year: 'numeric',
                    });
                    const salesLabel = peso(recent[i].total_revenue);
                    const tooltipWidth = 184;
                    const tooltipHeight = 56;
                    const tooltipX = Math.min(Math.max(p.x - tooltipWidth / 2, 2), width - tooltipWidth - 2);
                    const tooltipBelow = p.y < 76;
                    const tooltipY = tooltipBelow ? Math.min(p.y + 16, height - tooltipHeight - 8) : p.y - tooltipHeight - 12;
                    const pointerX = Math.min(Math.max(p.x, tooltipX + 12), tooltipX + tooltipWidth - 12);

                    return (
                        <g
                            key={recent[i].period}
                            tabIndex={0}
                            role="img"
                            aria-label={`${monthLabel}: ${salesLabel} in sales`}
                            className="cursor-pointer outline-none"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            onFocus={() => setHoveredIndex(i)}
                            onBlur={() => setHoveredIndex(null)}
                        >
                            <circle cx={p.x} cy={p.y} r="12" fill="transparent" />
                            <circle
                                cx={p.x}
                                cy={p.y}
                                r={hoveredIndex === i ? 8 : 6}
                                fill="white"
                                stroke={hoveredIndex === i ? '#7657F6' : 'white'}
                                strokeWidth="2"
                            />
                            <circle cx={p.x} cy={p.y} r={hoveredIndex === i ? 4 : 3.5} fill="#7657F6" />
                            {hoveredIndex === i && (
                                <g pointerEvents="none" filter="url(#sales-tooltip-shadow)">
                                    <path
                                        d={
                                            tooltipBelow
                                                ? `M ${pointerX - 6} ${tooltipY} L ${pointerX} ${tooltipY - 7} L ${pointerX + 6} ${tooltipY} Z`
                                                : `M ${pointerX - 6} ${tooltipY + tooltipHeight} L ${pointerX} ${tooltipY + tooltipHeight + 7} L ${pointerX + 6} ${tooltipY + tooltipHeight} Z`
                                        }
                                        fill="#211D30"
                                    />
                                    <rect
                                        x={tooltipX}
                                        y={tooltipY}
                                        width={tooltipWidth}
                                        height={tooltipHeight}
                                        rx="10"
                                        fill="#211D30"
                                        stroke="#3A344E"
                                        strokeWidth="1"
                                    />
                                    <circle cx={tooltipX + 15} cy={tooltipY + 17} r="4" fill="#A78BFA" />
                                    <text x={tooltipX + 26} y={tooltipY + 20} fill="#C4BDD6" fontSize="10" fontWeight="500">
                                        {monthLabel}
                                    </text>
                                    <text x={tooltipX + 14} y={tooltipY + 43} fill="white" fontSize="15" fontWeight="700">
                                        {salesLabel}
                                    </text>
                                </g>
                            )}
                        </g>
                    );
                })}
                {recent.map((month, i) => (
                    <text key={month.period} x={positions[i].x} y={height - 13} textAnchor="middle" fill="#737782" fontSize="11">
                        {new Date(`${month.period}-01T12:00:00`).toLocaleDateString('en-PH', { month: 'short' })}
                    </text>
                ))}
            </svg>
        </div>
    );
}

export default function Dashboard({ todaySales = 0, totalProducts = 0, lowStockCount = 0, recentSales = [], lowStockVariants = [] }: DashboardProps) {
    const { auth } = usePage().props as unknown as DashboardProps;
    const [months, setMonths] = useState<Trends['monthly']>([]);
    const [trendsError, setTrendsError] = useState(false);

    useEffect(() => {
        const controller = new AbortController();
        fetch('/owner/sales-analytics/trends', {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
        })
            .then((r) => {
                if (!r.ok) throw new Error('Could not load trends');
                return r.json() as Promise<Trends>;
            })
            .then((data) => setMonths(data.monthly ?? []))
            .catch(() => {
                if (!controller.signal.aborted) setTrendsError(true);
            });
        return () => controller.abort();
    }, []);

    const today = new Date().toLocaleDateString('en-PH', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });
    const ownerName = auth?.user?.name ?? 'Owner';
    const sixMonthRevenue = months.slice(-6).reduce((total, month) => total + (Number(month.total_revenue) || 0), 0);

    return (
        <>
            <Head title="Owner Dashboard | M3 Dry Goods" />
            <div className="min-h-screen bg-[#F5F6F8] text-[#19191C] md:flex">
                <OwnerSidebar />

                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[76px] items-center justify-between border-b border-gray-200/80 bg-white px-5 sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="hidden size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:flex">
                                <ChartNoAxesCombined className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-lg leading-tight font-extrabold">Dashboard</h1>
                                <p className="text-xs text-gray-500">Store overview</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs font-medium text-gray-500 sm:flex">
                                <CalendarDays className="size-4 text-gray-400" />
                                {today}
                            </div>
                            <div className="flex size-10 items-center justify-center rounded-full bg-[#19191C] text-white">
                                <UserRound className="size-5" />
                            </div>
                            <span className="hidden text-sm font-semibold text-gray-700 sm:inline">{ownerName}</span>
                        </div>
                    </header>
                    <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
                        <section className="relative overflow-hidden rounded-2xl bg-[#19191C] px-6 py-7 text-white shadow-sm sm:px-8 sm:py-8">
                            <div className="pointer-events-none absolute -top-24 right-10 size-64 rounded-full bg-violet-500/15 blur-3xl" />
                            <div className="pointer-events-none absolute -right-12 -bottom-36 size-72 rounded-full border border-white/10" />
                            <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <p className="mb-2 text-xs font-semibold tracking-[0.18em] text-violet-300 uppercase">Store at a glance</p>
                                    <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome back, {ownerName}</h2>
                                    <p className="mt-2 max-w-xl text-sm text-gray-300">
                                        Here’s how your store is performing. Keep an eye on today’s sales and inventory.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href="/owner/manage/inventory"
                                        className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                                    >
                                        Manage inventory <ArrowRight className="size-4" />
                                    </Link>
                                    <Link
                                        href="/owner/sales"
                                        className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#19191C] transition hover:bg-gray-100"
                                    >
                                        View sales <ArrowUpRight className="size-4" />
                                    </Link>
                                </div>
                            </div>
                        </section>

                        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                            <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Today’s sales</p>
                                        <p className="mt-3 text-2xl font-bold tracking-tight text-[#19191C] sm:text-3xl">{peso(todaySales)}</p>
                                    </div>
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <Wallet className="size-5" />
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                                    <span className="size-2 rounded-full bg-emerald-500" />
                                    Revenue recorded today
                                </div>
                            </article>
                            <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Total products</p>
                                        <p className="mt-3 text-2xl font-bold tracking-tight text-[#19191C] sm:text-3xl">
                                            {totalProducts.toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="flex size-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                        <Tag className="size-5" />
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center gap-2 border-t border-gray-100 pt-4 text-xs text-gray-500">
                                    <Box className="size-3.5 text-violet-500" />
                                    Products in your catalog
                                </div>
                            </article>
                            <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Low stock items</p>
                                        <p className="mt-3 text-2xl font-bold tracking-tight text-[#19191C] sm:text-3xl">
                                            {lowStockCount.toLocaleString()}
                                        </p>
                                    </div>
                                    <div
                                        className={`flex size-11 items-center justify-center rounded-xl ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}
                                    >
                                        <AlertTriangle className="size-5" />
                                    </div>
                                </div>
                                <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4 text-xs">
                                    <span className={lowStockCount > 0 ? 'font-medium text-amber-700' : 'text-gray-500'}>
                                        {lowStockCount > 0 ? 'Needs your attention' : 'All stock levels look good'}
                                    </span>
                                    <Link href="/owner/manage/inventory" className="font-semibold text-violet-600 hover:text-violet-700">
                                        Review
                                    </Link>
                                </div>
                            </article>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40 sm:p-6">
                            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-[#19191C]">Sales overview</h2>
                                    <p className="mt-1 text-xs text-gray-500">Revenue across the last six months</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="hidden items-center gap-2 text-xs font-medium text-gray-500 sm:flex">
                                        <span className="size-2 rounded-full bg-violet-500" />
                                        Monthly revenue
                                    </div>
                                    <div className="rounded-lg bg-violet-50 px-3 py-2 text-right">
                                        <p className="text-[10px] font-semibold tracking-wide text-violet-600 uppercase">6-month total</p>
                                        <p className="mt-0.5 text-sm font-bold text-violet-900">{peso(sixMonthRevenue)}</p>
                                    </div>
                                </div>
                            </div>
                            {trendsError ? (
                                <div
                                    role="alert"
                                    className="flex min-h-56 items-center justify-center rounded-xl bg-red-50 px-4 text-center text-sm font-medium text-red-700"
                                >
                                    Could not load sales trends.
                                </div>
                            ) : (
                                <SalesChart months={months} />
                            )}
                        </section>

                        <section className="grid gap-5 xl:grid-cols-2">
                            <article className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40">
                                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                                    <div>
                                        <h2 className="text-base font-bold text-[#19191C]">Recent transactions</h2>
                                        <p className="mt-0.5 text-xs text-gray-500">Latest completed sales</p>
                                    </div>
                                    <Link
                                        href="/owner/sales"
                                        aria-label="View all sales"
                                        className="flex size-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-violet-50 hover:text-violet-600"
                                    >
                                        <ArrowUpRight className="size-4" />
                                    </Link>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[560px] text-left text-sm">
                                        <thead className="bg-gray-50 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3">Transaction</th>
                                                <th className="px-5 py-3">Date & time</th>
                                                <th className="px-5 py-3">Staff</th>
                                                <th className="px-5 py-3 text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentSales.map((sale) => (
                                                <tr key={sale.id} className="border-t border-gray-100 transition hover:bg-gray-50/70">
                                                    <td className="px-5 py-3.5 font-semibold text-gray-800">{sale.receipt_number}</td>
                                                    <td className="px-5 py-3.5 text-gray-500">
                                                        {new Date(sale.created_at).toLocaleString('en-PH', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                        })}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-gray-600">{sale.cashier?.name ?? '—'}</td>
                                                    <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{peso(sale.total_amount)}</td>
                                                </tr>
                                            ))}
                                            {recentSales.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-5 py-14 text-center">
                                                        <p className="text-sm font-semibold text-gray-700">No transactions yet</p>
                                                        <p className="mt-1 text-xs text-gray-500">Completed sales will show up here.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Link
                                    href="/owner/sales"
                                    className="flex items-center justify-center gap-2 border-t border-gray-100 px-5 py-3 text-xs font-semibold text-violet-600 transition hover:bg-violet-50/60"
                                >
                                    View all transactions <ArrowRight className="size-3.5" />
                                </Link>
                            </article>

                            <article className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40">
                                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                                    <div>
                                        <h2 className="text-base font-bold text-[#19191C]">Inventory alerts</h2>
                                        <p className="mt-0.5 text-xs text-gray-500">Products that may need restocking</p>
                                    </div>
                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${lowStockCount > 0 ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}
                                    >
                                        {lowStockCount} low
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[440px] text-left text-sm">
                                        <thead className="bg-gray-50 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
                                            <tr>
                                                <th className="px-5 py-3">Product</th>
                                                <th className="px-5 py-3">SKU</th>
                                                <th className="px-5 py-3 text-right">Stock</th>
                                                <th className="px-5 py-3 text-right">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {lowStockVariants.map((variant) => (
                                                <tr key={variant.id} className="border-t border-gray-100 transition hover:bg-gray-50/70">
                                                    <td className="max-w-[160px] truncate px-5 py-3.5 font-medium text-gray-800">
                                                        {variant.product?.name ?? variant.sku}
                                                    </td>
                                                    <td className="px-5 py-3.5 text-xs text-gray-500">{variant.sku}</td>
                                                    <td className="px-5 py-3.5 text-right font-semibold text-gray-800">{variant.stock_quantity}</td>
                                                    <td className="px-5 py-3.5 text-right">
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                                                            <span className="size-1.5 rounded-full bg-amber-500" />
                                                            Low
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {lowStockVariants.length === 0 && (
                                                <tr>
                                                    <td colSpan={4} className="px-5 py-14 text-center">
                                                        <p className="text-sm font-semibold text-gray-700">Stock is looking good</p>
                                                        <p className="mt-1 text-xs text-gray-500">No low-stock variants to review.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <Link
                                    href="/owner/manage/inventory"
                                    className="flex items-center justify-center gap-2 border-t border-gray-100 px-5 py-3 text-xs font-semibold text-violet-600 transition hover:bg-violet-50/60"
                                >
                                    Go to inventory <ArrowRight className="size-3.5" />
                                </Link>
                            </article>
                        </section>
                    </main>
                </div>
            </div>
        </>
    );
}
