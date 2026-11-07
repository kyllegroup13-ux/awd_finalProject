import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    Archive, ChevronLeft, ChevronRight, Eye, ImagePlus, Package, Pencil, Plus, Search, Tag, UserRound, X,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent, type DragEvent, type FormEvent, type Dispatch, type SetStateAction } from 'react';

import { OwnerSidebar } from '@/components/owner-sidebar';

type Category = { id: number; name: string };
type Variant = { id: number; sku: string; size: string; color: string; price: string | number; stock_quantity: number; reorder_level: number };
type Product = { id: number; name: string; description: string | null; brand: string | null; image: string | null; status: string; category_id: number; category: Category | null; variants: Variant[] };
type Pages = { data: Product[]; current_page: number; last_page: number; total: number };
type Filters = { search: string; category: string; size: string; status: string };
type Props = { products: Pages; categories: Category[]; filters: Filters; auth?: { user?: { name: string } } };
type VariantInput = { sku: string; size: string; color: string; price: string; stock_quantity: string; reorder_level: string };
type ProductInput = { name: string; category_id: string; brand: string; description: string; image: string; status: 'Active' | 'Inactive' };

const php = (amount: number | string) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));
const blankProduct = (): ProductInput => ({ name: '', category_id: '', brand: '', description: '', image: '', status: 'Active' });
const blankVariant = (): VariantInput => ({ sku: '', size: '', color: '', price: '', stock_quantity: '0', reorder_level: '5' });
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const COLOR_OPTIONS = [
    { name: 'Pink', hex: '#FA8189' }, { name: 'Blue', hex: '#48A9DC' },
    { name: 'Black', hex: '#262626' }, { name: 'Orange', hex: '#E97905' },
    { name: 'Green', hex: '#07D600' }, { name: 'Mint', hex: '#B5F0B4' },
    { name: 'White', hex: '#FFFFFF' },
];
const skuPart = (value: string) => value.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '');

function csrfToken() { return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? ''; }
async function requestJson(url: string, method: 'POST' | 'PATCH', body: unknown) {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(body),
    });
    const result = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
    if (!response.ok) {
        const validation = Object.values(result.errors ?? {}).flat().join(' ');
        throw new Error(validation || result.message || `Request failed (${response.status}).`);
    }
    return result;
}

