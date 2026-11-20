import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Database,
    Info,
    Package,
    Pencil,
    Plus,
    Search,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { OwnerSidebar } from '@/components/owner-sidebar';

type Category = { id: number; name: string };
type Product = { id: number; name: string; image: string | null; status: string; category: Category | null };
type Variant = {
    id: number;
    sku: string;
    size: string;
    color: string;
    price: number | string;
    stock_quantity: number;
    reorder_level: number;
    updated_at: string;
    product: Product;
};
type Pagination = { data: Variant[]; current_page: number; last_page: number; total: number };
type Filters = { search: string; category: string; size: string; status: string };
type Counts = { total: number; inStock: number; lowStock: number; outOfStock: number };
type Props = {
    variants: Pagination;
    categories: Category[];
    sizes: string[];
    filters: Filters;
    counts: Counts;
    auth?: { user?: { name: string } | null };
};

type Mode = 'restock' | 'adjust';
const peso = (amount: string | number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount) || 0);
const stockState = (v: Variant) => (v.stock_quantity === 0 ? 'out' : v.stock_quantity <= v.reorder_level ? 'low' : 'in');
const inputClass =
    'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-[#202023] outline-none transition focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10';
const statusClass = (state: 'out' | 'low' | 'in') =>
    state === 'out' ? 'bg-red-50 text-red-700' : state === 'low' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700';

function getCsrf(): string {
    const token = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]'
    )?.content;

    if (!token) {
        throw new Error(
            'CSRF token is missing. Please refresh the page and try again.'
        );
    }

    return token;
}
async function mutateStock(url: string, method: 'POST' | 'PATCH', payload: unknown) {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': getCsrf(), 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(payload),
    });
    const json: { message?: string; errors?: Record<string, string[]> } = await response.json().catch(() => ({}));
    if (!response.ok) {
        const details = Object.values(json.errors ?? {})
            .flat()
            .join(' ');
        throw new Error(details || json.message || `Stock update failed (${response.status}).`);
    }
}

