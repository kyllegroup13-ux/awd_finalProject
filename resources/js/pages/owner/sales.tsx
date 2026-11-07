import { Head, router, usePage } from '@inertiajs/react';
import {
    ChevronLeft, ChevronRight, Eye, UserRound, X,
} from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

import { OwnerSidebar } from '@/components/owner-sidebar';

type SaleItem = {
    id: number;
    product_name: string;
    sku: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unit_price: string | number;
    subtotal: string | number;
};
type Payment = {
    payment_method: string;
    amount_received: string | number;
    change_amount: string | number;
    reference_number: string | null;
};
type Sale = {
    id: number;
    receipt_number: string;
    cashier_id: number;
    cashier: { id: number; name: string } | null;
    subtotal: string | number;
    discount: string | number;
    total_amount: string | number;
    status: string;
    created_at: string;
    items: SaleItem[];
    payment: Payment | null;
};
type PaginatedSales = {
    data: Sale[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};
type Props = {
    sales: PaginatedSales;
    filters: { from: string; to: string };
    auth?: { user?: { name: string } | null };
};

const peso = (amount: string | number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount) || 0);
const dateTime = (date: string) => new Date(date).toLocaleString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
});

export default function OwnerSales({ sales, filters }: Props) {
    const { auth } = usePage().props as unknown as Props;
    const [from, setFrom] = useState(filters.from);
    const [to, setTo] = useState(filters.to);
    const [selected, setSelected] = useState<Sale | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        setFrom(filters.from);
        setTo(filters.to);
    }, [filters.from, filters.to]);

    useEffect(() => {
        if (!selected) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setSelected(null);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [selected]);

    function search(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (from && to && from > to) {
            setError('The To date must be the same as or later than the From date.');
            return;
        }
        setError('');
        router.get('/owner/sales', { ...(from ? { from } : {}), ...(to ? { to } : {}) }, {
            preserveState: true, preserveScroll: true, replace: true,
        });
    }

    function clearDates() {
        setFrom('');
        setTo('');
        setError('');
        router.get('/owner/sales', {}, { preserveState: true, preserveScroll: true, replace: true });
    }

    function navigate(url: string | null) {
        if (url) router.visit(url, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Sales Records | M3 Dry Goods" />
            <div className="min-h-screen bg-[#E9E9E9] text-[#171717] md:flex">
                <OwnerSidebar />

                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[74px] items-center justify-between bg-[#E9EFF6] px-6 sm:px-8">
                        <div>
                            <h1 className="text-lg font-extrabold leading-tight">Sales Records</h1>
                            <p className="text-[11px] text-gray-500">Manage records in each timeframe</p>
                        </div>
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <span className="hidden sm:inline">{auth?.user?.name ?? 'Owner'}</span>
                            <div className="flex size-9 items-center justify-center rounded-full border border-gray-400 bg-gray-200">
                                <UserRound className="size-5 text-gray-500" />
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto max-w-[1160px] px-5 pb-12 pt-12 sm:px-8 lg:pt-20">
                        <form onSubmit={search} className="mb-3 flex flex-wrap items-end gap-4 sm:gap-6">
                            <label className="flex min-w-[180px] flex-1 flex-col gap-1.5 text-sm font-bold sm:max-w-[220px]">
                                From
                                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
                                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold outline-none focus:border-[#635BFF]" />
                            </label>
                            <label className="flex min-w-[180px] flex-1 flex-col gap-1.5 text-sm font-bold sm:max-w-[220px]">
                                To
                                <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
                                    className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold outline-none focus:border-[#635BFF]" />
                            </label>
                            <button type="submit" className="h-11 min-w-28 rounded-lg bg-[#605BFF] px-6 text-sm font-semibold text-white transition hover:bg-[#514AEA]">
                                Search
                            </button>
                            {(filters.from || filters.to) && (
                                <button type="button" onClick={clearDates} className="h-11 rounded-lg border border-gray-300 bg-white px-4 text-sm hover:bg-gray-100">
                                    Clear
                                </button>
                            )}
                        </form>
                        {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}
                        <p className="mb-3 text-xs text-gray-500">{sales.total} completed transaction{sales.total === 1 ? '' : 's'} {filters.from || filters.to ? 'in selected date range' : 'in total'}</p>

                        <section className="overflow-hidden rounded-2xl bg-[#F5F5F5]">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[680px] text-left text-xs">
                                    <thead className="bg-[#D9D9D9] text-[#262626]">
                                        <tr>
                                            <th className="px-4 py-4 text-center">Transaction No.</th>
                                            <th className="px-4 py-4 text-center">Date &amp; Time</th>
                                            <th className="px-4 py-4 text-center">Staff</th>
                                            <th className="px-4 py-4 text-center">Items</th>
                                            <th className="px-4 py-4 text-center">Total</th>
                                            <th className="px-4 py-4 text-center">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sales.data.map((sale) => (
                                            <tr key={sale.id} className="border-b border-gray-200/70 last:border-b-0 hover:bg-white/60">
                                                <td className="px-4 py-4 text-center font-bold">{sale.receipt_number}</td>
                                                <td className="px-4 py-4 text-center">{dateTime(sale.created_at)}</td>
                                                <td className="px-4 py-4 text-center font-medium">{sale.cashier?.name ?? `Cashier #${sale.cashier_id}`}</td>
                                                <td className="px-4 py-4 text-center">{sale.items.reduce((sum, item) => sum + Number(item.quantity), 0)}</td>
                                                <td className="px-4 py-4 text-center font-semibold">{peso(sale.total_amount)}</td>
                                                <td className="px-4 py-4 text-center">
                                                    <button type="button" onClick={() => setSelected(sale)} aria-label={`View ${sale.receipt_number}`}
                                                        className="inline-flex size-8 items-center justify-center rounded-md bg-[#A7A3FF] text-[#4643FF] transition hover:bg-[#8C87FF] hover:text-white">
                                                        <Eye className="size-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {sales.data.length === 0 && (
                                            <tr><td colSpan={6} className="px-4 py-12 text-center text-sm text-gray-500">No completed transactions for this date range.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        <div className="mt-7 flex flex-wrap items-center justify-end gap-3 text-sm">
                            <button type="button" onClick={() => navigate(sales.prev_page_url)} disabled={!sales.prev_page_url}
                                className="inline-flex items-center gap-1 text-gray-500 disabled:opacity-40 hover:text-black">
                                <ChevronLeft className="size-4" />Previous
                            </button>
                            <span className="rounded-md bg-[#303033] px-3 py-1.5 font-bold text-white">{sales.current_page}</span>
                            <span className="text-gray-500">of {sales.last_page}</span>
                            <button type="button" onClick={() => navigate(sales.next_page_url)} disabled={!sales.next_page_url}
                                className="inline-flex items-center gap-1 text-gray-700 disabled:opacity-40 hover:text-black">
                                Next<ChevronRight className="size-4" />
                            </button>
                        </div>
                    </main>
                </div>
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => {
                    if (e.target === e.currentTarget) setSelected(null);
                }}>
                    <section role="dialog" aria-modal="true" aria-labelledby="sale-detail-title"
                        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2 id="sale-detail-title" className="text-xl font-bold">{selected.receipt_number}</h2>
                                <p className="text-xs text-gray-500">{dateTime(selected.created_at)}</p>
                                <p className="mt-1 text-xs text-gray-500">Cashier: {selected.cashier?.name ?? `#${selected.cashier_id}`}</p>
                            </div>
                            <button type="button" onClick={() => setSelected(null)} aria-label="Close details" className="rounded-lg p-2 hover:bg-gray-100"><X className="size-5" /></button>
                        </div>
                        <div className="space-y-3">
                            {selected.items.map((item) => (
                                <div key={item.id} className="flex justify-between gap-3 border-b pb-3 text-sm">
                                    <div><p className="font-semibold">{item.product_name}</p><p className="text-xs text-gray-500">{item.sku} · {item.size ?? '—'} / {item.color ?? '—'} · {item.quantity} × {peso(item.unit_price)}</p></div>
                                    <span className="shrink-0 font-semibold">{peso(item.subtotal)}</span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-5 space-y-2 text-sm">
                            <div className="flex justify-between"><span>Subtotal</span><span>{peso(selected.subtotal)}</span></div>
                            <div className="flex justify-between"><span>Discount</span><span>{peso(selected.discount)}</span></div>
                            <div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Total</span><span>{peso(selected.total_amount)}</span></div>
                            <div className="flex justify-between"><span>Payment</span><span className="uppercase">{selected.payment?.payment_method ?? '—'}</span></div>
                            {selected.payment && (
                                <>
                                    <div className="flex justify-between"><span>Amount Received</span><span>{peso(selected.payment.amount_received)}</span></div>
                                    <div className="flex justify-between"><span>Change</span><span>{peso(selected.payment.change_amount)}</span></div>
                                    {selected.payment.reference_number && <p className="break-all text-xs text-gray-500">GCash Reference: {selected.payment.reference_number}</p>}
                                </>
                            )}
                        </div>
                        <button type="button" onClick={() => setSelected(null)} className="mt-6 w-full rounded-lg bg-[#605BFF] py-3 text-sm font-semibold text-white hover:bg-[#514AEA]">Close</button>
                    </section>
                </div>
            )}
        </>
    );
}