export default function OwnerProducts({ products, categories, filters }: Props) {
    const { auth } = usePage().props as unknown as Props;
    const [search, setSearch] = useState(filters.search || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [dialog, setDialog] = useState<'create' | 'edit' | 'view' | 'variant' | 'category' | null>(null);
    const [selected, setSelected] = useState<Product | null>(null);
    const [productForm, setProductForm] = useState<ProductInput>(blankProduct());
    const [variantForm, setVariantForm] = useState<VariantInput>(blankVariant());
    const [editVariant, setEditVariant] = useState<Variant | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [localCategories, setLocalCategories] = useState<Category[]>(categories);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [inlineCategoryName, setInlineCategoryName] = useState('');
    const [showCustomColor, setShowCustomColor] = useState(false);
    const [customHex, setCustomHex] = useState('#808080');
    const [addedColors, setAddedColors] = useState<{ name: string; hex: string }[]>([]);
    const [createSizes, setCreateSizes] = useState<string[]>(['M']);
    const [createColors, setCreateColors] = useState<string[]>(['Black']);
    const [customColor, setCustomColor] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isImageDragActive, setIsImageDragActive] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    function navigate(patch: Partial<Filters>, page = 1) {
        router.get('/owner/manage/products', { ...filters, ...patch, page }, { preserveState: false, replace: true });
    }
    function refresh(message: string) {
        setNotice(message);
        setDialog(null);
        setSelected(null);
        setEditVariant(null);
        router.reload({ only: ['products', 'categories'], onFinish: () => setBusy(false) });
    }
    function startCreate() {
        setError(''); setProductForm({ ...blankProduct(), category_id: localCategories[0] ? String(localCategories[0].id) : '' });
        setVariantForm(blankVariant()); setCreateSizes(['M']); setCreateColors(['Black']); setCustomColor(''); setShowCustomColor(false); setShowNewCategory(false); setDialog('create');
    }
    function startEdit(product: Product) {
        setError(''); setSelected(product);
        setProductForm({ name: product.name, category_id: String(product.category_id), brand: product.brand ?? '', description: product.description ?? '', image: product.image ?? '', status: product.status as 'Active' | 'Inactive' });
        setDialog('edit');
    }
    function startVariant(product: Product, variant: Variant | null = null) {
        setSelected(product); setEditVariant(variant); setError('');
        setVariantForm(variant ? { sku: variant.sku, size: variant.size, color: variant.color, price: String(variant.price), stock_quantity: String(variant.stock_quantity), reorder_level: String(variant.reorder_level) } : blankVariant());
        setDialog('variant');
    }
    async function submitProduct(event: FormEvent) {
        event.preventDefault(); setError(''); setBusy(true);
        try {
            if (dialog === 'create') {
                if (!createSizes.length || !createColors.length) {
                    throw new Error('Select at least one size and one color.');
                }
                if (!skuPart(variantForm.sku)) {
                    throw new Error('Enter an SKU prefix containing letters or numbers.');
                }
                const variants = createSizes.flatMap(size => createColors.map(color => ({
                    sku: `${skuPart(variantForm.sku)}-${skuPart(size)}-${skuPart(color)}`,
                    size,
                    color,
                    price: Number(variantForm.price),
                    stock_quantity: Number(variantForm.stock_quantity),
                    reorder_level: Number(variantForm.reorder_level),
                })));

                if (imageFile) {
                    const formData = new FormData();
                    formData.append('category_id', String(productForm.category_id));
                    formData.append('name', productForm.name);
                    formData.append('brand', productForm.brand);
                    formData.append('description', productForm.description);
                    formData.append('status', productForm.status);
                    formData.append('image', imageFile);
                    variants.forEach((variant, index) => {
                        formData.append(`variants[${index}][sku]`, variant.sku);
                        formData.append(`variants[${index}][size]`, variant.size);
                        formData.append(`variants[${index}][color]`, variant.color);
                        formData.append(`variants[${index}][price]`, String(variant.price));
                        formData.append(`variants[${index}][stock_quantity]`, String(variant.stock_quantity));
                        formData.append(`variants[${index}][reorder_level]`, String(variant.reorder_level));
                    });

                    const response = await fetch('/owner/products', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData,
                    });
                    const result = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
                    if (!response.ok) {
                        const validation = Object.values(result.errors ?? {}).flat().join(' ');
                        throw new Error(validation || result.message || `Request failed (${response.status}).`);
                    }
                    refresh('Product created successfully.');
                    return;
                }

                await requestJson('/owner/products', 'POST', {
                    ...productForm, category_id: Number(productForm.category_id), image: productForm.image || null,
                    variants,
                });
                refresh('Product created successfully.');
            } else if (selected) {
                if (imageFile) {
                    const formData = new FormData();
                    formData.append('_method', 'PATCH');
                    formData.append('category_id', String(productForm.category_id));
                    formData.append('name', productForm.name);
                    formData.append('brand', productForm.brand);
                    formData.append('description', productForm.description);
                    formData.append('status', productForm.status);
                    formData.append('image', imageFile);

                    const response = await fetch(`/owner/products/${selected.id}`, {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'X-CSRF-TOKEN': csrfToken(), 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData,
                    });
                    const result = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
                    if (!response.ok) {
                        const validation = Object.values(result.errors ?? {}).flat().join(' ');
                        throw new Error(validation || result.message || `Request failed (${response.status}).`);
                    }
                    refresh('Product updated successfully.');
                    return;
                }

                await requestJson(`/owner/products/${selected.id}`, 'PATCH', { ...productForm, category_id: Number(productForm.category_id), image: productForm.image || null });
                refresh('Product updated successfully.');
            }
        } catch (e) { setError(e instanceof Error ? e.message : 'Could not save product.'); setBusy(false); }
    }
    async function submitVariant(event: FormEvent) {
        event.preventDefault(); if (!selected) return;
        setError(''); setBusy(true);
        try {
            if (editVariant) {
                await requestJson(`/owner/product-variants/${editVariant.id}`, 'PATCH', { sku: variantForm.sku, size: variantForm.size, color: variantForm.color, price: Number(variantForm.price), reorder_level: Number(variantForm.reorder_level) });
            } else {
                await requestJson(`/owner/products/${selected.id}/variants`, 'POST', { ...variantForm, price: Number(variantForm.price), stock_quantity: Number(variantForm.stock_quantity), reorder_level: Number(variantForm.reorder_level) });
            }
            refresh(editVariant ? 'Variant updated.' : 'Variant added.');
        } catch (e) { setError(e instanceof Error ? e.message : 'Could not save variant.'); setBusy(false); }
    }
    async function submitCategory(event: FormEvent) {
        event.preventDefault(); setError(''); setBusy(true);
        try { const result = await requestJson('/owner/categories', 'POST', { name: categoryName.trim() }) as { category?: Category }; if (result.category) setLocalCategories(current => [...current, result.category!].sort((a, b) => a.name.localeCompare(b.name))); setCategoryName(''); refresh('Category created.'); }
        catch (e) { setError(e instanceof Error ? e.message : 'Could not create category.'); setBusy(false); }
    }
    async function addCategoryInline() {
        const name = inlineCategoryName.trim();
        if (!name) return;
        setError(''); setBusy(true);
        try {
            const result = await requestJson('/owner/categories', 'POST', { name }) as { category?: Category };
            if (!result.category) throw new Error('Category saved but the response did not include its details.');
            setLocalCategories(current => [...current, result.category!].sort((a, b) => a.name.localeCompare(b.name)));
            setProductForm(current => ({ ...current, category_id: String(result.category!.id) }));
            setInlineCategoryName(''); setShowNewCategory(false);
            setNotice('Category added.');
        } catch (e) { setError(e instanceof Error ? e.message : 'Could not add category.'); }
        finally { setBusy(false); }
    }

    function addCustomColor() {
        const name = customColor.trim();
        if (!name || !skuPart(name)) { setError('Enter a color name with letters or numbers.'); return; }
        if (COLOR_OPTIONS.some(c => c.name.toLowerCase() === name.toLowerCase()) || addedColors.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            setCreateColors(current => current.includes(name) ? current : [...current, name]);
            setShowCustomColor(false); setCustomColor(''); return;
        }
        setAddedColors(current => [...current, { name, hex: customHex }]);
        setCreateColors(current => [...current, name]);
        setCustomColor(''); setShowCustomColor(false); setError('');
    }

    function handleImageSelection(file: File | null) {
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setError('Please choose a valid image file.');
            return;
        }

        if (productForm.image.startsWith('blob:')) {
            URL.revokeObjectURL(productForm.image);
        }

        setImageFile(file);
        setProductForm(current => ({ ...current, image: URL.createObjectURL(file) }));
        setError('');
    }

    function handleImageInputChange(event: ChangeEvent<HTMLInputElement>) {
        handleImageSelection(event.target.files?.[0] ?? null);
        event.target.value = '';
    }

    function handleImageDrop(event: DragEvent<HTMLDivElement>) {
        event.preventDefault();
        setIsImageDragActive(false);
        handleImageSelection(event.dataTransfer.files?.[0] ?? null);
    }

    async function toggleStatus(product: Product) {
        const next = product.status === 'Active' ? 'Inactive' : 'Active';
        if (!window.confirm(`${next === 'Inactive' ? 'Deactivate' : 'Activate'} ${product.name}?`)) return;

        setBusy(true); setError('');

        try {
            const token = csrfToken();
            const response = await fetch(`/owner/products/${product.id}`, {
                method: 'PATCH',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-XSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ status: next }),
            });

            const result = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> };
            if (!response.ok) {
                const validation = Object.values(result.errors ?? {}).flat().join(' ');
                throw new Error(validation || result.message || `Request failed (${response.status}).`);
            }

            refresh(`Product ${next.toLowerCase()}.`);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not update status.');
            setBusy(false);
        }
    }
    const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500';
    const label = 'mb-1 block text-xs font-semibold text-gray-700';

    return <>
        <Head title="Product Management | M3 Dry Goods" />
        <div className="min-h-screen bg-[#EAEAEA] text-[#202023] md:flex">
            <OwnerSidebar />
            <div className="min-w-0 flex-1">
                <header className="flex min-h-[68px] items-center justify-between bg-[#E7EDF5] px-6 sm:px-8">
                    <div>
                        <h1 className="text-lg font-extrabold leading-tight">Product Management</h1>
                        <p className="text-[11px] text-gray-500">Manage your clothing products, categories, and pricing</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span className="hidden sm:inline">{auth?.user?.name ?? 'Owner'}</span>
                        <span className="flex size-9 items-center justify-center rounded-full border border-gray-400 bg-gray-200"><UserRound className="size-5 text-gray-500" /></span>
                    </div>
                </header>
                <main className="space-y-4 p-5 sm:p-8">
                    <div className="flex flex-wrap justify-end gap-2"><button onClick={() => { setError(''); setDialog('category'); }} className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-50">+ Add Category</button><button onClick={startCreate} className="flex items-center gap-2 rounded-lg bg-[#625DFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600"><Plus className="size-5" />Add Product</button></div>
                    <form onSubmit={e => { e.preventDefault(); navigate({ search }); }} className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
                        <div className="relative xl:col-span-2"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" /><input aria-label="Search products" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Products..." className={`${input} pl-10`} /></div>
                        <select aria-label="Category" value={filters.category} onChange={e => navigate({ category: e.target.value })} className={input}><option value="">All Categories</option>{localCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                        <select aria-label="Size" value={filters.size} onChange={e => navigate({ size: e.target.value })} className={input}><option value="">All Sizes</option>{['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map(s => <option key={s} value={s}>{s}</option>)}</select>
                        <select aria-label="Status" value={filters.status} onChange={e => navigate({ status: e.target.value })} className={input}><option value="">All Status</option><option value="Active">Active</option><option value="Inactive">Inactive</option></select>
                    </form>
                    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">{notice}</p>}
                    {error && !dialog && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
                        <table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-[#D8D8D8] text-gray-800"><tr>{['Product No.', 'Image', 'Name', 'Category', 'Sizes', 'Colors', 'Price', 'Stock', 'Status', 'Actions'].map(h => <th key={h} className="px-3 py-4 font-bold">{h}</th>)}</tr></thead>
                            <tbody>{products.data.map(p => {
                                const stock = p.variants.reduce((n, v) => n + v.stock_quantity, 0);
                                const prices = p.variants.map(v => Number(v.price));
                                const uniqueSizes = [...new Set(p.variants.map(v => v.size))];
                                const uniqueColors = [...new Set(p.variants.map(v => v.color))];
                                return <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50"><td className="px-3 py-3 font-semibold">{String(p.id).padStart(4, '0')}</td><td className="px-3 py-3">{p.image ? <img src={p.image} alt={p.name} className="size-10 rounded bg-gray-100 object-cover" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <span className="flex size-10 items-center justify-center rounded bg-gray-100"><ShoppingBag className="size-5 text-gray-300" /></span>}</td><td className="px-3 py-3 font-semibold">{p.name}</td><td className="px-3 py-3">{p.category?.name ?? '—'}</td><td className="px-3 py-3">{uniqueSizes.join(', ') || '—'}</td><td className="px-3 py-3">{uniqueColors.join(', ') || '—'}</td><td className="whitespace-nowrap px-3 py-3">{prices.length ? `${php(Math.min(...prices))}${Math.min(...prices) !== Math.max(...prices) ? ` – ${php(Math.max(...prices))}` : ''}` : '—'}</td><td className="px-3 py-3">{stock}</td><td className="px-3 py-3"><span className={`rounded px-2 py-1 text-[10px] font-semibold ${p.status === 'Inactive' ? 'bg-gray-200 text-gray-700' : stock === 0 ? 'bg-red-100 text-red-700' : 'bg-green-500 text-white'}`}>{p.status === 'Inactive' ? 'Inactive' : stock === 0 ? 'Out of Stock' : 'In Stock'}</span></td><td className="px-3 py-3"><div className="flex gap-1"><button title="View product" aria-label={`View ${p.name}`} onClick={() => { setSelected(p); setDialog('view'); }} className="rounded bg-indigo-200 p-2 text-indigo-700"><Eye className="size-4" /></button><button title="Edit product" aria-label={`Edit ${p.name}`} onClick={() => startEdit(p)} className="rounded bg-sky-200 p-2 text-sky-700"><Pencil className="size-4" /></button><button disabled={busy} title={p.status === 'Active' ? 'Deactivate product' : 'Activate product'} aria-label={`Toggle status of ${p.name}`} onClick={() => void toggleStatus(p)} className="rounded bg-red-100 p-2 text-red-600 disabled:opacity-50"><Archive className="size-4" /></button></div></td></tr>;
                            })}{products.data.length === 0 && <tr><td colSpan={10} className="px-4 py-14 text-center text-sm text-gray-500">No products found. Add your first product to get started.</td></tr>}</tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between gap-4 text-sm text-gray-500"><span>{products.total} products</span><div className="flex items-center gap-3"><button type="button" disabled={products.current_page <= 1} onClick={() => navigate({}, products.current_page - 1)} className="flex items-center gap-1 disabled:opacity-40"><ChevronLeft className="size-4" />Previous</button><span>{products.current_page} / {products.last_page}</span><button type="button" disabled={products.current_page >= products.last_page} onClick={() => navigate({}, products.current_page + 1)} className="flex items-center gap-1 disabled:opacity-40">Next<ChevronRight className="size-4" /></button></div></div>
                </main>
            </div>
        </div>
        {dialog === 'create' && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setDialog(null); }}>
                <section role="dialog" aria-modal="true" aria-labelledby="create-product-title" className="flex max-h-[94vh] w-full max-w-[940px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                    <header className="flex shrink-0 items-start justify-between border-b border-gray-300 px-6 py-4 sm:px-7">
                        <div><h2 id="create-product-title" className="text-2xl font-bold tracking-tight">Add new product</h2><p className="mt-1 text-sm text-gray-500">Fill in the details below to add a new item to your inventory</p></div>
                        <button type="button" aria-label="Close add product" disabled={busy} onClick={() => setDialog(null)} className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"><X className="size-6" /></button>
                    </header>
                    <form id="create-product-form" onSubmit={submitProduct} className="min-h-0 flex-1 overflow-y-auto">
                        {error && <p role="alert" className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                        <div className="grid md:grid-cols-2">
                            <div className="space-y-6 border-b border-gray-300 px-6 py-6 md:border-b-0 md:border-r sm:px-7">
                                <div className="space-y-3">
                                    <h3 className="text-lg font-extrabold">Basic Information</h3>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div><label htmlFor="new-product-name" className={label}>Product Name *</label><input id="new-product-name" required maxLength={255} className={input} value={productForm.name} onChange={e => setProductForm(v => ({ ...v, name: e.target.value }))} /></div>
                                        <div><label htmlFor="new-product-sku" className={label}>SKU Prefix *</label><input id="new-product-sku" required maxLength={140} placeholder="e.g. SHIRT-001" className={input} value={variantForm.sku} onChange={e => setVariantForm(v => ({ ...v, sku: e.target.value }))} /><p className="mt-1 text-[11px] text-gray-500">Product ID is assigned automatically</p></div>
                                        <div><label htmlFor="new-product-category" className={label}>Category *</label><select id="new-product-category" required className={input} value={productForm.category_id} onChange={e => setProductForm(v => ({ ...v, category_id: e.target.value }))}><option value="">Select a category</option>{localCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{localCategories.length === 0 && <p className="mt-1 text-xs text-amber-700">No categories saved yet. Create one below.</p>}<button type="button" onClick={() => setShowNewCategory(v => !v)} className="mt-2 text-xs font-semibold text-indigo-700 hover:underline">+ Create Category</button>{showNewCategory && <div className="mt-2 flex gap-2"><input aria-label="New category name" maxLength={255} value={inlineCategoryName} onChange={e => setInlineCategoryName(e.target.value)} placeholder="e.g. Tops" className={`${input} min-w-0 flex-1`} /><button type="button" disabled={busy || !inlineCategoryName.trim()} onClick={() => void addCategoryInline()} className="rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white disabled:opacity-50">Save</button></div>}</div>
                                        <div><label htmlFor="new-product-brand" className={label}>Brand</label><input id="new-product-brand" maxLength={255} className={input} value={productForm.brand} onChange={e => setProductForm(v => ({ ...v, brand: e.target.value }))} /></div>
                                    </div>
                                    <div><label htmlFor="new-product-desc" className={label}>Description</label><textarea id="new-product-desc" rows={4} maxLength={500} className={`${input} resize-y`} value={productForm.description} onChange={e => setProductForm(v => ({ ...v, description: e.target.value }))} /><p className="text-right text-[11px] text-gray-400">{productForm.description.length} / 500</p></div>
                                </div>
                                <div className="space-y-4 border-t border-gray-200 pt-5">
                                    <h3 className="text-lg font-extrabold">Variants</h3>
                                    <div><p className={label}>Sizes *</p><div className="flex flex-wrap gap-2">{SIZE_OPTIONS.map(size => <label key={size} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs font-bold ${createSizes.includes(size) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}`}><input type="checkbox" checked={createSizes.includes(size)} onChange={e => setCreateSizes(v => e.target.checked ? [...v, size] : v.filter(x => x !== size))} className="size-4 accent-indigo-600" />{size}</label>)}</div></div>
                                    <div>
                                        <p className={label}>Colors *</p>
                                        <div className="flex flex-wrap items-center gap-3 py-2">
                                            {[...COLOR_OPTIONS, ...addedColors].map(color => <button key={color.name} type="button" aria-label={`Select ${color.name}`} aria-pressed={createColors.includes(color.name)} title={color.name} onClick={() => setCreateColors(v => v.includes(color.name) ? v.filter(x => x !== color.name) : [...v, color.name])} className={`size-10 rounded-full border border-gray-300 ring-offset-2 ${createColors.includes(color.name) ? 'ring-2 ring-indigo-600' : ''}`} style={{ backgroundColor: color.hex }} />)}
                                            <button type="button" title="Add another color" aria-label="Add another color" onClick={() => setShowCustomColor(v => !v)} className="flex size-10 items-center justify-center rounded-full border-2 border-dashed border-gray-400 text-xl hover:border-indigo-600 hover:text-indigo-600">+</button>
                                        </div>
                                        {showCustomColor && <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-3">
                                            <input aria-label="Custom color name" value={customColor} onChange={e => setCustomColor(e.target.value)} placeholder="Color name (e.g. Burgundy)" maxLength={60} className={`${input} min-w-36 flex-1`} />
                                            <input type="color" aria-label="Choose color shade" value={customHex} onChange={e => setCustomHex(e.target.value)} className="h-10 w-12 cursor-pointer" />
                                            <button type="button" disabled={!skuPart(customColor)} onClick={addCustomColor} className="rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40">Add Color</button>
                                        </div>}
                                        {createColors.length > 0 && <p className="mt-2 text-xs text-gray-500">Selected: {createColors.join(', ')}</p>}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <div className="border-b border-gray-300 px-6 py-6 sm:px-7">
                                    <h3 className="mb-4 text-lg font-extrabold">Product Images</h3>
                                    <div
                                        onDragOver={event => { event.preventDefault(); setIsImageDragActive(true); }}
                                        onDragLeave={() => setIsImageDragActive(false)}
                                        onDrop={handleImageDrop}
                                        className={`flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${isImageDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}`}
                                    >
                                        {productForm.image ? <img src={productForm.image} alt="Product preview" className="max-h-28 max-w-full rounded object-contain" onError={e => { e.currentTarget.style.display = 'none'; }} /> : <ImagePlus className="size-10 text-gray-500" />}
                                        <p className="text-sm font-semibold">Image preview</p>
                                        <p className="text-xs text-gray-500">Drag and drop an image here, or choose one below.</p>
                                    </div>
                                    <input ref={imageInputRef} id="new-product-image-file" type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="hidden" onChange={handleImageInputChange} />
                                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                                        <div className="flex-1"><label htmlFor="new-product-image" className={label}>Image URL / path (optional)</label><input id="new-product-image" className={input} maxLength={255} placeholder="/images/products/shirt.jpg" value={productForm.image.startsWith('blob:') ? '' : productForm.image} onChange={e => setProductForm(v => ({ ...v, image: e.target.value }))} /></div>
                                        <label htmlFor="new-product-image-file" className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#625DFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600">Choose image</label>
                                    </div>
                                    <p className="mt-2 text-xs text-gray-600">Uploads keep the preview immediately available and save the image to the public storage folder.</p>
                                </div>
                                <div className="space-y-4 px-6 py-6 sm:px-7">
                                    <h3 className="text-lg font-extrabold">Pricing &amp; Stock</h3>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div><label htmlFor="new-price" className={label}>Price (PHP) *</label><input id="new-price" type="number" min="0" max="99999999.99" step="0.01" required className={input} value={variantForm.price} onChange={e => setVariantForm(v => ({ ...v, price: e.target.value }))} /></div>
                                        <div><label htmlFor="new-stock" className={label}>Stock Quantity *</label><input id="new-stock" type="number" min="0" max="2147483647" step="1" required className={input} value={variantForm.stock_quantity} onChange={e => setVariantForm(v => ({ ...v, stock_quantity: e.target.value }))} /></div>
                                        <div><label htmlFor="new-status" className={label}>Status</label><select id="new-status" className={input} value={productForm.status} onChange={e => setProductForm(v => ({ ...v, status: e.target.value as 'Active' | 'Inactive' }))}><option value="Active">Active</option><option value="Inactive">Inactive</option></select></div>
                                        <div><label htmlFor="new-reorder" className={label}>Reorder Level</label><input id="new-reorder" type="number" min="0" max="2147483647" step="1" required className={input} value={variantForm.reorder_level} onChange={e => setVariantForm(v => ({ ...v, reorder_level: e.target.value }))} /></div>
                                    </div>
                                    <p className="rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-900">Creates <strong>{createSizes.length * createColors.length}</strong> size/color variant(s). The entered price and stock apply <strong>to each variant</strong>. Unique SKUs are generated from the prefix, size, and color.</p>
                                </div>
                            </div>
                        </div>
                    </form>
                    <footer className="flex shrink-0 justify-end gap-3 border-t border-gray-300 bg-white px-6 py-4 sm:px-7"><button type="button" disabled={busy} onClick={() => setDialog(null)} className="min-w-32 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold hover:bg-gray-50 disabled:opacity-50">Cancel</button><button type="submit" form="create-product-form" disabled={busy || !createSizes.length || !createColors.length} className="min-w-36 rounded-lg bg-[#4084FA] px-6 py-3 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50">{busy ? 'Saving...' : 'Add Product'}</button></footer>
                </section>
            </div>
        )}
        {dialog && dialog !== 'create' && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={e => { if (e.target === e.currentTarget && !busy) setDialog(null); }}><section role="dialog" aria-modal="true" aria-label="Product management" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">{{create: 'Add Product', edit: 'Edit Product', view: 'Product Details', variant: editVariant ? 'Edit Variant' : 'Add Variant', category: 'Add Category'}[dialog]}</h2><button aria-label="Close dialog" disabled={busy} onClick={() => setDialog(null)}><X className="size-5" /></button></div>
            {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {dialog === 'edit' && <form onSubmit={submitProduct} className="space-y-3"><div><label className={label}>Product Name *</label><input required maxLength={255} className={input} value={productForm.name} onChange={e => setProductForm(s => ({ ...s, name: e.target.value }))} /></div><div className="grid grid-cols-2 gap-3"><div><label className={label}>Category *</label><select required className={input} value={productForm.category_id} onChange={e => setProductForm(s => ({ ...s, category_id: e.target.value }))}><option value="">Select category</option>{localCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><div><label className={label}>Status</label><select className={input} value={productForm.status} onChange={e => setProductForm(s => ({ ...s, status: e.target.value as 'Active' | 'Inactive' }))}><option>Active</option><option>Inactive</option></select></div></div><div><label className={label}>Brand</label><input className={input} value={productForm.brand} onChange={e => setProductForm(s => ({ ...s, brand: e.target.value }))} /></div><div><label className={label}>Image URL (optional)</label><input className={input} placeholder="/images/product.jpg" value={productForm.image} onChange={e => setProductForm(s => ({ ...s, image: e.target.value }))} /></div><div><label className={label}>Description</label><textarea className={input} rows={2} value={productForm.description} onChange={e => setProductForm(s => ({ ...s, description: e.target.value }))} /></div><button disabled={busy} className="w-full rounded-lg bg-[#625DFF] py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Saving...' : 'Save Changes'}</button></form>}
            {dialog === 'category' && <form onSubmit={submitCategory} className="space-y-4"><div><label className={label}>Category Name *</label><input required maxLength={255} className={input} value={categoryName} onChange={e => setCategoryName(e.target.value)} placeholder="e.g. Tops" /></div><button disabled={busy} className="w-full rounded-lg bg-[#625DFF] py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Saving...' : 'Create Category'}</button></form>}
            {dialog === 'view' && selected && <div className="space-y-4 text-sm"><p><strong>Category:</strong> {selected.category?.name ?? '—'}</p><p><strong>Brand:</strong> {selected.brand ?? '—'}</p><p><strong>Status:</strong> {selected.status}</p><p><strong>Description:</strong> {selected.description ?? '—'}</p><div className="flex items-center justify-between"><h3 className="font-bold">Variants</h3><button onClick={() => startVariant(selected)} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">+ Add Variant</button></div><div className="space-y-2">{selected.variants.map(v => <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border p-3"><div><b>{v.sku}</b><p>{v.size} / {v.color} · {php(v.price)}</p><p className="text-gray-500">Stock: {v.stock_quantity} · Reorder at: {v.reorder_level}</p></div><button onClick={() => startVariant(selected, v)} className="rounded bg-sky-100 p-2 text-sky-700" aria-label={`Edit variant ${v.sku}`}><Pencil className="size-4" /></button></div>)}</div><p className="text-xs text-gray-500">To change existing stock, use the Inventory restock/adjustment workflow. Stock cannot be edited here.</p></div>}
            {dialog === 'variant' && <form onSubmit={submitVariant} className="space-y-4"><VariantFields form={variantForm} setForm={setVariantForm} input={input} label={label} allowStock={!editVariant} /><button disabled={busy} className="w-full rounded-lg bg-[#625DFF] py-3 font-semibold text-white disabled:opacity-50">{busy ? 'Saving...' : editVariant ? 'Save Variant' : 'Add Variant'}</button></form>}
        </section></div>}
    </>;
}

function VariantFields({ form, setForm, input, label, allowStock }: { form: VariantInput; setForm: Dispatch<SetStateAction<VariantInput>>; input: string; label: string; allowStock: boolean }) {
    const field = (key: keyof VariantInput) => (value: string) => setForm(s => ({ ...s, [key]: value }));
    return <div className="grid grid-cols-2 gap-3"><div><label className={label}>SKU *</label><input required maxLength={255} className={input} value={form.sku} onChange={e => field('sku')(e.target.value)} /></div><div><label className={label}>Size *</label><input required className={input} value={form.size} onChange={e => field('size')(e.target.value)} placeholder="M" /></div><div><label className={label}>Color *</label><input required className={input} value={form.color} onChange={e => field('color')(e.target.value)} placeholder="Black" /></div><div><label className={label}>Price (PHP) *</label><input required type="number" min="0" max="99999999.99" step="0.01" className={input} value={form.price} onChange={e => field('price')(e.target.value)} /></div>{allowStock && <div><label className={label}>Initial Stock *</label><input required type="number" min="0" step="1" className={input} value={form.stock_quantity} onChange={e => field('stock_quantity')(e.target.value)} /></div>}<div><label className={label}>Reorder Level *</label><input required type="number" min="0" step="1" className={input} value={form.reorder_level} onChange={e => field('reorder_level')(e.target.value)} /></div></div>;
}