export default function OwnerInventory({ variants, categories, sizes, filters, counts }: Props) {
    const { auth } = usePage().props as unknown as Props;
    const [search, setSearch] = useState(filters.search || '');
    const [selected, setSelected] = useState<Variant | null>(null);
    const [mode, setMode] = useState<Mode>('restock');
    const [quantity, setQuantity] = useState('1');
    const [remarks, setRemarks] = useState('');
    const [supplier, setSupplier] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const current = selected?.stock_quantity ?? 0;
    const amount = Number(quantity);
    const valid = quantity.trim() !== '' && Number.isSafeInteger(amount) && amount >= (mode === 'restock' ? 1 : 0) && amount <= 2147483647;
    const newStock = mode === 'restock' ? current + (valid ? amount : 0) : valid ? amount : current;
    const validPreview = valid && newStock <= 2147483647 && (mode === 'restock' || newStock !== current);
    const selectedStatus = useMemo(() => (selected ? stockState(selected) : 'in'), [selected]);

    function navigate(next: Partial<Filters>, page = 1) {
        router.get('/owner/manage/inventory', { ...filters, ...next, page }, { preserveState: false, replace: true });
    }
    function openEditor(v: Variant, type: Mode = 'restock', initial?: string) {
        setSelected(v);
        setMode(type);
        setQuantity(initial ?? (type === 'restock' ? '1' : String(v.stock_quantity)));
        setRemarks('');
        setSupplier('');
        setError('');
        setNotice('');
    }
    function closeEditor() {
        if (!saving) {
            setSelected(null);
            setError('');
        }
    }
    useEffect(() => {
        if (!selected) return;
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape' && !saving) setSelected(null);
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selected, saving]);

    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selected || saving) return;
        if (!validPreview) {
            setError('Enter a valid quantity. Set Stock must differ from the current stock.');
            return;
        }
        if (mode === 'adjust' && !remarks.trim()) {
            setError('A reason is required when setting stock.');
            return;
        }
        setSaving(true);
        setError('');
        try {
            if (mode === 'restock') {
                await mutateStock(`/owner/inventory/${selected.id}/restock`, 'POST', {
                    quantity: amount,
                    supplier: supplier.trim() || null,
                    remarks: remarks.trim() || null,
                });
            } else {
                await mutateStock(`/owner/inventory/${selected.id}/adjust`, 'PATCH', {
                    new_stock: amount,
                    remarks: remarks.trim(),
                });
            }
            setSelected(null);
            setNotice(`Stock for ${selected.sku} updated successfully.`);
            router.reload({ only: ['variants', 'counts'], onFinish: () => setSaving(false) });
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not update inventory.');
            setSaving(false);
        }
    }

    return (
        <>
            <Head title="Inventory Management | M3 Dry Goods" />
            <div className="min-h-screen bg-[#F5F6F8] text-[#19191C] md:flex">
                <OwnerSidebar />
                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[76px] items-center justify-between border-b border-gray-200/80 bg-white px-5 sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="hidden size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:flex">
                                <Package className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-lg leading-tight font-extrabold">Inventory Management</h1>
                                <p className="text-xs text-gray-500">Monitor variant stock and manage replenishment</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden text-sm font-semibold text-gray-700 sm:inline">{auth?.user?.name ?? 'Owner'}</span>
                            <div className="flex size-10 items-center justify-center rounded-full bg-[#19191C] text-white">
                                <UserRound className="size-5" />
                            </div>
                        </div>
                    </header>
                    <main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
                        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-violet-600 uppercase">Stock control</p>
                                <h2 className="text-2xl font-bold tracking-tight text-[#19191C] sm:text-3xl">Inventory overview</h2>
                                <p className="mt-2 text-sm text-gray-500">Review stock levels and update quantities by size and color variant.</p>
                            </div>
                            <Link
                                href="/owner/manage/products"
                                className="inline-flex items-center gap-2 self-start rounded-xl bg-[#625DFF] px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-indigo-600 sm:self-auto"
                            >
                                <Plus className="size-4" /> Manage products
                            </Link>
                        </section>

                        {notice && (
                            <div
                                role="status"
                                className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
                            >
                                <CheckCircle2 className="size-4 shrink-0" />
                                {notice}
                            </div>
                        )}

                        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {[
                                {
                                    label: 'Total variants',
                                    value: counts.total,
                                    icon: Package,
                                    style: 'bg-violet-50 text-violet-600',
                                    note: 'Tracked size and color options',
                                },
                                {
                                    label: 'In stock',
                                    value: counts.inStock,
                                    icon: CheckCircle2,
                                    style: 'bg-emerald-50 text-emerald-600',
                                    note: 'Above reorder threshold',
                                },
                                {
                                    label: 'Low stock',
                                    value: counts.lowStock,
                                    icon: AlertTriangle,
                                    style: 'bg-amber-50 text-amber-600',
                                    note: 'At or below reorder level',
                                },
                                {
                                    label: 'Out of stock',
                                    value: counts.outOfStock,
                                    icon: Database,
                                    style: 'bg-red-50 text-red-600',
                                    note: 'Currently unavailable',
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
                                                <p className="mt-3 text-3xl font-bold tracking-tight text-[#19191C]">{card.value.toLocaleString()}</p>
                                            </div>
                                            <div className={`flex size-11 items-center justify-center rounded-xl ${card.style}`}>
                                                <Icon className="size-5" />
                                            </div>
                                        </div>
                                        <p className="mt-5 border-t border-gray-100 pt-4 text-xs text-gray-500">{card.note}</p>
                                    </article>
                                );
                            })}
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
                                <div>
                                    <h3 className="text-base font-bold text-[#19191C]">Inventory variants</h3>
                                    <p className="mt-0.5 text-xs text-gray-500">Stock is tracked separately for each size and color</p>
                                </div>
                                <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
                                    {variants.total.toLocaleString()} variants
                                </span>
                            </div>
                            <div className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-[minmax(220px,1fr)_190px_150px_180px]">
                                <form
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        navigate({ search });
                                    }}
                                    className="relative flex items-center"
                                >
                                    <Search className="pointer-events-none absolute left-3 size-4 text-gray-400" />
                                    <input
                                        aria-label="Search products or SKU"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search products or SKU..."
                                        className={`${inputClass} rounded-xl py-3 pl-10`}
                                    />
                                </form>
                                <select
                                    aria-label="Category filter"
                                    value={filters.category}
                                    onChange={(e) => navigate({ category: e.target.value })}
                                    className={`${inputClass} rounded-xl py-3`}
                                >
                                    <option value="">All Categories</option>
                                    {categories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    aria-label="Size filter"
                                    value={filters.size}
                                    onChange={(e) => navigate({ size: e.target.value })}
                                    className={`${inputClass} rounded-xl py-3`}
                                >
                                    <option value="">All Sizes</option>
                                    {sizes.map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    aria-label="Stock status filter"
                                    value={filters.status}
                                    onChange={(e) => navigate({ status: e.target.value })}
                                    className={`${inputClass} rounded-xl py-3`}
                                >
                                    <option value="">All Status</option>
                                    <option value="in">In Stock</option>
                                    <option value="low">Low Stock</option>
                                    <option value="out">Out of Stock</option>
                                </select>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] text-left text-xs">
                                    <thead className="bg-gray-50 text-[10px] tracking-wide text-gray-500 uppercase">
                                        <tr>
                                            {['Product', 'Category', 'Size', 'Color', 'Stock', 'Status', 'Last Updated', 'Action'].map((h) => (
                                                <th key={h} className="px-4 py-3.5 font-semibold">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {variants.data.map((v) => {
                                            const st = stockState(v);
                                            return (
                                                <tr key={v.id} className="transition hover:bg-gray-50/80">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex min-w-[220px] items-center gap-3">
                                                            <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-100 bg-gray-50 text-gray-300">
                                                                {v.product.image ? (
                                                                    <img
                                                                        src={v.product.image}
                                                                        alt=""
                                                                        className="size-full object-cover"
                                                                        onError={(e) => {
                                                                            e.currentTarget.style.display = 'none';
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Package className="size-5" />
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="truncate font-semibold text-gray-900">{v.product.name}</p>
                                                                <p className="mt-0.5 truncate text-[10px] text-gray-400" title={v.sku}>
                                                                    {v.sku}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-600">{v.product.category?.name ?? '—'}</td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="rounded-md bg-gray-100 px-2 py-1 font-semibold text-gray-700">{v.size}</span>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-600">{v.color}</td>
                                                    <td className="px-4 py-3.5">
                                                        <span className="font-bold text-gray-900">{v.stock_quantity}</span>
                                                        <span className="ml-1 text-[10px] text-gray-400">/ {v.reorder_level} min</span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold whitespace-nowrap ${statusClass(st)}`}
                                                        >
                                                            {st === 'out' ? 'Out of Stock' : st === 'low' ? 'Low Stock' : 'In Stock'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5 whitespace-nowrap text-gray-500">
                                                        <span className="inline-flex items-center gap-1.5">
                                                            <CalendarDays className="size-3.5 text-gray-400" />
                                                            {new Date(v.updated_at).toLocaleDateString('en-PH', {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <button
                                                            type="button"
                                                            title={`Update stock for ${v.sku}`}
                                                            aria-label={`Update stock for ${v.sku}`}
                                                            onClick={() => openEditor(v)}
                                                            className="rounded-lg p-2 text-gray-500 transition hover:bg-violet-50 hover:text-violet-700"
                                                        >
                                                            <Pencil className="size-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {variants.data.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-16 text-center">
                                                    <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                                                        <Package className="size-6" />
                                                    </span>
                                                    <p className="mt-3 text-sm font-semibold text-gray-700">No inventory variants found</p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Try changing your filters or add variants from Product Management.
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <span>
                                    {variants.total} matching variants · Page {variants.current_page} of {variants.last_page}
                                </span>
                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                    <button
                                        type="button"
                                        disabled={variants.current_page <= 1}
                                        onClick={() => navigate({}, variants.current_page - 1)}
                                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="size-4" />
                                        Previous
                                    </button>
                                    <span className="min-w-16 text-center text-xs font-semibold text-gray-600">Page {variants.current_page}</span>
                                    <button
                                        type="button"
                                        disabled={variants.current_page >= variants.last_page}
                                        onClick={() => navigate({}, variants.current_page + 1)}
                                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                        <ChevronRight className="size-4" />
                                    </button>
                                </div>
                            </div>
                        </section>
                        <p className="flex items-start gap-2 text-xs leading-5 text-gray-500">
                            <Info className="mt-0.5 size-4 shrink-0" />
                            Counts represent size/color variants (each has its own stock). Stock adjustments update quantities; they do not delete
                            products.
                        </p>
                    </main>
                </div>
            </div>

            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6"
                    onMouseDown={(e) => {
                        if (e.currentTarget === e.target) closeEditor();
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="inventory-modal-title"
                        className="my-auto flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white text-[#202023] shadow-2xl shadow-black/25 sm:max-h-[calc(100dvh-3rem)]"
                    >
                        <div className="flex items-center justify-between gap-4 border-b border-gray-100 bg-gradient-to-r from-violet-50 via-white to-white px-5 py-4 sm:px-7 sm:py-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                                    <Package className="size-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold tracking-[0.16em] text-violet-600 uppercase">Inventory control</p>
                                    <h2 id="inventory-modal-title" className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
                                        Update stock
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500">Manage quantities for this product variant</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                disabled={saving}
                                onClick={closeEditor}
                                aria-label="Close"
                                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-white hover:text-gray-900 disabled:opacity-50"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
                            <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
                                <div className="space-y-5 border-b border-gray-100 bg-gray-50/70 p-5 sm:p-7 lg:border-r lg:border-b-0">
                                    <div className="flex items-center gap-4">
                                        <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:size-28">
                                            {selected.product.image ? (
                                                <img src={selected.product.image} alt={selected.product.name} className="size-full object-contain" />
                                            ) : (
                                                <Package className="size-10 text-gray-300" />
                                            )}
                                        </div>
                                        <div className="min-w-0 space-y-2">
                                            <h3 className="line-clamp-2 text-base leading-snug font-extrabold sm:text-lg">{selected.product.name}</h3>
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${statusClass(selectedStatus)}`}
                                            >
                                                {selectedStatus === 'in' ? 'In Stock' : selectedStatus === 'low' ? 'Low Stock' : 'Out of Stock'}
                                            </span>
                                            <p className="truncate text-xs font-medium text-gray-500">SKU · {selected.sku}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                            <p className="text-[10px] font-bold tracking-wide text-gray-500 uppercase">Available stock</p>
                                            <p className="mt-1 text-3xl font-extrabold text-gray-900 tabular-nums">{selected.stock_quantity}</p>
                                            <p className="mt-1 text-[11px] text-gray-400">units on hand</p>
                                        </div>
                                        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                            <p className="text-[10px] font-bold tracking-wide text-gray-500 uppercase">Reorder level</p>
                                            <p className="mt-1 text-3xl font-extrabold text-gray-900 tabular-nums">{selected.reorder_level}</p>
                                            <p className="mt-1 text-[11px] text-gray-400">restock threshold</p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                                        <p className="text-[10px] font-bold tracking-wide text-gray-500 uppercase">Variant details</p>
                                        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
                                            <div>
                                                <p className="text-gray-400">Color / size</p>
                                                <p className="mt-0.5 font-semibold text-gray-800">
                                                    {selected.color} / {selected.size}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400">Category</p>
                                                <p className="mt-0.5 truncate font-semibold text-gray-800">
                                                    {selected.product.category?.name ?? '—'}
                                                </p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-gray-400">Unit price</p>
                                                <p className="mt-0.5 font-semibold text-gray-800">{peso(selected.price)}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 rounded-2xl border border-violet-100 bg-violet-50 p-4 text-xs leading-relaxed text-violet-900">
                                        <Info className="mt-0.5 size-4 shrink-0 text-violet-600" />
                                        <p>
                                            Stock is tracked separately for each size and color. Choose the matching variant before saving an update.
                                        </p>
                                    </div>
                                </div>
                                <div className="space-y-5 p-5 sm:p-7">
                                    <div className="space-y-3">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900">Choose an update type</h3>
                                            <p className="mt-1 text-xs text-gray-500">Add a delivery or correct the total count.</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode('restock');
                                                    setQuantity('1');
                                                    setError('');
                                                }}
                                                aria-pressed={mode === 'restock'}
                                                className={`flex min-w-0 items-start gap-3 rounded-2xl border p-3 text-left transition sm:p-4 ${mode === 'restock' ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/10' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                <span
                                                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${mode === 'restock' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    <Plus className="size-4" />
                                                </span>
                                                <span className="min-w-0">
                                                    <strong className="block text-xs font-bold text-gray-900">Add stock</strong>
                                                    <span className="mt-1 block text-[10px] leading-snug text-gray-500">
                                                        Increase the current quantity
                                                    </span>
                                                </span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setMode('adjust');
                                                    setQuantity(String(current));
                                                    setError('');
                                                }}
                                                aria-pressed={mode === 'adjust'}
                                                className={`flex min-w-0 items-start gap-3 rounded-2xl border p-3 text-left transition sm:p-4 ${mode === 'adjust' ? 'border-violet-500 bg-violet-50 ring-2 ring-violet-500/10' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                                            >
                                                <span
                                                    className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${mode === 'adjust' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-500'}`}
                                                >
                                                    <Database className="size-4" />
                                                </span>
                                                <span className="min-w-0">
                                                    <strong className="block text-xs font-bold text-gray-900">Set stock</strong>
                                                    <span className="mt-1 block text-[10px] leading-snug text-gray-500">
                                                        Replace the total quantity
                                                    </span>
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="stock-quantity" className="mb-2 block text-xs font-bold text-gray-700">
                                            {mode === 'restock' ? 'Quantity to add' : 'New total stock'} <span className="text-red-600">*</span>
                                        </label>
                                        <input
                                            id="stock-quantity"
                                            required
                                            type="number"
                                            inputMode="numeric"
                                            min={mode === 'restock' ? 1 : 0}
                                            max="2147483647"
                                            step="1"
                                            value={quantity}
                                            onChange={(e) => setQuantity(e.target.value)}
                                            className={`${inputClass} bg-white text-base font-semibold tabular-nums`}
                                        />
                                    </div>
                                    {mode === 'restock' && (
                                        <div>
                                            <label htmlFor="stock-supplier" className="mb-2 block text-xs font-bold text-gray-700">
                                                Supplier (optional)
                                            </label>
                                            <input
                                                id="stock-supplier"
                                                maxLength={255}
                                                value={supplier}
                                                onChange={(e) => setSupplier(e.target.value)}
                                                className={inputClass}
                                                placeholder="Supplier name"
                                            />
                                        </div>
                                    )}
                                    <div>
                                        <label htmlFor="stock-remarks" className="mb-2 block text-xs font-bold text-gray-700">
                                            {mode === 'adjust' ? 'Reason for Adjustment' : 'Remarks (optional)'}{' '}
                                            {mode === 'adjust' && <span className="text-red-600">*</span>}
                                        </label>
                                        <textarea
                                            id="stock-remarks"
                                            rows={2}
                                            required={mode === 'adjust'}
                                            maxLength={2000}
                                            value={remarks}
                                            onChange={(e) => setRemarks(e.target.value)}
                                            className={`${inputClass} resize-y bg-white`}
                                            placeholder={mode === 'adjust' ? 'Why is the stock changing?' : 'Delivery or stock notes'}
                                        />
                                    </div>
                                    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                                        <div className="mb-3 flex items-center justify-between gap-3">
                                            <h3 className="text-xs font-bold text-gray-800">Stock change preview</h3>
                                            <span className="text-[10px] font-medium text-gray-400">Updates when you edit quantity</span>
                                        </div>
                                        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 text-center">
                                            <div className="min-w-0 rounded-xl border border-gray-100 bg-white px-2 py-3">
                                                <p className="truncate text-[9px] font-semibold text-gray-400 uppercase">Current</p>
                                                <p className="mt-1 text-xl font-extrabold text-gray-800 tabular-nums">{current}</p>
                                            </div>
                                            <span className="text-sm font-bold text-violet-400">{mode === 'restock' ? '+' : '→'}</span>
                                            <div className="min-w-0 rounded-xl border border-gray-100 bg-white px-2 py-3">
                                                <p className="truncate text-[9px] font-semibold text-gray-400 uppercase">
                                                    {mode === 'restock' ? 'Add' : 'Set to'}
                                                </p>
                                                <p className="mt-1 text-xl font-extrabold text-gray-800 tabular-nums">{valid ? amount : '—'}</p>
                                            </div>
                                            <span className="text-sm font-bold text-violet-400">=</span>
                                            <div
                                                className={`min-w-0 rounded-xl border px-2 py-3 ${validPreview ? 'border-emerald-200 bg-emerald-50' : 'border-gray-100 bg-white'}`}
                                            >
                                                <p className="truncate text-[9px] font-semibold text-gray-400 uppercase">New stock</p>
                                                <p
                                                    className={`mt-1 text-xl font-extrabold tabular-nums ${validPreview ? 'text-emerald-700' : 'text-gray-400'}`}
                                                >
                                                    {validPreview ? newStock : '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {error && (
                                        <p role="alert" className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                                            {error}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-white p-4 sm:flex-row sm:justify-end sm:gap-3 sm:px-7 sm:py-4">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={closeEditor}
                                    className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:min-w-32"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || !validPreview}
                                    className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white shadow-sm shadow-violet-600/20 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-40"
                                >
                                    {saving ? 'Updating...' : 'Update Stock'}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </>
    );
}
