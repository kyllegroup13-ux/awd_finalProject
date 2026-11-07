import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowUpRight,
    Box,
    ChartNoAxesCombined,
    Tag,
    UserRound,
    Wallet,
} from 'lucide-react';
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

    if (recent.length === 0) {
        return <div className="flex h-48 items-center justify-center text-sm text-gray-500">No completed sales data yet.</div>;
    }

    return (
        <div className="w-full overflow-hidden">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Monthly revenue trend chart">
                {[0, 0.25, 0.5, 0.75, 1].map((fraction) => {
                    const y = top + plotHeight * (1 - fraction);
                    return (
                        <g key={fraction}>
                            <line x1={left} x2={width - right} y1={y} y2={y} stroke="#E5E7EB" strokeWidth="1" />
                            <text x={left - 9} y={y + 4} textAnchor="end" fill="#90949E" fontSize="10">
                                {Math.round((maxValue * fraction) / 1000)}k
                            </text>
                        </g>
                    );
                })}
                <polyline points={points} fill="none" stroke="#9E63FF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                {positions.map((p, i) => <circle key={recent[i].period} cx={p.x} cy={p.y} r="3.5" fill="#9E63FF" />)}
                {recent.map((month, i) => (
                    <text key={month.period} x={positions[i].x} y={height - 13} textAnchor="middle" fill="#737782" fontSize="11">
                        {new Date(`${month.period}-01T12:00:00`).toLocaleDateString('en-PH', { month: 'short' })}
                    </text>
                ))}
            </svg>
            <div className="mt-1 flex items-center gap-2 pl-2 text-xs text-gray-500">
                <span className="h-2 w-3 bg-[#9E63FF]" /> Monthly revenue
            </div>
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
        weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    return (
        <>
            <Head title="Owner Dashboard | M3 Dry Goods" />
            <div className="min-h-screen bg-[#F4F5F7] text-[#171717] md:flex">
                <OwnerSidebar />

                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[68px] items-center justify-between bg-[#E9EFF6] px-6 sm:px-8">
                        <div>
                            <h1 className="text-lg font-extrabold leading-tight">Dashboard</h1>
                            <p className="text-[11px] text-gray-500">{today}</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <span className="hidden sm:inline">{auth?.user?.name ?? 'Owner'}</span>
                            <div className="flex size-9 items-center justify-center rounded-full border border-gray-400 bg-gray-200"><UserRound className="size-5 text-gray-500" /></div>
                        </div>
                    </header>
                    <main className="space-y-5 p-5 sm:p-7">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="flex min-h-[112px] items-center gap-3 rounded-xl border-2 border-[#4DDB53] bg-[#91E789] p-4">
                                <div className="rounded-lg bg-[#B9F6B7] p-2 text-green-700"><Wallet className="size-6" /></div>
                                <div><p className="text-xs font-semibold">Today's Sales</p><p className="text-xl font-black leading-tight sm:text-2xl">{peso(todaySales)}</p></div>
                            </div>
                            <div className="flex min-h-[112px] items-center gap-3 rounded-xl border-2 border-[#FFA200] bg-[#FFCA73] p-4">
                                <div className="rounded-lg bg-[#FFDEA1] p-2 text-orange-600"><Tag className="size-6" /></div>
                                <div><p className="text-xs font-semibold">Total Products</p><p className="text-2xl font-black leading-tight">{totalProducts}</p></div>
                            </div>
                            <div className="flex min-h-[112px] items-center gap-3 rounded-xl border-2 border-[#FF4357] bg-[#F9858D] p-4">
                                <div className="rounded-lg bg-[#FFB6BD] p-2 text-red-600"><Box className="size-6" /></div>
                                <div><p className="text-xs font-semibold">Low Stock Items</p><p className="text-2xl font-black leading-tight">{lowStockCount}</p></div>
                            </div>
                        </div>

                        <section className="rounded-xl border-2 border-[#9B9B9B] bg-white p-4 sm:p-5">
                            <div className="mb-2 flex items-center justify-between">
                                <h2 className="text-base font-extrabold">Sales Overview</h2>
                                <ChartNoAxesCombined className="size-5 text-purple-400" />
                            </div>
                            {trendsError ? <p className="py-12 text-center text-sm text-red-600">Could not load sales trends.</p> : <SalesChart months={months} />}
                        </section>

                        <div className="grid gap-4 xl:grid-cols-2">
                            <section className="flex min-h-[285px] flex-col overflow-hidden rounded-xl border-2 border-[#9B9B9B] bg-white">
                                <h2 className="px-4 py-3 text-base font-extrabold">Recent Transactions</h2>
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#DADADA]"><tr><th className="px-3 py-3">Transaction No.</th><th className="px-3 py-3">Date & Time</th><th className="px-3 py-3">Staff</th><th className="px-3 py-3">Total</th></tr></thead>
                                        <tbody>
                                            {recentSales.map((sale) => <tr key={sale.id} className="border-b border-gray-100"><td className="px-3 py-2 font-semibold">{sale.receipt_number}</td><td className="px-3 py-2">{new Date(sale.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</td><td className="px-3 py-2">{sale.cashier?.name ?? '—'}</td><td className="px-3 py-2 font-semibold">{peso(sale.total_amount)}</td></tr>)}
                                            {recentSales.length === 0 && <tr><td colSpan={4} className="px-3 py-10 text-center text-gray-500">No completed transactions yet.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                                <Link href="/owner/sales" className="flex items-center justify-end gap-1 border-t px-4 py-2 text-xs font-semibold text-sky-500 hover:underline">View All <ArrowUpRight className="size-3" /></Link>
                            </section>
                            <section className="flex min-h-[285px] flex-col overflow-hidden rounded-xl border-2 border-[#9B9B9B] bg-white">
                                <h2 className="px-4 py-3 text-base font-extrabold">Low Stock Items</h2>
                                <div className="flex-1 overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-[#DADADA]"><tr><th className="px-3 py-3">Product</th><th className="px-3 py-3">Current Stocks</th><th className="px-3 py-3">Status</th></tr></thead>
                                        <tbody>
                                            {lowStockVariants.map((variant) => <tr key={variant.id} className="border-b border-gray-100"><td className="px-3 py-2">{variant.product?.name ?? variant.sku}<span className="block text-[10px] text-gray-500">{variant.sku}</span></td><td className="px-3 py-2">{variant.stock_quantity}</td><td className="px-3 py-2"><span className="inline-block rounded-md bg-[#FF4F59] px-3 py-1 font-semibold text-white">Low</span></td></tr>)}
                                            {lowStockVariants.length === 0 && <tr><td colSpan={3} className="px-3 py-10 text-center text-gray-500">No low-stock variants.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="border-t px-4 py-2 text-right text-xs text-gray-500">Inventory details coming soon</div>
                            </section>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
