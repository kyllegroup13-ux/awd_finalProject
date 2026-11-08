import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronLeft, ChevronRight, Package, Pencil, Search, UserRound, X,
    Plus, Database, Info, CheckCircle2,
} from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';

import { OwnerSidebar } from '@/components/owner-sidebar';

type Category = { id: number; name: string };
type Product = { id: number; name: string; image: string | null; status: string; category: Category | null };
type Variant = {
    id: number; sku: string; size: string; color: string; price: number | string;
    stock_quantity: number; reorder_level: number; updated_at: string; product: Product;
};
type Pagination = { data: Variant[]; current_page: number; last_page: number; total: number };
type Filters = { search: string; category: string; size: string; status: string };
type Counts = { total: number; inStock: number; lowStock: number; outOfStock: number };
type Props = {
    variants: Pagination; categories: Category[]; sizes: string[]; filters: Filters;
    counts: Counts; auth?: { user?: { name: string } | null };
};

type Mode = 'restock' | 'adjust';
const peso = (amount: string | number) =>
    new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount) || 0);
const stockState = (v: Variant) => v.stock_quantity === 0 ? 'out' : v.stock_quantity <= v.reorder_level ? 'low' : 'in';
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#202023] outline-none focus:border-blue-500';
const labelClass = 'mb-1.5 block text-sm font-semibold';
const statusClass = (state: 'out' | 'low' | 'in') => state === 'out' ? 'bg-[#F87580] text-[#171717]' : state === 'low' ? 'bg-[#FFBF65] text-[#402908]' : 'bg-[#09D82A] text-[#171717]';

function getCsrf() {
    return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}
