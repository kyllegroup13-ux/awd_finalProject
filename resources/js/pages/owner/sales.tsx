import { Head, router, usePage } from '@inertiajs/react';
import { BadgeCheck, CalendarDays, ChevronLeft, ChevronRight, CreditCard, Eye, ReceiptText, Search, UserRound, Wallet, X } from 'lucide-react';
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

const peso = (amount: string | number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount) || 0);
const dateTime = (date: string) =>
    new Date(date).toLocaleString('en-PH', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
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
        router.get(
            '/owner/sales',
            { ...(from ? { from } : {}), ...(to ? { to } : {}) },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
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
            <div className="min-h-screen bg-[#F5F6F8] text-[#19191C] md:flex">
                <OwnerSidebar />

                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[76px] items-center justify-between border-b border-gray-200/80 bg-white px-5 sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="hidden size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:flex">
                                <ReceiptText className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-lg leading-tight font-extrabold">Sales Records</h1>
                                <p className="text-xs text-gray-500">Review completed transactions and payment details</p>
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
                                <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-violet-600 uppercase">Transactions</p>
                                <h2 className="text-2xl font-bold tracking-tight text-[#19191C] sm:text-3xl">Sales overview</h2>
                                <p className="mt-2 text-sm text-gray-500">Browse completed sales and inspect itemized receipts.</p>
                            </div>
                            <div className="flex items-center gap-3 self-start rounded-2xl border border-gray-200/80 bg-white px-4 py-3 shadow-sm sm:self-auto">
                                <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                    <Wallet className="size-5" />
                                </span>
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Completed transactions</p>
                                    <p className="text-lg font-bold text-[#19191C]">{sales.total.toLocaleString()}</p>
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                                <div>
                                    <h3 className="text-base font-bold text-[#19191C]">Transaction history</h3>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {filters.from || filters.to ? 'Filtered by selected date range' : 'Showing all completed sales'}
                                    </p>
                                </div>
                                <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">Completed only</span>
                            </div>
                            <form
                                onSubmit={search}
                                className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-[minmax(180px,1fr)_minmax(180px,1fr)_auto_auto] sm:items-end sm:p-5"
                            >
                                <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-600">
                                    From date
                                    <span className="relative">
                                        <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={from}
                                            onChange={(e) => setFrom(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-3 pl-10 text-sm font-medium text-[#202023] transition outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                        />
                                    </span>
                                </label>
                                <label className="flex flex-col gap-1.5 text-xs font-semibold text-gray-600">
                                    To date
                                    <span className="relative">
                                        <CalendarDays className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="date"
                                            value={to}
                                            onChange={(e) => setTo(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pr-3 pl-10 text-sm font-medium text-[#202023] transition outline-none focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                        />
                                    </span>
                                </label>
                                <button
                                    type="submit"
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#625DFF] px-5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-indigo-600"
                                >
                                    <Search className="size-4" /> Apply dates
                                </button>
                                {(filters.from || filters.to) && (
                                    <button
                                        type="button"
                                        onClick={clearDates}
                                        className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                                    >
                                        Clear
                                    </button>
                                )}
                            </form>
                            {error && (
                                <p role="alert" className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:mx-5">
                                    {error}
                                </p>
                            )}
                            <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-gray-500 sm:px-5">
                                <span>
                                    {sales.total.toLocaleString()} completed transaction{sales.total === 1 ? '' : 's'}{' '}
                                    {filters.from || filters.to ? 'in selected date range' : 'in total'}
                                </span>
                                {(filters.from || filters.to) && (
                                    <span className="rounded-full bg-violet-50 px-2.5 py-1 font-medium text-violet-700">Date filter active</span>
                                )}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <thead className="bg-gray-50 text-[10px] tracking-wide text-gray-500 uppercase">
                                        <tr>
                                            <th className="px-5 py-3.5 font-semibold">Receipt</th>
                                            <th className="px-5 py-3.5 font-semibold">Date &amp; time</th>
                                            <th className="px-5 py-3.5 font-semibold">Cashier</th>
                                            <th className="px-5 py-3.5 text-center font-semibold">Items</th>
                                            <th className="px-5 py-3.5 text-right font-semibold">Total</th>
                                            <th className="px-5 py-3.5 text-right font-semibold">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {sales.data.map((sale) => (
                                            <tr key={sale.id} className="transition hover:bg-gray-50/80">
                                                <td className="px-5 py-4">
                                                    <span className="font-semibold text-gray-900">{sale.receipt_number}</span>
                                                    <span className="mt-1 block text-[10px] text-gray-400">#{String(sale.id).padStart(4, '0')}</span>
                                                </td>
                                                <td className="px-5 py-4 text-gray-600">{dateTime(sale.created_at)}</td>
                                                <td className="px-5 py-4">
                                                    <span className="inline-flex items-center gap-2 text-gray-700">
                                                        <span className="flex size-7 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                                                            <UserRound className="size-3.5" />
                                                        </span>
                                                        {sale.cashier?.name ?? `Cashier #${sale.cashier_id}`}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700">
                                                        {sale.items.reduce((sum, item) => sum + Number(item.quantity), 0)}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-gray-900">{peso(sale.total_amount)}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelected(sale)}
                                                        aria-label={`View ${sale.receipt_number}`}
                                                        className="inline-flex size-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-violet-50 hover:text-violet-700"
                                                    >
                                                        <Eye className="size-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {sales.data.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="px-4 py-16 text-center">
                                                    <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                                                        <ReceiptText className="size-6" />
                                                    </span>
                                                    <p className="mt-3 text-sm font-semibold text-gray-700">No transactions found</p>
                                                    <p className="mt-1 text-xs text-gray-500">Try another date range to find completed sales.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <span>
                                    Page {sales.current_page} of {sales.last_page}
                                </span>
                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={() => navigate(sales.prev_page_url)}
                                        disabled={!sales.prev_page_url}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="size-4" />
                                        Previous
                                    </button>
                                    <span className="min-w-16 text-center text-xs font-semibold text-gray-600">Page {sales.current_page}</span>
                                    <button
                                        type="button"
                                        onClick={() => navigate(sales.next_page_url)}
                                        disabled={!sales.next_page_url}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </section>
                    </main>
                </div>
            </div>

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setSelected(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="sale-detail-title"
                        aria-describedby="sale-detail-date"
                        className="my-auto flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl"
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-5 sm:px-7">
                            <div className="flex min-w-0 items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                                    <ReceiptText className="size-6" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold tracking-[0.16em] text-indigo-600 uppercase">Sale record</p>
                                    <h2 id="sale-detail-title" className="mt-1 truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                                        {selected.receipt_number}
                                    </h2>
                                    <p id="sale-detail-date" className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                        <CalendarDays className="size-4 shrink-0" />
                                        {dateTime(selected.created_at)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <span className="hidden items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700 sm:inline-flex">
                                    <BadgeCheck className="size-4" />
                                    Completed
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setSelected(null)}
                                    aria-label="Close sale details"
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </header>

                        <div className="overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
                            <div className="mb-6 grid gap-3 sm:grid-cols-2">
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                                    <span className="flex size-10 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                                        <UserRound className="size-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Processed by</p>
                                        <p className="truncate text-sm font-bold text-slate-900">
                                            {selected.cashier?.name ?? `Cashier #${selected.cashier_id}`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                                    <span className="flex size-10 items-center justify-center rounded-lg bg-white text-indigo-600 shadow-sm">
                                        <CreditCard className="size-5" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Payment method</p>
                                        <p className="truncate text-sm font-bold text-slate-900 uppercase">
                                            {selected.payment?.payment_method ?? '—'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-3 flex items-end justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-extrabold">Items purchased</h3>
                                    <p className="mt-0.5 text-xs text-slate-500">
                                        {selected.items.length} line item{selected.items.length === 1 ? '' : 's'} ·{' '}
                                        {selected.items.reduce((sum, item) => sum + Number(item.quantity), 0)} unit
                                        {selected.items.reduce((sum, item) => sum + Number(item.quantity), 0) === 1 ? '' : 's'}
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-slate-500">Amount</span>
                            </div>
                            <div className="overflow-hidden rounded-xl border border-slate-200">
                                <div className="divide-y divide-slate-100">
                                    {selected.items.map((item) => (
                                        <div key={item.id} className="flex items-center justify-between gap-4 px-4 py-4 sm:px-5">
                                            <div className="flex min-w-0 items-start gap-3">
                                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-extrabold text-indigo-700">
                                                    {item.quantity}×
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-900">{item.product_name}</p>
                                                    <p className="mt-0.5 truncate text-xs text-slate-500">
                                                        {item.sku} <span aria-hidden="true">·</span> {item.size ?? '—'} / {item.color ?? '—'}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">{peso(item.unit_price)} each</p>
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-sm font-bold text-slate-900 tabular-nums">{peso(item.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
                                <div className="rounded-xl border border-slate-200 p-4">
                                    <h3 className="mb-3 text-xs font-bold tracking-wide text-slate-500 uppercase">Payment details</h3>
                                    {selected.payment ? (
                                        <dl className="space-y-2.5 text-sm">
                                            <div className="flex justify-between gap-4">
                                                <dt className="text-slate-500">Amount received</dt>
                                                <dd className="font-semibold tabular-nums">{peso(selected.payment.amount_received)}</dd>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <dt className="text-slate-500">Change</dt>
                                                <dd className="font-semibold tabular-nums">{peso(selected.payment.change_amount)}</dd>
                                            </div>
                                            {selected.payment.reference_number && (
                                                <div className="border-t border-slate-100 pt-2.5">
                                                    <dt className="text-xs text-slate-500">GCash reference</dt>
                                                    <dd className="mt-1 font-semibold break-all text-slate-800">
                                                        {selected.payment.reference_number}
                                                    </dd>
                                                </div>
                                            )}
                                        </dl>
                                    ) : (
                                        <p className="text-sm text-slate-500">No payment details available.</p>
                                    )}
                                </div>
                                <div className="min-w-[220px] rounded-xl bg-slate-50 p-4 sm:text-right">
                                    <h3 className="mb-3 text-xs font-bold tracking-wide text-slate-500 uppercase sm:text-right">Sale summary</h3>
                                    <dl className="space-y-2 text-sm">
                                        <div className="flex justify-between gap-5 text-slate-600">
                                            <dt>Subtotal</dt>
                                            <dd className="tabular-nums">{peso(selected.subtotal)}</dd>
                                        </div>
                                        <div className="flex justify-between gap-5 text-slate-600">
                                            <dt>Discount</dt>
                                            <dd className="tabular-nums">−{peso(selected.discount)}</dd>
                                        </div>
                                        <div className="mt-3 flex items-end justify-between gap-5 border-t border-slate-200 pt-3 sm:justify-end sm:gap-8">
                                            <dt className="font-bold text-slate-700">Total paid</dt>
                                            <dd className="text-xl font-black text-indigo-700 tabular-nums">{peso(selected.total_amount)}</dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        </div>

                        <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                            >
                                Done
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
}
