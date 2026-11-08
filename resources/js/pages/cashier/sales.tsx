
import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    Banknote,
    BadgeCheck,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    MoreHorizontal,
    PackageCheck,
    Plus,
    ReceiptText,
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
                                Start and manage today&apos;s transactions here
                            </p>
                        </div>

                        <h2 className="mb-4 text-lg font-bold">Today&apos;s Transactions</h2>

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
                                    ? 'No transactions today. Click New Transaction to start.'
                                    : 'No matching transactions on this page.'}
                            </p>
                        )}

                        {/* PAGINATION */}
                        {!loading && lastPage > 1 && (
                            <div className="mt-8 flex items-center justify-between gap-4">
                                <p className="text-xs text-gray-500">
                                    {total} transactions today
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
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
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
                        className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-slate-900 shadow-2xl"
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-sky-50 px-5 py-5 sm:px-7">
                            <div className="flex min-w-0 items-center gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                                    <ReceiptText className="size-6" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">Transaction receipt</p>
                                    <h2 id="receipt-heading" className="mt-1 truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                                        {selected.receipt_number}
                                    </h2>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                        <CalendarDays className="size-3.5" />{saleDate(selected.created_at)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                aria-label="Close transaction details"
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <X className="size-5" />
                            </button>
                        </header>
                        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
                            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(260px,0.7fr)]">
                                <section className="min-w-0" aria-label="Purchased items">
                                    <div className="mb-3 flex items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-sm font-extrabold">Items purchased</h3>
                                            <p className="mt-0.5 text-xs text-slate-500">{selected.items?.length ?? 0} product line{selected.items?.length === 1 ? '' : 's'}</p>
                                        </div>
                                        <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><PackageCheck className="size-5" /></span>
                                    </div>
                                    <div className="space-y-2">
                                        {selected.items?.length ? selected.items.map((item) => {
                                            const sourceImage = item.product_variant?.product?.image;
                                            const image = sourceImage
                                                ? (sourceImage.startsWith('http') || sourceImage.startsWith('/')
                                                    ? sourceImage
                                                    : `/storage/${sourceImage}`)
                                                : null;

                                            return (
                                                <article key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-indigo-200 hover:bg-slate-50/70 sm:gap-4">
                                                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100">
                                                        {image ? (
                                                            <img src={image} alt={item.product_name} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <ShoppingBag className="size-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="truncate text-sm font-bold text-slate-900" title={item.product_name}>{item.product_name}</p>
                                                        <p className="mt-0.5 truncate font-mono text-[11px] text-slate-500">{item.sku}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{item.color ?? '—'} <span aria-hidden="true">/</span> {item.size ?? '—'}</p>
                                                    </div>
                                                    <div className="shrink-0 text-right">
                                                        <p className="text-sm font-extrabold text-slate-900">{peso(item.subtotal)}</p>
                                                        <p className="mt-1 text-xs text-slate-500">{item.quantity} × {peso(item.unit_price)}</p>
                                                    </div>
                                                </article>
                                            );
                                        }) : (
                                            <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No item details are available for this transaction.</p>
                                        )}
                                    </div>
                                </section>

                                <aside className="space-y-4">
                                    <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="Transaction summary">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-extrabold">Sale summary</h3>
                                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${selected.status.toLowerCase() === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                                                <BadgeCheck className="size-3.5" />{selected.status}
                                            </span>
                                        </div>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between gap-3 text-slate-600"><span>Subtotal</span><span className="font-semibold text-slate-900">{peso(selected.subtotal)}</span></div>
                                            <div className="flex justify-between gap-3 text-slate-600"><span>Discount</span><span className="font-semibold text-slate-900">{peso(selected.discount)}</span></div>
                                            <div className="border-t border-dashed border-slate-300 pt-3">
                                                <div className="flex items-end justify-between gap-3">
                                                    <span className="font-bold text-slate-800">Total paid</span>
                                                    <span className="text-xl font-black tracking-tight text-slate-950">{peso(selected.total_amount)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </section>

                                    <section className="rounded-xl border border-slate-200 p-4" aria-label="Payment details">
                                        <div className="mb-3 flex items-center gap-2">
                                            <span className="flex size-8 items-center justify-center rounded-lg bg-sky-50 text-sky-700">
                                                {selected.payment?.payment_method?.toLowerCase() === 'cash' ? <Banknote className="size-4" /> : <CreditCard className="size-4" />}
                                            </span>
                                            <div>
                                                <h3 className="text-sm font-extrabold">Payment details</h3>
                                                <p className="text-xs capitalize text-slate-500">{selected.payment?.payment_method ?? 'No payment record'}</p>
                                            </div>
                                        </div>
                                        {selected.payment ? (
                                            <div className="space-y-2.5 text-xs">
                                                <div className="flex justify-between gap-3"><span className="text-slate-500">Amount received</span><span className="font-semibold text-slate-900">{peso(selected.payment.amount_received)}</span></div>
                                                <div className="flex justify-between gap-3"><span className="text-slate-500">Change</span><span className="font-semibold text-slate-900">{peso(selected.payment.change_amount)}</span></div>
                                                {selected.payment.reference_number && (
                                                    <div className="border-t border-slate-100 pt-2.5">
                                                        <p className="text-slate-500">GCash reference</p>
                                                        <p className="mt-1 break-all font-mono font-semibold text-slate-800">{selected.payment.reference_number}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500">No payment details are available.</p>
                                        )}
                                    </section>
                                </aside>
                            </div>
                        </div>
                        <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
                            <button
                                type="button"
                                onClick={() => setSelected(null)}
                                className="w-full rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                            >
                                Close Details
                            </button>
                        </footer>
                    </section>
                </div>
            )}
        </>
    );
}