async function mutateStock(url: string, method: 'POST' | 'PATCH', payload: unknown) {
    const response = await fetch(url, {
        method, credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json',
            'X-CSRF-TOKEN': getCsrf(), 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(payload),
    });
    const json: { message?: string; errors?: Record<string, string[]> } = await response.json().catch(() => ({}));
    if (!response.ok) {
        const details = Object.values(json.errors ?? {}).flat().join(' ');
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
    const newStock = mode === 'restock' ? current + (valid ? amount : 0) : (valid ? amount : current);
    const validPreview = valid && newStock <= 2147483647 && (mode === 'restock' || newStock !== current);
    const selectedStatus = useMemo(() => selected ? stockState(selected) : 'in', [selected]);

    function navigate(next: Partial<Filters>, page = 1) {
        router.get('/owner/manage/inventory', { ...filters, ...next, page }, { preserveState: false, replace: true });
    }
    function openEditor(v: Variant, type: Mode = 'restock', initial?: string) {
        setSelected(v); setMode(type); setQuantity(initial ?? (type === 'restock' ? '1' : String(v.stock_quantity)));
        setRemarks(''); setSupplier(''); setError(''); setNotice('');
    }
    function closeEditor() {
        if (!saving) { setSelected(null); setError(''); }
    }
    useEffect(() => {
        if (!selected) return;
        function onKey(e: KeyboardEvent) { if (e.key === 'Escape' && !saving) setSelected(null); }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selected, saving]);

    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!selected || saving) return;
        if (!validPreview) { setError('Enter a valid quantity. Set Stock must differ from the current stock.'); return; }
        if (mode === 'adjust' && !remarks.trim()) { setError('A reason is required when setting stock.'); return; }
        setSaving(true); setError('');
        try {
            if (mode === 'restock') {
                await mutateStock(`/owner/inventory/${selected.id}/restock`, 'POST', {
                    quantity: amount, supplier: supplier.trim() || null, remarks: remarks.trim() || null,
                });
            } else {
                await mutateStock(`/owner/inventory/${selected.id}/adjust`, 'PATCH', {
                    new_stock: amount, remarks: remarks.trim(),
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

    return <>
        <Head title="Inventory Management | M3 Dry Goods" />
        <div className="min-h-screen bg-[#E9E9E9] text-[#171717] md:flex">
            <OwnerSidebar />
            <div className="min-w-0 flex-1">
                <header className="flex min-h-[68px] items-center justify-between bg-[#E9EFF6] px-6 sm:px-8">
                    <div><h1 className="text-lg font-extrabold leading-tight">Inventory Management</h1><p className="text-[11px] text-gray-500">Manage your clothing products, categories, and stock</p></div>
                    <div className="flex items-center gap-2 text-sm font-medium"><span className="hidden sm:inline">{auth?.user?.name ?? 'Owner'}</span><div className="flex size-9 items-center justify-center rounded-full border border-gray-400 bg-gray-200"><UserRound className="size-5 text-gray-500" /></div></div>
                </header>
                <main className="space-y-4 p-5 sm:p-7">
                    {notice && <div role="status" className="flex items-center gap-2 rounded-lg border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800"><CheckCircle2 className="size-4" />{notice}</div>}
                    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                        {[
                            { label: 'Total Items', value: counts.total, css: 'bg-[#5BC0EA]' },
                            { label: 'In Stock', value: counts.inStock, css: 'bg-[#62DF55]' },
                            { label: 'Low Stock', value: counts.lowStock, css: 'bg-[#F7BB62]' },
                            { label: 'Out of Stock', value: counts.outOfStock, css: 'bg-[#F57A82]' },
                        ].map(c => <div key={c.label} className={`rounded-xl px-5 py-4 ${c.css}`}><p className="text-xs font-medium">{c.label}</p><p className="mt-1 text-2xl font-extrabold">{c.value}</p></div>)}
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(170px,1fr)_150px_130px_150px]">
                        <form onSubmit={e => { e.preventDefault(); navigate({ search }); }} className="relative flex items-center">
                            <Search className="pointer-events-none absolute left-3 size-4 text-gray-400" />
                            <input aria-label="Search products or SKU" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Products..." className={`${inputClass} pl-9`} />
                        </form>
                        <select aria-label="Category filter" value={filters.category} onChange={e => navigate({ category: e.target.value })} className={inputClass}><option value="">All Categories</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        <select aria-label="Size filter" value={filters.size} onChange={e => navigate({ size: e.target.value })} className={inputClass}><option value="">All Sizes</option>{sizes.map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select aria-label="Stock status filter" value={filters.status} onChange={e => navigate({ status: e.target.value })} className={inputClass}><option value="">All Status</option><option value="in">In Stock</option><option value="low">Low Stock</option><option value="out">Out of Stock</option></select>
                    </div>
                    <div className="overflow-hidden rounded-xl bg-white/70">
                        <div className="overflow-x-auto"><table className="w-full min-w-[870px] text-left text-xs">
                            <thead className="bg-[#D7D7D7] text-[#222]"><tr>{['Product No.', 'Image', 'Name', 'Category', 'Size', 'Color', 'Stock', 'Status', 'Last Updated', 'Actions'].map(h => <th key={h} className="px-3 py-3 font-bold">{h}</th>)}</tr></thead>
                            <tbody>
                                {variants.data.map(v => {
                                    const st = stockState(v);
                                    return <tr key={v.id} className="border-b border-gray-200 last:border-0 hover:bg-white/70">
                                        <td className="px-3 py-3 font-semibold">{String(v.product.id).padStart(4, '0')}</td>
                                        <td className="px-3 py-2"><div className="flex size-9 items-center justify-center overflow-hidden rounded bg-gray-200">{v.product.image ? <img src={v.product.image} alt="" className="size-full object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <Package className="size-5 text-gray-400" />}</div></td>
                                        <td className="max-w-[185px] px-3 py-3"><p className="font-semibold">{v.product.name}</p><p className="truncate text-[10px] text-gray-500" title={v.sku}>{v.sku}</p></td>
                                        <td className="px-3 py-3">{v.product.category?.name ?? '—'}</td>
                                        <td className="px-3 py-3">{v.size}</td><td className="px-3 py-3">{v.color}</td>
                                        <td className="px-3 py-3 font-bold">{v.stock_quantity}</td>
                                        <td className="px-3 py-3"><span className={`inline-block whitespace-nowrap rounded px-2 py-1 text-[10px] font-semibold ${statusClass(st)}`}>{st === 'out' ? 'Out of Stock' : st === 'low' ? 'Low Stock' : 'In Stock'}</span></td>
                                        <td className="px-3 py-3 whitespace-nowrap">{new Date(v.updated_at).toLocaleDateString('en-PH', { month: '2-digit', day: '2-digit', year: 'numeric' })}</td>
                                        <td className="px-3 py-3"><div className="flex gap-2"><button type="button" title={`Update stock for ${v.sku}`} aria-label={`Update stock for ${v.sku}`} onClick={() => openEditor(v)} className="rounded bg-[#4CAEE0] p-1.5 hover:bg-sky-400"><Pencil className="size-4" /></button></div></td>
                                    </tr>;
                                })}
                                {variants.data.length === 0 && <tr><td colSpan={10} className="py-12 text-center text-gray-500">No inventory variants match these filters. Add variants from Product Management.</td></tr>}
                            </tbody>
                        </table></div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-gray-500"><span>{variants.total} matching variants · Page {variants.current_page} of {variants.last_page}</span><div className="flex items-center gap-3"><button disabled={variants.current_page <= 1} onClick={() => navigate({}, variants.current_page - 1)} className="flex items-center gap-1 rounded px-2 py-2 hover:bg-white disabled:opacity-30"><ChevronLeft className="size-4" />Previous</button><span className="rounded bg-[#303033] px-3 py-2 text-white">{variants.current_page}</span><button disabled={variants.current_page >= variants.last_page} onClick={() => navigate({}, variants.current_page + 1)} className="flex items-center gap-1 rounded px-2 py-2 hover:bg-white disabled:opacity-30">Next<ChevronRight className="size-4" /></button></div></div>
                    <p className="text-xs text-gray-500">Counts represent size/color variants (each has its own stock). The red action records an out-of-stock adjustment; it does not delete the product.</p>
                </main>
            </div>
        </div>

        {selected && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 sm:p-6" onMouseDown={e => { if (e.currentTarget === e.target) closeEditor(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="inventory-modal-title" className="my-auto w-full max-w-[900px] overflow-hidden rounded-xl bg-white text-[#202023] shadow-2xl">
                <div className="flex items-center justify-between border-b border-gray-300 px-6 py-5"><div><h2 id="inventory-modal-title" className="text-xl font-extrabold">Update Stock</h2><p className="text-xs text-gray-600">Add stock or set a corrected quantity for this specific variant</p></div><button type="button" disabled={saving} onClick={closeEditor} aria-label="Close" className="rounded p-2 hover:bg-gray-100"><X className="size-6" /></button></div>
                <form onSubmit={submit}>
                    <div className="grid md:grid-cols-2">
                        <div className="space-y-5 border-b border-gray-300 p-6 md:border-b-0 md:border-r">
                            <div className="flex gap-4">
                                <div className="flex size-36 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-200">{selected.product.image ? <img src={selected.product.image} alt={selected.product.name} className="size-full object-contain" /> : <Package className="size-12 text-gray-400" />}</div>
                                <div className="min-w-0 space-y-2 text-sm"><h3 className="text-lg font-extrabold">{selected.product.name}</h3><span className={`inline-block rounded px-2 py-1 text-xs font-bold ${statusClass(selectedStatus)}`}>{selectedStatus === 'in' ? 'In Stock' : selectedStatus === 'low' ? 'Low Stock' : 'Out of Stock'}</span><p><strong>SKU:</strong> {selected.sku}</p><p><strong>Category:</strong> {selected.product.category?.name ?? '—'}</p><p><strong>Price:</strong> {peso(selected.price)}</p><p><strong>Variant:</strong> {selected.color} / {selected.size}</p></div>
                            </div>
                            <div className="grid grid-cols-2 border-y py-4"><div className="px-2"><p className="text-xs text-gray-500">Available Stock</p><p className="text-3xl font-bold">{selected.stock_quantity}</p></div><div className="border-l px-4"><p className="text-xs text-gray-500">Reorder Level</p><p className="text-3xl font-bold">{selected.reorder_level}</p></div></div>
                            <div><label className={labelClass}>Selected Variant</label><div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold">{selected.color} / {selected.size} — {selected.sku}</div></div>
                            <div className="flex gap-2 rounded-lg bg-[#99DDF9] p-4 text-xs"><Info className="size-5 shrink-0 text-blue-600" /><p>Stock is managed per size/color variant. To edit another variant, close this window and select its row in the inventory table.</p></div>
                        </div>
                        <div className="space-y-5 p-6">
                            <div><h3 className="mb-3 text-lg font-bold">Update Type</h3><div className="grid grid-cols-2 gap-3">
                                <button type="button" onClick={() => { setMode('restock'); setQuantity('1'); setError(''); }} className={`flex items-center gap-2 rounded-lg border-2 px-3 py-4 text-left ${mode === 'restock' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}><span className="rounded-full bg-blue-500 p-2 text-white"><Plus className="size-5" /></span><span><strong className="block text-xs">Add Stock</strong><span className="text-[10px] text-gray-500">Increase current stock</span></span></button>
                                <button type="button" onClick={() => { setMode('adjust'); setQuantity(String(current)); setError(''); }} className={`flex items-center gap-2 rounded-lg border-2 px-3 py-4 text-left ${mode === 'adjust' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}><span className="rounded-full bg-gray-300 p-2"><Database className="size-5" /></span><span><strong className="block text-xs">Set Stock</strong><span className="text-[10px] text-gray-500">Correct total quantity</span></span></button>
                            </div></div>
                            <div><label htmlFor="stock-quantity" className={labelClass}>{mode === 'restock' ? 'Quantity to Add' : 'New Total Stock'} <span className="text-red-600">*</span></label><input id="stock-quantity" required type="number" inputMode="numeric" min={mode === 'restock' ? 1 : 0} max="2147483647" step="1" value={quantity} onChange={e => setQuantity(e.target.value)} className={inputClass} /></div>
                            {mode === 'restock' && <div><label htmlFor="stock-supplier" className={labelClass}>Supplier (optional)</label><input id="stock-supplier" maxLength={255} value={supplier} onChange={e => setSupplier(e.target.value)} className={inputClass} placeholder="Supplier name" /></div>}
                            <div><label htmlFor="stock-remarks" className={labelClass}>{mode === 'adjust' ? 'Reason for Adjustment' : 'Remarks (optional)'} {mode === 'adjust' && <span className="text-red-600">*</span>}</label><textarea id="stock-remarks" rows={2} required={mode === 'adjust'} maxLength={2000} value={remarks} onChange={e => setRemarks(e.target.value)} className={inputClass} placeholder={mode === 'adjust' ? 'Why is the stock changing?' : 'Delivery or stock notes'} /></div>
                            <div><h3 className="mb-2 text-sm font-bold">New Stock Preview</h3><div className="flex items-center justify-center gap-2 rounded-lg bg-[#99DDF9] p-4 text-center sm:gap-4"><div className="min-w-0 rounded-lg border bg-white px-3 py-3"><p className="text-[10px]">Current Stock</p><p className="text-2xl font-bold">{current}</p></div><span className="text-2xl font-bold">{mode === 'restock' ? '+' : '→'}</span><div className="min-w-0 rounded-lg border bg-white px-3 py-3"><p className="text-[10px]">{mode === 'restock' ? 'Add' : 'Set To'}</p><p className="text-2xl font-bold">{valid ? amount : '—'}</p></div><span className="text-2xl font-bold">=</span><div className="min-w-0 rounded-lg border border-green-500 bg-[#80EAA0] px-3 py-3"><p className="text-[10px]">New Stock</p><p className="text-2xl font-bold">{validPreview ? newStock : '—'}</p></div></div></div>
                            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 border-t border-gray-300 p-5"><button type="button" disabled={saving} onClick={closeEditor} className="min-w-32 rounded-lg border border-gray-300 px-6 py-3 text-sm font-bold hover:bg-gray-50">Cancel</button><button type="submit" disabled={saving || !validPreview} className="min-w-36 rounded-lg bg-[#397EFA] px-6 py-3 text-sm font-bold text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Updating...' : 'Update Stock'}</button></div>
                </form>
            </section>
        </div>}
    </>;
}
