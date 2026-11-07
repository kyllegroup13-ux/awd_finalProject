
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Banknote,
    ChevronLeft,
    ChevronRight,
    MoreHorizontal,
    Plus,
    Search,
    ShoppingBag,
    UserRound,
    Wallet,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { CashierSidebar } from '@/components/cashier-sidebar';

type Payment = {
    payment_method: string;
    amount_received: string;
    amount_paid: string;
    change_amount: string;
    reference_number: string | null;
};

type SaleItem = {
    id: number;
    product_name: string;
    sku: string;
    size: string | null;
    color: string | null;
    quantity: number;
    unit_price: string;
    subtotal: string;
    product_variant?: {
        product?: {
            image?: string | null;
            name?: string | null;
        } | null;
    } | null;
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
    items?: SaleItem[];
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

export default function CashierSales() {
    const { auth } = usePage().props as unknown as AuthPageProps;

    const [sales, setSales] = useState<Sale[]>([]);
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [query, setQuery] = useState('');
    const [method, setMethod] = useState('all');
    const [selected, setSelected] = useState<Sale | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        async function load() {
            setLoading(true);
            setError('');

            try {
                const response = await fetch(
                    `/api/cashier/sales?page=${page}`,
                    {
                        credentials: 'same-origin',
                        headers: {
                            Accept: 'application/json',
                        },
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Could not load sales (${response.status}).`
                    );
                }

                const result: PageData = await response.json();

                setSales(result.data);
                setLastPage(result.last_page);
                setTotal(result.total);
            } catch (e) {
                if (!controller.signal.aborted) {
                    setError(
                        e instanceof Error
                            ? e.message
                            : 'Unable to load sales.'
                    );
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        void load();

        return () => controller.abort();
    }, [page]);

    async function viewDetails(id: number) {
        setDetailLoading(true);
        setError('');

        try {
            const response = await fetch(
                `/api/cashier/sales/${id}`,
                {
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(
                    `Could not load sale details (${response.status}).`
                );
            }

            const sale: Sale = await response.json();
            setSelected(sale);
        } catch (e) {
            setError(
                e instanceof Error
                    ? e.message
                    : 'Unable to load sale details.'
            );
        } finally {
            setDetailLoading(false);
        }
    }

    const filtered = sales.filter((sale) => {
        const matchesSearch = sale.receipt_number
            .toLowerCase()
            .includes(query.toLowerCase());

        const matchesMethod =
            method === 'all' ||
            sale.payment?.payment_method?.toLowerCase() === method;

        return matchesSearch && matchesMethod;
    });

    const today = new Date();

    return (
        <>
            <Head title="Cashier Dashboard | M3 Dry Goods" />

            <div className="min-h-screen bg-[#F4F4F4] text-[#171717] md:flex">
                <CashierSidebar />

                {/* MAIN AREA */}
                <div className="min-w-0 flex-1">
                    {/* TOP HEADER */}
                    <header className="flex min-h-[68px] items-center justify-end gap-6 bg-[#E8EDF4] px-6 sm:px-8">
                        <div className="hidden items-center gap-4 text-[11px] text-gray-600 sm:flex">
                            <span>
                                {today.toLocaleDateString('en-PH', {
                                    month: 'long',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </span>

                            <span>
                                {today.toLocaleTimeString('en-PH', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                })}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex size-9 items-center justify-center rounded-full border border-gray-400 bg-gray-200">
                                <UserRound className="size-5 text-gray-500" />
                            </div>

                            <span className="text-sm font-semibold">
                                {auth?.user?.name ?? 'Cashier'}
                            </span>
                        </div>
                    </header>

                    {/* DASHBOARD CONTENT */}
                    <main className="px-5 py-7 sm:px-10">
                        <div className="mb-7">
                            <h1 className="text-3xl font-bold tracking-tight">
                                Welcome
                            </h1>

                            <p className="text-sm text-gray-600">
                                Start and manage your transaction here
                            </p>
                        </div>

                        {/* SEARCH AND FILTER */}
                        <div className="mb-6 flex flex-wrap gap-3">
                            <div className="relative min-w-[180px] flex-1 sm:max-w-[320px]">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />

                                <input
                                    value={query}
                                    onChange={(e) =>
                                        setQuery(e.target.value)
                                    }
                                    placeholder="Search receipt on this page..."
                                    aria-label="Search receipt"
                                    className="h-10 w-full rounded-lg border border-gray-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-gray-400"
                                />
                            </div>

                            <select
                                value={method}
                                onChange={(e) =>
                                    setMethod(e.target.value)
                                }
                                aria-label="Payment method"
                                className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm outline-none"
                            >
                                <option value="all">All Payments</option>
                                <option value="cash">Cash</option>
                                <option value="gcash">GCash</option>
                            </select>
                        </div>

                        {error && (
                            <p
                                role="alert"
                                className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600"
                            >
                                {error}
                            </p>
                        )}

                        {/* TRANSACTION CARDS */}
                        <div className="grid grid-cols-1 items-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {!loading &&
                                filtered.map((sale) => {
                                    const visibleItems = (sale.items ?? []).slice(0, 3);
                                    const totalItems = sale.items?.reduce((count, item) => count + item.quantity, 0) ?? 0;

                                    return (
                                        <article
                                            key={sale.id}
                                            className="flex min-h-[235px] flex-col rounded-lg bg-white p-4 shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <h2 className="text-sm font-extrabold">
                                                        {sale.receipt_number}
                                                    </h2>

                                                    <p className="mt-1 text-[10px] text-gray-500">
                                                        {saleDate(
                                                            sale.created_at
                                                        )}
                                                    </p>
                                                </div>

                                                <span
                                                    className={`rounded px-2 py-1 text-[10px] font-semibold capitalize text-white ${
                                                        sale.status.toLowerCase() ===
                                                        'completed'
                                                            ? 'bg-green-500'
                                                            : 'bg-gray-500'
                                                    }`}
                                                >
                                                    {sale.status}
                                                </span>
                                            </div>

                                            <div className="my-5 flex items-center justify-between gap-3">
                                                <div className="flex -space-x-2">
                                                    {visibleItems.length > 0 ? (
                                                        visibleItems.map((item, index) => (
                                                            <div
                                                                key={`${sale.id}-${item.id ?? index}`}
                                                                className="flex size-10 items-center justify-center overflow-hidden rounded-lg border-2 border-white bg-gray-100 shadow-sm"
                                                            >
                                                                {item.product_variant?.product?.image ? (
                                                                    <img
                                                                        src={item.product_variant.product.image}
                                                                        alt={item.product_name}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <ShoppingBag className="size-4 text-gray-400" />
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="flex size-10 items-center justify-center rounded-lg bg-gray-100">
                                                            <ShoppingBag className="size-4 text-gray-400" />
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 text-right text-xs text-gray-500">
                                                    <p className="font-semibold text-gray-700">
                                                        {totalItems} item{totalItems === 1 ? '' : 's'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="mb-4 flex items-center justify-between gap-2">
                                                <span className="flex items-center gap-2 text-xs font-medium">
                                                    {sale.payment?.payment_method?.toLowerCase() ===
                                                    'cash' ? (
                                                        <Banknote className="size-4" />
                                                    ) : (
                                                        <Wallet className="size-4" />
                                                    )}

                                                    <span className="capitalize">
                                                        {sale.payment?.payment_method ??
                                                            'Payment'}
                                                    </span>
                                                </span>

                                                <strong className="text-sm">
                                                    {peso(sale.total_amount)}
                                                </strong>
                                            </div>

                                            <div className="mt-auto flex gap-2">
                                                <button
                                                    type="button"
                                                    disabled={detailLoading}
                                                    onClick={() =>
                                                        void viewDetails(
                                                            sale.id
                                                        )
                                                    }
                                                    className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#D0D0D0] px-3 py-2 text-xs font-semibold transition hover:bg-gray-300 disabled:opacity-50"
                                                >
                                                    View Details
                                                    <ArrowRight className="size-4" />
                                                </button>

                                                <button
                                                    type="button"
                                                    aria-label={`View receipt ${sale.receipt_number}`}
                                                    disabled={detailLoading}
                                                    onClick={() =>
                                                        void viewDetails(
                                                            sale.id
                                                        )
                                                    }
                                                    className="flex items-center justify-center rounded-md bg-[#D0D0D0] px-3 transition hover:bg-gray-300 disabled:opacity-50"
                                                >
                                                    <MoreHorizontal className="size-5" />
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}

                            {/* NEW TRANSACTION */}
                            <Link
                                href="/cashier/pos"
                                className="flex min-h-[130px] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white text-sm font-bold transition hover:border-gray-500 hover:bg-gray-50"
                            >
                                <Plus className="size-5 text-gray-500" />
                                New Transaction
                            </Link>
                        </div>

                        {loading && (
                            <p className="mt-5 text-sm text-gray-500">
                                Loading transactions...
                            </p>
                        )}

                        {!loading && !error && filtered.length === 0 && (
                            <p className="mt-4 text-sm text-gray-500">
                                {sales.length === 0
                                    ? 'No transactions yet. Click New Transaction to start.'
                                    : 'No matching transactions on this page.'}
                            </p>
                        )}

                        {/* PAGINATION */}
                        {!loading && lastPage > 1 && (
                            <div className="mt-8 flex items-center justify-between gap-4">
                                <p className="text-xs text-gray-500">
                                    {total} total transactions
                                </p>

                                <div className="flex items-center gap-3">
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() =>
                                            setPage((p) => p - 1)
                                        }
                                        className="rounded-lg border border-gray-300 bg-white p-2 disabled:opacity-40"
                                        aria-label="Previous page"
                                    >
                                        <ChevronLeft className="size-4" />
                                    </button>

                                    <span className="text-sm">
                                        {page} / {lastPage}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={page >= lastPage}
                                        onClick={() =>
                                            setPage((p) => p + 1)
                                        }
                                        className="rounded-lg border border-gray-300 bg-white p-2 disabled:opacity-40"
                                        aria-label="Next page"
                                    >
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* TRANSACTION DETAILS MODAL */}
            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="presentation"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            setSelected(null);
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="receipt-heading"
                        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
                    >
                        <div className="mb-5 flex items-start justify-between gap-4">
                            <div>
                                <h2
                                    id="receipt-heading"
                                    className="text-xl font-bold"
                                >
                                    {selected.receipt_number}
                                </h2>

                                <p className="text-xs text-gray-500">
                                    {saleDate(selected.created_at)}
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                aria-label="Close transaction details"
                                className="rounded-lg p-2 hover:bg-gray-100"
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {selected.items?.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex justify-between gap-4 border-b pb-3"
                                >
                                    <div>
                                        <p className="text-sm font-semibold">
                                            {item.product_name}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {item.sku} ·{' '}
                                            {item.size ?? '—'} /{' '}
                                            {item.color ?? '—'}
                                        </p>

                                        <p className="text-xs text-gray-500">
                                            {item.quantity} ×{' '}
                                            {peso(item.unit_price)}
                                        </p>
                                    </div>

                                    <span className="text-sm font-semibold">
                                        {peso(item.subtotal)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-5 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>{peso(selected.subtotal)}</span>
                            </div>

                            <div className="flex justify-between">
                                <span>Discount</span>
                                <span>{peso(selected.discount)}</span>
                            </div>

                            <div className="flex justify-between border-t pt-3 text-lg font-bold">
                                <span>Total</span>
                                <span>
                                    {peso(selected.total_amount)}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span>Payment</span>
                                <span className="uppercase">
                                    {selected.payment?.payment_method ?? '—'}
                                </span>
                            </div>

                            {selected.payment && (
                                <>
                                    <div className="flex justify-between">
                                        <span>Amount Received</span>
                                        <span>
                                            {peso(
                                                selected.payment.amount_received
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex justify-between">
                                        <span>Change</span>
                                        <span>
                                            {peso(
                                                selected.payment.change_amount
                                            )}
                                        </span>
                                    </div>

                                    {selected.payment.reference_number && (
                                        <p className="break-all text-xs text-gray-500">
                                            GCash Reference:{' '}
                                            {
                                                selected.payment
                                                    .reference_number
                                            }
                                        </p>
                                    )}
                                </>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setSelected(null)}
                            className="mt-6 w-full rounded-lg bg-[#1C3155] py-3 text-sm font-semibold text-white hover:bg-[#142540]"
                        >
                            Close Details
                        </button>
                    </section>
                </div>
            )}
        </>
    );
}
