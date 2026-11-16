import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CreditCard, Search, ShoppingBag, UserRound, Wallet } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { CashierSidebar } from '@/components/cashier-sidebar';

type Payment = {
    payment_method: string;
    amount_received: string;
    amount_paid: string;
    change_amount: string;
    reference_number: string | null;
};

type Sale = {
    id: number;
    receipt_number: string;
    cashier_id: number;
    subtotal: string;
    discount: string;
    total_amount: string;
    status: string;
    created_at: string;
    payment: Payment | null;
};

type PageData = {
    data: Sale[];
    current_page: number;
    last_page: number;
    total: number;
};

type AuthPageProps = {
    auth?: {
        user?: {
            name: string;
        } | null;
    };
};

const peso = (value: string | number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value));

const saleDate = (date: string) =>
    new Date(date).toLocaleString('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });

export default function CashierSalesHistory() {
    const { auth } = usePage().props as unknown as AuthPageProps;
    const [sales, setSales] = useState<Sale[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [query, setQuery] = useState('');
    const [method, setMethod] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function loadSales() {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(
                    `/api/cashier/sales?scope=all&page=${page}`,
                    {
                        credentials: 'same-origin',
                        headers: {
                            Accept: 'application/json',
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(`Could not load sales history (${response.status}).`);
                }

                const result: PageData = await response.json();
                setSales(result.data);
                setLastPage(result.last_page);
                setTotal(result.total);
            } catch (e) {
                if (!controller.signal.aborted) {
                    setError(e instanceof Error ? e.message : 'Unable to load sales history.');
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void loadSales();

        return () => controller.abort();
    }, [page]);

    const filtered = useMemo(() => {
        return sales.filter((sale) => {
            const matchesQuery = sale.receipt_number
                .toLowerCase()
                .includes(query.toLowerCase());
            const matchesMethod =
                method === 'all' ||
                sale.payment?.payment_method?.toLowerCase() === method;

            return matchesQuery && matchesMethod;
        });
    }, [method, query, sales]);

    return (
        <>
            <Head title="Sales History | M3 Dry Goods" />

            <div className="min-h-screen bg-[#F4F4F4] text-[#171717] md:flex">
                <CashierSidebar />

                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[68px] items-center justify-between gap-4 bg-[#E8EDF4] px-5 sm:px-8">
                        <div className="flex items-center gap-3">
                            <Link href="/cashier/sales" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600">
                                <ArrowLeft className="size-4" /> Dashboard
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full border border-gray-400 bg-gray-200">
                                <UserRound className="size-5 text-gray-500" />
                            </div>
                            <span className="text-sm font-semibold">{auth?.user?.name ?? 'Cashier'}</span>
                        </div>
                    </header>

                    <main className="px-5 py-7 sm:px-10">
                        <div className="mb-6 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.12em] text-gray-500">Cashier account</p>
                                <h1 className="mt-1 text-3xl font-bold tracking-tight">Sales History</h1>
                            </div>
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700">
                                {total} transaction{total === 1 ? '' : 's'}
                            </span>
                        </div>

                        <div className="mb-6 flex flex-wrap gap-3">
                            <div className="relative min-w-[180px] flex-1 sm:max-w-[320px]">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search receipt..."
                                    aria-label="Search receipt"
                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-gray-400"
                                />
                            </div>

                            <select
                                value={method}
                                onChange={(e) => setMethod(e.target.value)}
                                aria-label="Payment method filter"
                                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none"
                            >
                                <option value="all">All Payments</option>
                                <option value="cash">Cash</option>
                                <option value="gcash">GCash</option>
                            </select>
                        </div>

                        {error && (
                            <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                                {error}
                            </p>
                        )}

                        {loading ? (
                            <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
                                Loading sales history...
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
                                No sales matched your filters for this cashier account.
                            </div>
                        ) : (
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead className="bg-slate-50 text-slate-600">
                                            <tr>
                                                <th className="px-4 py-3 font-semibold">Receipt</th>
                                                <th className="px-4 py-3 font-semibold">Date</th>
                                                <th className="px-4 py-3 font-semibold">Payment</th>
                                                <th className="px-4 py-3 font-semibold">Total</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtered.map((sale) => (
                                                <tr key={sale.id} className="border-t border-slate-200">
                                                    <td className="px-4 py-3 font-semibold text-slate-900">{sale.receipt_number}</td>
                                                    <td className="px-4 py-3 text-slate-600">{saleDate(sale.created_at)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                                            {sale.payment?.payment_method?.toLowerCase() === 'cash' ? (
                                                                <Wallet className="size-3.5" />
                                                            ) : (
                                                                <CreditCard className="size-3.5" />
                                                            )}
                                                            {sale.payment?.payment_method ?? 'Unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-bold text-slate-900">{peso(sale.total_amount)}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${sale.status.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                            {sale.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {!loading && lastPage > 1 && (
                            <div className="mt-5 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                                    disabled={page === 1}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>
                                <span className="text-sm font-medium text-slate-600">
                                    Page {page} of {lastPage}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setPage((current) => Math.min(lastPage, current + 1))}
                                    disabled={page === lastPage}
                                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}
