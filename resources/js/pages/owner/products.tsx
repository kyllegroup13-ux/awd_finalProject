import { Head, router, usePage } from '@inertiajs/react';
import {
    Archive,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
    Eye,
    ImagePlus,
    Layers3,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    ShoppingBag,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { useRef, useState, type ChangeEvent, type Dispatch, type DragEvent, type FormEvent, type SetStateAction } from 'react';

import { OwnerSidebar } from '@/components/owner-sidebar';

type Category = { id: number; name: string };
type Variant = { id: number; sku: string; size: string; color: string; price: string | number; stock_quantity: number; reorder_level: number };
type Product = {
    id: number;
    name: string;
    description: string | null;
    image: string | null;
    status: string;
    category_id: number;
    category: Category | null;
    variants: Variant[];
};
type Pages = { data: Product[]; current_page: number; last_page: number; total: number };
type Filters = { search: string; category: string; size: string; status: string };
type Props = {
    products: Pages;
    categories: Category[];
    filters: Filters;
    archived: boolean;
    archivedCount: number;
    auth?: { user?: { name: string } };
};
type VariantInput = { sku: string; size: string; color: string; price: string; stock_quantity: string; reorder_level: string };
type NewProductVariant = { sku: string; size: string; color: string; price: number; stock_quantity: number; reorder_level: number };
type NewProductVariantInput = { size: string; color: string; price: string; stock_quantity: string; reorder_level: string };
type ProductInput = { name: string; category_id: string; description: string; image: string; status: 'Active' | 'Inactive' };

const php = (amount: number | string) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(amount));
const blankProduct = (): ProductInput => ({ name: '', category_id: '', description: '', image: '', status: 'Active' });
const blankVariant = (): VariantInput => ({ sku: '', size: '', color: '', price: '', stock_quantity: '0', reorder_level: '5' });
const blankNewProductVariant = (): NewProductVariantInput => ({ size: '', color: '', price: '', stock_quantity: '0', reorder_level: '5' });
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '28', '30', '32', '34', '36', '38', '40', '42', '44', '46'];
const COLOR_OPTIONS = [
    { name: 'Pink', hex: '#FA8189' },
    { name: 'Blue', hex: '#48A9DC' },
    { name: 'Black', hex: '#262626' },
    { name: 'Orange', hex: '#E97905' },
    { name: 'Green', hex: '#07D600' },
    { name: 'Mint', hex: '#B5F0B4' },
    { name: 'White', hex: '#FFFFFF' },
];
const skuPart = (value: string) =>
    value
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
const generateVariantSku = (prefix: string, size: string, color: string) => {
    const parts = [prefix, size, color].map(skuPart);
    return parts.every(Boolean) ? parts.join('-') : '';
};
function productSkuPrefix(product: Product): string {
    for (const variant of product.variants) {
        const parts = [variant.size, variant.color].map(skuPart);
        const suffix = parts.join('-');
        const sku = skuPart(variant.sku);
        if (parts.every(Boolean) && sku.endsWith(`-${suffix}`)) {
            const prefix = sku.slice(0, -suffix.length).replace(/-$/, '');
            if (prefix) return prefix;
        }
    }

    return skuPart(product.name) || `PRODUCT-${product.id}`;
}

function csrfHeaders(): Record<string, string> {
    const xsrfCookie = document.cookie
        .split(';')
        .map((cookie) => cookie.trim())
        .find((cookie) => cookie.startsWith('XSRF-TOKEN='));
    const xsrfToken = xsrfCookie ? decodeURIComponent(xsrfCookie.slice('XSRF-TOKEN='.length)) : '';

    if (xsrfToken) {
        return { 'X-XSRF-TOKEN': xsrfToken };
    }

    const csrfToken = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
    return csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {};
}
async function requestJson(url: string, method: 'POST' | 'PATCH' | 'DELETE', body: unknown) {
    const response = await fetch(url, {
        method,
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...csrfHeaders(), 'X-Requested-With': 'XMLHttpRequest' },
        body: JSON.stringify(body),
    });
    const result = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };
    if (response.status === 419) {
        throw new Error('The security token is out of date. Refresh the page and try again.');
    }
    if (!response.ok) {
        const validation = Object.values(result.errors ?? {})
            .flat()
            .join(' ');
        throw new Error(validation || result.message || `Request failed (${response.status}).`);
    }
    return result;
}

export default function OwnerProducts({ products, categories, filters, archived, archivedCount }: Props) {
    const { auth } = usePage().props as unknown as Props;
    const [search, setSearch] = useState(filters.search || '');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [dialog, setDialog] = useState<'create' | 'edit' | 'view' | 'variant' | 'category' | null>(null);
    const [selected, setSelected] = useState<Product | null>(null);
    const [productToDelete, setProductToDelete] = useState<Product | null>(null);
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
    const [createVariantInput, setCreateVariantInput] = useState<NewProductVariantInput>(blankNewProductVariant());
    const [createVariants, setCreateVariants] = useState<NewProductVariant[]>([]);
    const [customColor, setCustomColor] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isImageDragActive, setIsImageDragActive] = useState(false);
    const imageInputRef = useRef<HTMLInputElement | null>(null);

    function navigate(patch: Partial<Filters>, page = 1) {
        router.get(
            '/owner/manage/products',
            { ...filters, ...patch, archived: archived ? 1 : undefined, page },
            { preserveState: false, replace: true },
        );
    }
    function showArchivedProducts(showArchived: boolean) {
        setSearch('');
        setError('');
        router.get('/owner/manage/products', { archived: showArchived ? 1 : undefined }, { preserveState: false, replace: true });
    }
    function refresh(message: string) {
        setNotice(message);
        setDialog(null);
        setProductToDelete(null);
        setSelected(null);
        setEditVariant(null);
        router.reload({ only: ['products', 'categories', 'archivedCount'], onFinish: () => setBusy(false) });
    }
    function startCreate() {
        setError('');
        if (productForm.image.startsWith('blob:')) {
            URL.revokeObjectURL(productForm.image);
        }
        setImageFile(null);
        setProductForm({ ...blankProduct(), category_id: localCategories[0] ? String(localCategories[0].id) : '' });
        setVariantForm(blankVariant());
        setCreateVariantInput(blankNewProductVariant());
        setCreateVariants([]);
        setCustomColor('');
        setShowCustomColor(false);
        setShowNewCategory(false);
        setDialog('create');
    }
    function startEdit(product: Product) {
        setError('');
        if (productForm.image.startsWith('blob:')) {
            URL.revokeObjectURL(productForm.image);
        }
        setImageFile(null);
        setSelected(product);
        setProductForm({
            name: product.name,
            category_id: String(product.category_id),
            description: product.description ?? '',
            image: product.image ?? '',
            status: product.status as 'Active' | 'Inactive',
        });
        setDialog('edit');
    }
    function startVariant(product: Product, variant: Variant | null = null) {
        setSelected(product);
        setEditVariant(variant);
        setError('');
        setVariantForm(
            variant
                ? {
                      sku: variant.sku,
                      size: variant.size,
                      color: variant.color,
                      price: String(variant.price),
                      stock_quantity: String(variant.stock_quantity),
                      reorder_level: String(variant.reorder_level),
                  }
                : blankVariant(),
        );
        setDialog('variant');
    }
    async function submitProduct(event: FormEvent) {
        event.preventDefault();
        setError('');
        setBusy(true);
        try {
            if (dialog === 'create') {
                if (!createVariants.length) {
                    throw new Error('Add at least one variant before saving the product.');
                }
                if (!skuPart(variantForm.sku)) {
                    throw new Error('Enter an SKU prefix containing letters or numbers.');
                }
                const variants = createVariants;

                if (imageFile) {
                    const formData = new FormData();
                    formData.append('category_id', String(productForm.category_id));
                    formData.append('name', productForm.name);
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
                        headers: { ...csrfHeaders(), 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData,
                    });
                    const result = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };
                    if (!response.ok) {
                        const validation = Object.values(result.errors ?? {})
                            .flat()
                            .join(' ');
                        throw new Error(validation || result.message || `Request failed (${response.status}).`);
                    }
                    refresh('Product created successfully.');
                    return;
                }

                await requestJson('/owner/products', 'POST', {
                    ...productForm,
                    category_id: Number(productForm.category_id),
                    image: productForm.image || null,
                    variants,
                });
                refresh('Product created successfully.');
            } else if (selected) {
                if (imageFile) {
                    const formData = new FormData();
                    formData.append('_method', 'PATCH');
                    formData.append('category_id', String(productForm.category_id));
                    formData.append('name', productForm.name);
                    formData.append('description', productForm.description);
                    formData.append('status', productForm.status);
                    formData.append('image', imageFile);

                    const response = await fetch(`/owner/products/${selected.id}`, {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { ...csrfHeaders(), 'X-Requested-With': 'XMLHttpRequest' },
                        body: formData,
                    });
                    const result = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };
                    if (!response.ok) {
                        const validation = Object.values(result.errors ?? {})
                            .flat()
                            .join(' ');
                        throw new Error(validation || result.message || `Request failed (${response.status}).`);
                    }
                    refresh('Product updated successfully.');
                    return;
                }

                await requestJson(`/owner/products/${selected.id}`, 'PATCH', {
                    ...productForm,
                    category_id: Number(productForm.category_id),
                    image: productForm.image || null,
                });
                refresh('Product updated successfully.');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save product.');
            setBusy(false);
        }
    }
    async function submitVariant(event: FormEvent) {
        event.preventDefault();
        if (!selected) return;
        setError('');
        setBusy(true);
        try {
            if (editVariant) {
                await requestJson(`/owner/product-variants/${editVariant.id}`, 'PATCH', {
                    sku: variantForm.sku,
                    size: variantForm.size,
                    color: variantForm.color,
                    price: Number(variantForm.price),
                    reorder_level: Number(variantForm.reorder_level),
                });
            } else {
                await requestJson(`/owner/products/${selected.id}/variants`, 'POST', {
                    ...variantForm,
                    sku: generateVariantSku(productSkuPrefix(selected), variantForm.size, variantForm.color),
                    price: Number(variantForm.price),
                    stock_quantity: Number(variantForm.stock_quantity),
                    reorder_level: Number(variantForm.reorder_level),
                });
            }
            refresh(editVariant ? 'Variant updated.' : 'Variant added.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save variant.');
            setBusy(false);
        }
    }
    async function submitCategory(event: FormEvent) {
        event.preventDefault();
        setError('');
        setBusy(true);
        try {
            const result = (await requestJson('/owner/categories', 'POST', { name: categoryName.trim() })) as { category?: Category };
            if (result.category) setLocalCategories((current) => [...current, result.category!].sort((a, b) => a.name.localeCompare(b.name)));
            setCategoryName('');
            refresh('Category created.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not create category.');
            setBusy(false);
        }
    }
    async function addCategoryInline() {
        const name = inlineCategoryName.trim();
        if (!name) return;
        setError('');
        setBusy(true);
        try {
            const result = (await requestJson('/owner/categories', 'POST', { name })) as { category?: Category };
            if (!result.category) throw new Error('Category saved but the response did not include its details.');
            setLocalCategories((current) => [...current, result.category!].sort((a, b) => a.name.localeCompare(b.name)));
            setProductForm((current) => ({ ...current, category_id: String(result.category!.id) }));
            setInlineCategoryName('');
            setShowNewCategory(false);
            setNotice('Category added.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not add category.');
        } finally {
            setBusy(false);
        }
    }

    function addCustomColor() {
        const name = customColor.trim();
        if (!name || !skuPart(name)) {
            setError('Enter a color name with letters or numbers.');
            return;
        }
        const existingColor = [...COLOR_OPTIONS, ...addedColors].find((c) => c.name.toLowerCase() === name.toLowerCase());
        if (existingColor) {
            setCreateVariantInput((current) => ({ ...current, color: existingColor.name }));
            setShowCustomColor(false);
            setCustomColor('');
            return;
        }
        setAddedColors((current) => [...current, { name, hex: customHex }]);
        setCreateVariantInput((current) => ({ ...current, color: name }));
        setCustomColor('');
        setShowCustomColor(false);
        setError('');
    }

    function addCreateVariant() {
        const { size, color, price, stock_quantity, reorder_level } = createVariantInput;
        const skuPrefix = skuPart(variantForm.sku);
        const normalizedSize = skuPart(size);
        const normalizedColor = skuPart(color);
        const numericPrice = Number(price);
        const numericStock = Number(stock_quantity);
        const numericReorderLevel = Number(reorder_level);

        if (!skuPrefix) {
            setError('Enter an SKU prefix containing letters or numbers.');
            return;
        }
        if (!size || !color || !normalizedSize || !normalizedColor) {
            setError('Select a size and color for this variant.');
            return;
        }
        if (!price.trim() || !Number.isFinite(numericPrice) || numericPrice < 0 || numericPrice > 99999999.99) {
            setError('Enter a valid price for this variant.');
            return;
        }
        if (!stock_quantity.trim() || !Number.isSafeInteger(numericStock) || numericStock < 0 || numericStock > 2147483647) {
            setError('Enter a valid stock quantity for this variant.');
            return;
        }
        if (!reorder_level.trim() || !Number.isSafeInteger(numericReorderLevel) || numericReorderLevel < 0 || numericReorderLevel > 2147483647) {
            setError('Enter a valid reorder level for this variant.');
            return;
        }

        const sku = generateVariantSku(skuPrefix, size, color);
        if (
            createVariants.some(
                (variant) =>
                    (variant.size.toLowerCase() === size.toLowerCase() && variant.color.toLowerCase() === color.toLowerCase()) ||
                    variant.sku.toLowerCase() === sku.toLowerCase(),
            )
        ) {
            setError('This size and color variant has already been added.');
            return;
        }

        setCreateVariants((current) => [
            ...current,
            {
                sku,
                size,
                color,
                price: numericPrice,
                stock_quantity: numericStock,
                reorder_level: numericReorderLevel,
            },
        ]);
        setCreateVariantInput(blankNewProductVariant());
        setError('');
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
        setProductForm((current) => ({ ...current, image: URL.createObjectURL(file) }));
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

    async function deleteProduct() {
        if (!productToDelete) return;
        setBusy(true);
        setError('');
        try {
            await requestJson(`/owner/products/${productToDelete.id}`, 'DELETE', {});
            refresh('Product archived and removed from the product list.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not delete product.');
            setBusy(false);
        }
    }
    async function restoreProduct(product: Product) {
        setBusy(true);
        setError('');
        try {
            await requestJson(`/owner/products/${product.id}/restore`, 'PATCH', {});
            refresh('Product restored successfully.');
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not restore product.');
            setBusy(false);
        }
    }
    const input = 'w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-[#202023] outline-none focus:border-indigo-500';
    const label = 'mb-1 block text-xs font-semibold text-gray-700';
    const createVariantSku = generateVariantSku(variantForm.sku, createVariantInput.size, createVariantInput.color);

    return (
        <>
            <Head title="Product Management | M3 Dry Goods" />
            <div className="min-h-screen bg-[#F5F6F8] text-[#19191C] md:flex">
                <OwnerSidebar />
                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[76px] items-center justify-between border-b border-gray-200/80 bg-white px-5 sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="hidden size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:flex">
                                <ShoppingBag className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-lg leading-tight font-extrabold">Product Management</h1>
                                <p className="text-xs text-gray-500">Manage your clothing products, categories, and pricing</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden text-sm font-semibold text-gray-700 sm:inline">{auth?.user?.name ?? 'Owner'}</span>
                            <span className="flex size-10 items-center justify-center rounded-full bg-[#19191C] text-white">
                                <UserRound className="size-5" />
                            </span>
                        </div>
                    </header>
                    <main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
                        <section className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="mb-1 text-xs font-semibold tracking-[0.16em] text-violet-600 uppercase">Catalog</p>
                                <h2 className="text-2xl font-bold tracking-tight text-[#19191C] sm:text-3xl">
                                    {archived ? 'Archived products' : 'Your products'}
                                </h2>
                                <p className="mt-2 text-sm text-gray-500">
                                    {archived
                                        ? 'Review archived items and restore products when you need them.'
                                        : 'Keep your product details, variants, and availability organized.'}
                                </p>
                            </div>
                            {!archived && (
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setError('');
                                            setDialog('category');
                                        }}
                                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                    >
                                        + Add Category
                                    </button>
                                    <button
                                        type="button"
                                        onClick={startCreate}
                                        className="flex items-center gap-2 rounded-xl bg-[#625DFF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-indigo-600"
                                    >
                                        <Plus className="size-5" /> Add Product
                                    </button>
                                </div>
                            )}
                        </section>

                        <section className="grid gap-4 sm:grid-cols-3">
                            <article className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-200/40">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">{archived ? 'Archived products' : 'Products in view'}</p>
                                    <p className="mt-1 text-2xl font-bold text-[#19191C]">{products.total.toLocaleString()}</p>
                                </div>
                                <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                    <ShoppingBag className="size-5" />
                                </span>
                            </article>
                            <article className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-200/40">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">Categories</p>
                                    <p className="mt-1 text-2xl font-bold text-[#19191C]">{localCategories.length.toLocaleString()}</p>
                                </div>
                                <span className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                                    <Layers3 className="size-5" />
                                </span>
                            </article>
                            <article className="flex items-center justify-between rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm shadow-gray-200/40">
                                <div>
                                    <p className="text-xs font-medium text-gray-500">In archive</p>
                                    <p className="mt-1 text-2xl font-bold text-[#19191C]">{archivedCount.toLocaleString()}</p>
                                </div>
                                <span className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                                    <Archive className="size-5" />
                                </span>
                            </article>
                        </section>

                        <section className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40">
                            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-4 py-4 sm:px-5">
                                <div className="flex gap-1 rounded-xl bg-gray-100 p-1" aria-label="Product views">
                                    <button
                                        type="button"
                                        aria-current={!archived ? 'page' : undefined}
                                        onClick={() => showArchivedProducts(false)}
                                        className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${!archived ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                    >
                                        Products
                                    </button>
                                    <button
                                        type="button"
                                        aria-current={archived ? 'page' : undefined}
                                        onClick={() => showArchivedProducts(true)}
                                        className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${archived ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                                    >
                                        <Archive className="size-4" /> Archive
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs ${archived ? 'bg-violet-100 text-violet-700' : 'bg-gray-200 text-gray-600'}`}
                                        >
                                            {archivedCount}
                                        </span>
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500">
                                    Showing {products.data.length} of {products.total} products
                                </p>
                            </div>

                            {archived && (
                                <div className="mx-4 mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 sm:mx-5">
                                    <Archive className="mt-0.5 size-4 shrink-0" />
                                    <p>
                                        Archived products are hidden from checkout and inventory counts. Restore a product to make it available again.
                                    </p>
                                </div>
                            )}

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    navigate({ search });
                                }}
                                className="grid gap-3 border-b border-gray-100 p-4 sm:grid-cols-2 sm:p-5 xl:grid-cols-5"
                            >
                                <div className="relative xl:col-span-2">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        aria-label="Search products"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search products..."
                                        className={`${input} rounded-xl border-gray-200 bg-gray-50 py-3 pl-10 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10`}
                                    />
                                </div>
                                <select
                                    aria-label="Category"
                                    value={filters.category}
                                    onChange={(e) => navigate({ category: e.target.value })}
                                    className={`${input} rounded-xl border-gray-200 bg-gray-50 py-3 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10`}
                                >
                                    <option value="">All Categories</option>
                                    {localCategories.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    aria-label="Size"
                                    value={filters.size}
                                    onChange={(e) => navigate({ size: e.target.value })}
                                    className={`${input} rounded-xl border-gray-200 bg-gray-50 py-3 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10`}
                                >
                                    <option value="">All Sizes</option>
                                    {['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'].map((s) => (
                                        <option key={s} value={s}>
                                            {s}
                                        </option>
                                    ))}
                                </select>
                                <select
                                    aria-label="Status"
                                    value={filters.status}
                                    onChange={(e) => navigate({ status: e.target.value })}
                                    className={`${input} rounded-xl border-gray-200 bg-gray-50 py-3 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10`}
                                >
                                    <option value="">All Status</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </form>

                            {notice && (
                                <p
                                    role="status"
                                    className="mx-4 mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 sm:mx-5"
                                >
                                    {notice}
                                </p>
                            )}
                            {error && !dialog && !productToDelete && (
                                <p role="alert" className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:mx-5">
                                    {error}
                                </p>
                            )}

                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1000px] text-left text-xs">
                                    <thead className="bg-gray-50 text-[10px] tracking-wide text-gray-500 uppercase">
                                        <tr>
                                            {['Product', 'Category', 'Sizes', 'Colors', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                                                <th key={h} className="px-4 py-3.5 font-semibold">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {products.data.map((p) => {
                                            const stock = p.variants.reduce((n, v) => n + v.stock_quantity, 0);
                                            const prices = p.variants.map((v) => Number(v.price));
                                            const uniqueSizes = [...new Set(p.variants.map((v) => v.size))];
                                            const uniqueColors = [...new Set(p.variants.map((v) => v.color))];
                                            return (
                                                <tr key={p.id} className="transition hover:bg-gray-50/80">
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex min-w-[210px] items-center gap-3">
                                                            {p.image ? (
                                                                <img
                                                                    src={p.image}
                                                                    alt={p.name}
                                                                    className="size-11 shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-300">
                                                                    <ShoppingBag className="size-5" />
                                                                </span>
                                                            )}
                                                            <div className="min-w-0">
                                                                <p className="truncate font-semibold text-gray-900">{p.name}</p>
                                                                <p className="mt-0.5 text-[10px] text-gray-400">ID {String(p.id).padStart(4, '0')}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-gray-600">{p.category?.name ?? '—'}</td>
                                                    <td className="px-4 py-3.5 text-gray-600">{uniqueSizes.join(', ') || '—'}</td>
                                                    <td className="px-4 py-3.5 text-gray-600">{uniqueColors.join(', ') || '—'}</td>
                                                    <td className="px-4 py-3.5 font-semibold whitespace-nowrap text-gray-800">
                                                        {prices.length
                                                            ? `${php(Math.min(...prices))}${Math.min(...prices) !== Math.max(...prices) ? ` – ${php(Math.max(...prices))}` : ''}`
                                                            : '—'}
                                                    </td>
                                                    <td className="px-4 py-3.5 font-medium text-gray-700">{stock}</td>
                                                    <td className="px-4 py-3.5">
                                                        <span
                                                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${p.status === 'Inactive' ? 'bg-gray-100 text-gray-600' : stock === 0 ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
                                                        >
                                                            {p.status === 'Inactive' ? 'Inactive' : stock === 0 ? 'Out of Stock' : 'In Stock'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <button
                                                                type="button"
                                                                title="View product"
                                                                aria-label={`View ${p.name}`}
                                                                onClick={() => {
                                                                    setSelected(p);
                                                                    setDialog('view');
                                                                }}
                                                                className="rounded-lg p-2 text-gray-500 transition hover:bg-violet-50 hover:text-violet-700"
                                                            >
                                                                <Eye className="size-4" />
                                                            </button>
                                                            {archived ? (
                                                                <button
                                                                    type="button"
                                                                    disabled={busy}
                                                                    title="Restore product"
                                                                    aria-label={`Restore ${p.name}`}
                                                                    onClick={() => void restoreProduct(p)}
                                                                    className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                                                                >
                                                                    <RotateCcw className="size-4" />
                                                                    <span>Restore</span>
                                                                </button>
                                                            ) : (
                                                                <>
                                                                    <button
                                                                        type="button"
                                                                        title="Edit product"
                                                                        aria-label={`Edit ${p.name}`}
                                                                        onClick={() => startEdit(p)}
                                                                        className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-700"
                                                                    >
                                                                        <Pencil className="size-4" />
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        disabled={busy}
                                                                        title="Archive product"
                                                                        aria-label={`Archive ${p.name}`}
                                                                        onClick={() => {
                                                                            setError('');
                                                                            setProductToDelete(p);
                                                                        }}
                                                                        className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                                                    >
                                                                        <Trash2 className="size-4" />
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {products.data.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-16 text-center">
                                                    <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                                                        <ShoppingBag className="size-6" />
                                                    </span>
                                                    <p className="mt-3 text-sm font-semibold text-gray-700">No products found</p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Try changing your filters or add a product to get started.
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-4 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                                <span>
                                    {products.total} {archived ? 'archived products' : 'products'}
                                </span>
                                <div className="flex items-center justify-between gap-3 sm:justify-end">
                                    <button
                                        type="button"
                                        disabled={products.current_page <= 1}
                                        onClick={() => navigate({}, products.current_page - 1)}
                                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="size-4" />
                                        Previous
                                    </button>
                                    <span className="min-w-16 text-center text-xs font-semibold text-gray-600">
                                        Page {products.current_page} of {products.last_page}
                                    </span>
                                    <button
                                        type="button"
                                        disabled={products.current_page >= products.last_page}
                                        onClick={() => navigate({}, products.current_page + 1)}
                                        className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
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
            {dialog === 'create' && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-6"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !busy) setDialog(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-product-title"
                        className="flex max-h-[94vh] w-full max-w-[940px] flex-col overflow-hidden rounded-xl bg-white text-[#202023] shadow-2xl"
                    >
                        <header className="flex shrink-0 items-start justify-between border-b border-gray-300 px-6 py-4 sm:px-7">
                            <div>
                                <h2 id="create-product-title" className="text-2xl font-bold tracking-tight">
                                    Add new product
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">Fill in the details below to add a new item to your inventory</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close add product"
                                disabled={busy}
                                onClick={() => setDialog(null)}
                                className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
                            >
                                <X className="size-6" />
                            </button>
                        </header>
                        <form id="create-product-form" onSubmit={submitProduct} className="min-h-0 flex-1 overflow-y-auto">
                            {error && (
                                <p role="alert" className="mx-6 mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                    {error}
                                </p>
                            )}
                            <div className="grid md:grid-cols-2">
                                <div className="space-y-6 border-b border-gray-300 px-6 py-6 sm:px-7 md:border-r md:border-b-0">
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-extrabold">Basic Information</h3>
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="new-product-name" className={label}>
                                                    Product Name *
                                                </label>
                                                <input
                                                    id="new-product-name"
                                                    required
                                                    maxLength={255}
                                                    className={input}
                                                    value={productForm.name}
                                                    onChange={(e) => setProductForm((v) => ({ ...v, name: e.target.value }))}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="new-product-sku" className={label}>
                                                    SKU Prefix *
                                                </label>
                                                <input
                                                    id="new-product-sku"
                                                    required
                                                    maxLength={140}
                                                    placeholder="e.g. SHIRT-001"
                                                    className={input}
                                                    value={variantForm.sku}
                                                    onChange={(e) => setVariantForm((v) => ({ ...v, sku: e.target.value }))}
                                                />
                                                <p className="mt-1 text-[11px] text-gray-500">Product ID is assigned automatically</p>
                                            </div>
                                            <div>
                                                <label htmlFor="new-product-category" className={label}>
                                                    Category *
                                                </label>
                                                <select
                                                    id="new-product-category"
                                                    required
                                                    className={input}
                                                    value={productForm.category_id}
                                                    onChange={(e) => setProductForm((v) => ({ ...v, category_id: e.target.value }))}
                                                >
                                                    <option value="">Select a category</option>
                                                    {localCategories.map((c) => (
                                                        <option key={c.id} value={c.id}>
                                                            {c.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                {localCategories.length === 0 && (
                                                    <p className="mt-1 text-xs text-amber-700">No categories saved yet. Create one below.</p>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewCategory((v) => !v)}
                                                    className="mt-2 text-xs font-semibold text-indigo-700 hover:underline"
                                                >
                                                    + Create Category
                                                </button>
                                                {showNewCategory && (
                                                    <div className="mt-2 flex gap-2">
                                                        <input
                                                            aria-label="New category name"
                                                            maxLength={255}
                                                            value={inlineCategoryName}
                                                            onChange={(e) => setInlineCategoryName(e.target.value)}
                                                            placeholder="e.g. Tops"
                                                            className={`${input} min-w-0 flex-1`}
                                                        />
                                                        <button
                                                            type="button"
                                                            disabled={busy || !inlineCategoryName.trim()}
                                                            onClick={() => void addCategoryInline()}
                                                            className="rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                                                        >
                                                            Save
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="new-product-desc" className={label}>
                                                Description
                                            </label>
                                            <textarea
                                                id="new-product-desc"
                                                rows={4}
                                                maxLength={500}
                                                className={`${input} resize-y`}
                                                value={productForm.description}
                                                onChange={(e) => setProductForm((v) => ({ ...v, description: e.target.value }))}
                                            />
                                            <p className="text-right text-[11px] text-gray-400">{productForm.description.length} / 500</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4 border-t border-gray-200 pt-5">
                                        <div>
                                            <h3 className="text-lg font-extrabold">Add Variants One at a Time</h3>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Choose one size and color, enter its details, then add it to the product.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="new-variant-size" className={label}>
                                                    Size
                                                </label>
                                                <input
                                                    id="new-variant-size"
                                                    list="product-size-options"
                                                    maxLength={255}
                                                    className={input}
                                                    value={createVariantInput.size}
                                                    onChange={(event) =>
                                                        setCreateVariantInput((current) => ({ ...current, size: event.target.value }))
                                                    }
                                                    placeholder="e.g. M, 32, or 38"
                                                />
                                                <p className="mt-1 text-[11px] text-gray-500">Choose a suggestion or enter any size.</p>
                                            </div>
                                            <div>
                                                <label htmlFor="new-variant-color" className={label}>
                                                    Color
                                                </label>
                                                <div className="flex gap-2">
                                                    <select
                                                        id="new-variant-color"
                                                        className={input}
                                                        value={createVariantInput.color}
                                                        onChange={(event) =>
                                                            setCreateVariantInput((current) => ({ ...current, color: event.target.value }))
                                                        }
                                                    >
                                                        <option value="">Select color</option>
                                                        {[...COLOR_OPTIONS, ...addedColors].map((color) => (
                                                            <option key={color.name} value={color.name}>
                                                                {color.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <button
                                                        type="button"
                                                        title="Add another color"
                                                        aria-label="Add another color"
                                                        onClick={() => setShowCustomColor((current) => !current)}
                                                        className="shrink-0 rounded-lg border border-gray-300 px-3 text-lg hover:border-indigo-600 hover:text-indigo-600"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="new-variant-generated-sku" className={label}>
                                                Generated SKU
                                            </label>
                                            <input
                                                id="new-variant-generated-sku"
                                                readOnly
                                                className={`${input} bg-gray-50 font-mono`}
                                                value={createVariantSku}
                                                placeholder="Enter SKU prefix, size, and color"
                                            />
                                        </div>
                                        {showCustomColor && (
                                            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 p-3">
                                                <input
                                                    aria-label="Custom color name"
                                                    value={customColor}
                                                    onChange={(event) => setCustomColor(event.target.value)}
                                                    placeholder="Color name (e.g. Burgundy)"
                                                    maxLength={60}
                                                    className={`${input} min-w-36 flex-1`}
                                                />
                                                <input
                                                    type="color"
                                                    aria-label="Choose color shade"
                                                    value={customHex}
                                                    onChange={(event) => setCustomHex(event.target.value)}
                                                    className="h-10 w-12 cursor-pointer"
                                                />
                                                <button
                                                    type="button"
                                                    disabled={!skuPart(customColor)}
                                                    onClick={addCustomColor}
                                                    className="rounded-lg bg-indigo-600 px-3 py-2.5 text-xs font-semibold text-white disabled:opacity-40"
                                                >
                                                    Add Color
                                                </button>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="new-variant-price" className={label}>
                                                    Price (PHP)
                                                </label>
                                                <input
                                                    id="new-variant-price"
                                                    type="number"
                                                    min="0"
                                                    max="99999999.99"
                                                    step="0.01"
                                                    className={input}
                                                    value={createVariantInput.price}
                                                    onChange={(event) =>
                                                        setCreateVariantInput((current) => ({ ...current, price: event.target.value }))
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="new-variant-stock" className={label}>
                                                    Stock Quantity
                                                </label>
                                                <input
                                                    id="new-variant-stock"
                                                    type="number"
                                                    min="0"
                                                    max="2147483647"
                                                    step="1"
                                                    className={input}
                                                    value={createVariantInput.stock_quantity}
                                                    onChange={(event) =>
                                                        setCreateVariantInput((current) => ({ ...current, stock_quantity: event.target.value }))
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="new-variant-reorder" className={label}>
                                                    Reorder Level
                                                </label>
                                                <input
                                                    id="new-variant-reorder"
                                                    type="number"
                                                    min="0"
                                                    max="2147483647"
                                                    step="1"
                                                    className={input}
                                                    value={createVariantInput.reorder_level}
                                                    onChange={(event) =>
                                                        setCreateVariantInput((current) => ({ ...current, reorder_level: event.target.value }))
                                                    }
                                                />
                                            </div>
                                            <div className="flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={addCreateVariant}
                                                    className="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
                                                >
                                                    Add Variant
                                                </button>
                                            </div>
                                        </div>
                                        {createVariants.length > 0 && (
                                            <div className="space-y-2" aria-live="polite">
                                                <p className={label}>Added Variants ({createVariants.length})</p>
                                                {createVariants.map((variant) => (
                                                    <div
                                                        key={variant.sku}
                                                        className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 text-xs"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate font-semibold">
                                                                {variant.color} / {variant.size} · {variant.sku}
                                                            </p>
                                                            <p className="mt-1 text-gray-500">
                                                                {php(variant.price)} · Stock: {variant.stock_quantity} · Reorder at:{' '}
                                                                {variant.reorder_level}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            aria-label={`Remove variant ${variant.sku}`}
                                                            onClick={() =>
                                                                setCreateVariants((current) => current.filter((item) => item.sku !== variant.sku))
                                                            }
                                                            className="shrink-0 rounded p-2 text-red-600 hover:bg-red-50"
                                                        >
                                                            <X className="size-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col">
                                    <div className="border-b border-gray-300 px-6 py-6 sm:px-7">
                                        <h3 className="mb-4 text-lg font-extrabold">Product Images</h3>
                                        <div
                                            onDragOver={(event) => {
                                                event.preventDefault();
                                                setIsImageDragActive(true);
                                            }}
                                            onDragLeave={() => setIsImageDragActive(false)}
                                            onDrop={handleImageDrop}
                                            className={`flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-center transition ${isImageDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-gray-50'}`}
                                        >
                                            {productForm.image ? (
                                                <img
                                                    src={productForm.image}
                                                    alt="Product preview"
                                                    className="max-h-28 max-w-full rounded object-contain"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <ImagePlus className="size-10 text-gray-500" />
                                            )}
                                            <p className="text-sm font-semibold">Image preview</p>
                                            <p className="text-xs text-gray-500">Drag and drop an image here, or choose one below.</p>
                                        </div>
                                        <input
                                            ref={imageInputRef}
                                            id="new-product-image-file"
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            className="hidden"
                                            onChange={handleImageInputChange}
                                        />
                                        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                                            <div className="flex-1">
                                                <label htmlFor="new-product-image" className={label}>
                                                    Image URL / path (optional)
                                                </label>
                                                <input
                                                    id="new-product-image"
                                                    className={input}
                                                    maxLength={255}
                                                    placeholder="/images/products/shirt.jpg"
                                                    value={productForm.image.startsWith('blob:') ? '' : productForm.image}
                                                    onChange={(e) => setProductForm((v) => ({ ...v, image: e.target.value }))}
                                                />
                                            </div>
                                            <label
                                                htmlFor="new-product-image-file"
                                                className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#625DFF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-600"
                                            >
                                                Choose image
                                            </label>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-600">
                                            Uploads keep the preview immediately available and save the image to the public storage folder.
                                        </p>
                                    </div>
                                    <div className="space-y-4 px-6 py-6 sm:px-7">
                                        <h3 className="text-lg font-extrabold">Product Settings</h3>
                                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                            <div>
                                                <label htmlFor="new-status" className={label}>
                                                    Status
                                                </label>
                                                <select
                                                    id="new-status"
                                                    className={input}
                                                    value={productForm.status}
                                                    onChange={(e) =>
                                                        setProductForm((v) => ({ ...v, status: e.target.value as 'Active' | 'Inactive' }))
                                                    }
                                                >
                                                    <option value="Active">Active</option>
                                                    <option value="Inactive">Inactive</option>
                                                </select>
                                            </div>
                                        </div>
                                        <p className="rounded-lg bg-blue-50 p-3 text-xs leading-5 text-blue-900">
                                            Add each size/color combination separately. Each variant gets its own SKU, price, stock quantity, and
                                            reorder level.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </form>
                        <footer className="flex shrink-0 justify-end gap-3 border-t border-gray-300 bg-white px-6 py-4 sm:px-7">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setDialog(null)}
                                className="min-w-32 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-bold hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="create-product-form"
                                disabled={busy || !createVariants.length}
                                className="min-w-36 rounded-lg bg-[#4084FA] px-6 py-3 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50"
                            >
                                {busy ? 'Saving...' : 'Add Product'}
                            </button>
                        </footer>
                    </section>
                </div>
            )}
            {dialog === 'edit' && selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !busy) setDialog(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="edit-product-title"
                        className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white text-[#202023] shadow-2xl"
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-5 sm:px-7">
                            <div className="flex min-w-0 items-center gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                                    <Pencil className="size-5" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold tracking-[0.16em] text-indigo-600 uppercase">Product Management</p>
                                    <h2 id="edit-product-title" className="mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
                                        Edit Product
                                    </h2>
                                    <p className="mt-0.5 truncate text-sm text-slate-500">Update details for {selected.name}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Close edit product"
                                disabled={busy}
                                onClick={() => setDialog(null)}
                                className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none disabled:opacity-50"
                            >
                                <X className="size-5" />
                            </button>
                        </header>
                        <form id="edit-product-form" onSubmit={submitProduct} className="min-h-0 overflow-y-auto">
                            {error && (
                                <p role="alert" className="mx-5 mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:mx-7">
                                    {error}
                                </p>
                            )}
                            <div className="grid md:grid-cols-[240px_minmax(0,1fr)]">
                                <aside className="space-y-4 border-b border-slate-200 bg-slate-50/70 p-5 sm:p-7 md:border-r md:border-b-0">
                                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                                        {productForm.image ? (
                                            <img
                                                src={productForm.image}
                                                alt={`${productForm.name || selected.name} preview`}
                                                className="max-h-full max-w-full object-contain"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : (
                                            <ShoppingBag className="size-16 text-slate-300" />
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <span
                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${productForm.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                                        >
                                            {productForm.status}
                                        </span>
                                        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Product ID</p>
                                        <p className="font-mono text-lg font-bold text-slate-800">#{String(selected.id).padStart(4, '0')}</p>
                                        <p className="text-xs leading-5 text-slate-500">
                                            Changes here update the product listing. Stock is managed from Inventory Management.
                                        </p>
                                    </div>
                                </aside>
                                <div className="space-y-5 p-5 sm:p-7">
                                    <div>
                                        <h3 className="text-sm font-extrabold tracking-wide text-slate-800 uppercase">Product details</h3>
                                        <p className="mt-1 text-xs text-slate-500">Keep product information clear and up to date.</p>
                                    </div>
                                    <div>
                                        <label htmlFor="edit-product-name" className={label}>
                                            Product Name *
                                        </label>
                                        <input
                                            id="edit-product-name"
                                            required
                                            maxLength={255}
                                            className={input}
                                            value={productForm.name}
                                            onChange={(e) => setProductForm((s) => ({ ...s, name: e.target.value }))}
                                        />
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div>
                                            <label htmlFor="edit-product-category" className={label}>
                                                Category *
                                            </label>
                                            <select
                                                id="edit-product-category"
                                                required
                                                className={input}
                                                value={productForm.category_id}
                                                onChange={(e) => setProductForm((s) => ({ ...s, category_id: e.target.value }))}
                                            >
                                                <option value="">Select category</option>
                                                {localCategories.map((c) => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="edit-product-status" className={label}>
                                                Status
                                            </label>
                                            <select
                                                id="edit-product-status"
                                                className={input}
                                                value={productForm.status}
                                                onChange={(e) => setProductForm((s) => ({ ...s, status: e.target.value as 'Active' | 'Inactive' }))}
                                            >
                                                <option value="Active">Active</option>
                                                <option value="Inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="edit-product-image" className={label}>
                                            Image URL / path (optional)
                                        </label>
                                        <input
                                            ref={imageInputRef}
                                            id="edit-product-image-file"
                                            type="file"
                                            accept="image/png,image/jpeg,image/jpg,image/webp"
                                            className="hidden"
                                            onChange={handleImageInputChange}
                                        />
                                        <div className="flex flex-col gap-2 sm:flex-row">
                                            <input
                                                id="edit-product-image"
                                                maxLength={255}
                                                className={input}
                                                placeholder="/images/products/product.jpg"
                                                value={productForm.image.startsWith('blob:') ? '' : productForm.image}
                                                onChange={(e) => setProductForm((s) => ({ ...s, image: e.target.value }))}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => imageInputRef.current?.click()}
                                                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                                            >
                                                <ImagePlus className="size-4" />
                                                Select Image
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label htmlFor="edit-product-description" className={label}>
                                            Description
                                        </label>
                                        <textarea
                                            id="edit-product-description"
                                            maxLength={500}
                                            rows={4}
                                            className={`${input} resize-y`}
                                            placeholder="Add a short description of this product"
                                            value={productForm.description}
                                            onChange={(e) => setProductForm((s) => ({ ...s, description: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                        <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => setDialog(null)}
                                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="edit-product-form"
                                disabled={busy}
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <Pencil className="size-4" />
                                {busy ? 'Saving...' : 'Save Changes'}
                            </button>
                        </footer>
                    </section>
                </div>
            )}
            <datalist id="product-size-options">
                {SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size} />
                ))}
            </datalist>
            {(dialog === 'category' || dialog === 'variant') && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !busy) setDialog(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-label="Product management"
                        className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white p-6 text-[#202023] shadow-xl"
                    >
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-bold">
                                {
                                    {
                                        create: 'Add Product',
                                        edit: 'Edit Product',
                                        view: 'Product Details',
                                        variant: editVariant ? 'Edit Variant' : 'Add Variant',
                                        category: 'Add Category',
                                    }[dialog]
                                }
                            </h2>
                            <button aria-label="Close dialog" disabled={busy} onClick={() => setDialog(null)}>
                                <X className="size-5" />
                            </button>
                        </div>
                        {error && (
                            <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}
                        {dialog === 'category' && (
                            <form onSubmit={submitCategory} className="space-y-4">
                                <div>
                                    <label className={label}>Category Name *</label>
                                    <input
                                        required
                                        maxLength={255}
                                        className={input}
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        placeholder="e.g. Tops"
                                    />
                                </div>
                                <button disabled={busy} className="w-full rounded-lg bg-[#625DFF] py-3 font-semibold text-white disabled:opacity-50">
                                    {busy ? 'Saving...' : 'Create Category'}
                                </button>
                            </form>
                        )}
                        {dialog === 'variant' && (
                            <form onSubmit={submitVariant} className="space-y-4">
                                <VariantFields
                                    form={variantForm}
                                    setForm={setVariantForm}
                                    input={input}
                                    label={label}
                                    allowStock={!editVariant}
                                    skuPrefix={editVariant || !selected ? null : productSkuPrefix(selected)}
                                />
                                <button disabled={busy} className="w-full rounded-lg bg-[#625DFF] py-3 font-semibold text-white disabled:opacity-50">
                                    {busy ? 'Saving...' : editVariant ? 'Save Variant' : 'Add Variant'}
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            )}
            {dialog === 'view' && selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-6"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !busy) setDialog(null);
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="product-details-title"
                        className="my-auto flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white text-[#202023] shadow-2xl"
                    >
                        <header className="flex items-start justify-between gap-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-violet-50 px-5 py-5 sm:px-7">
                            <div className="flex min-w-0 items-center gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
                                    <ShoppingBag className="size-6" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold tracking-[0.16em] text-indigo-600 uppercase">Product Management</p>
                                    <h2 id="product-details-title" className="mt-1 truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                                        {selected.name}
                                    </h2>
                                    <p className="mt-0.5 text-sm text-slate-500">Product #{String(selected.id).padStart(4, '0')}</p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <span
                                    className={`hidden rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex ${selected.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}
                                >
                                    <BadgeCheck className="mr-1 size-4" />
                                    {selected.status}
                                </span>
                                <button
                                    type="button"
                                    aria-label="Close product details"
                                    onClick={() => setDialog(null)}
                                    className="rounded-lg p-2 text-slate-500 transition hover:bg-white hover:text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                        </header>
                        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
                            <div className="grid gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                                <div className="flex min-h-56 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:min-h-72">
                                    {selected.image ? (
                                        <img
                                            src={selected.image}
                                            alt={selected.name}
                                            className="max-h-80 max-w-full object-contain"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-slate-400">
                                            <ShoppingBag className="size-14" />
                                            <span className="text-sm font-medium">No product image</span>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-5">
                                    <section>
                                        <h3 className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">Product information</h3>
                                        <dl className="mt-3 grid grid-cols-2 gap-3">
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Category</dt>
                                                <dd className="mt-1 truncate text-sm font-bold text-slate-900">{selected.category?.name ?? '—'}</dd>
                                            </div>
                                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                                                <dt className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Status</dt>
                                                <dd className="mt-1 text-sm font-bold text-slate-900">{selected.status}</dd>
                                            </div>
                                        </dl>
                                    </section>
                                    <section>
                                        <h3 className="text-xs font-bold tracking-[0.14em] text-slate-500 uppercase">Description</h3>
                                        <p className="mt-2 min-h-16 rounded-xl border border-slate-200 p-3.5 text-sm leading-6 whitespace-pre-wrap text-slate-700">
                                            {selected.description || 'No description provided.'}
                                        </p>
                                    </section>
                                </div>
                            </div>
                            <section className="mt-7">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="flex size-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                                            <Layers3 className="size-5" />
                                        </span>
                                        <div>
                                            <h3 className="text-base font-extrabold">Product variants</h3>
                                            <p className="text-xs text-slate-500">
                                                {selected.variants.length} size/color option{selected.variants.length === 1 ? '' : 's'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => startVariant(selected)}
                                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-indigo-700"
                                    >
                                        <Plus className="size-4" />
                                        Add Variant
                                    </button>
                                </div>
                                <div className="overflow-hidden rounded-xl border border-slate-200">
                                    {selected.variants.length > 0 ? (
                                        <div className="divide-y divide-slate-100">
                                            {selected.variants.map((v) => (
                                                <article
                                                    key={v.id}
                                                    className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 transition hover:bg-slate-50 sm:px-5"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                                                            <Layers3 className="size-5" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold text-slate-900">
                                                                {v.color} / {v.size}
                                                            </p>
                                                            <p className="truncate font-mono text-xs text-slate-500">{v.sku}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-4 sm:gap-6">
                                                        <div className="text-right">
                                                            <p className="text-sm font-extrabold text-slate-900">{php(v.price)}</p>
                                                            <p className="text-xs text-slate-500">
                                                                Stock {v.stock_quantity} <span aria-hidden="true">·</span> Reorder {v.reorder_level}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => startVariant(selected, v)}
                                                            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                            aria-label={`Edit variant ${v.sku}`}
                                                            title={`Edit variant ${v.sku}`}
                                                        >
                                                            <Pencil className="size-4" />
                                                        </button>
                                                    </div>
                                                </article>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                                            <Layers3 className="size-8 text-slate-300" />
                                            <p className="text-sm font-semibold text-slate-700">No variants yet</p>
                                            <p className="text-xs text-slate-500">Add a size and color option to this product.</p>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-slate-500">
                                    To change existing stock, use the Inventory restock/adjustment workflow.
                                </p>
                            </section>
                        </div>
                        <footer className="flex justify-end border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-7">
                            <button
                                type="button"
                                onClick={() => setDialog(null)}
                                className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
                            >
                                Close
                            </button>
                        </footer>
                    </section>
                </div>
            )}
            {productToDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget && !busy) {
                            setProductToDelete(null);
                            setError('');
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-product-title"
                        aria-describedby="delete-product-description"
                        className="w-full max-w-md rounded-xl bg-white p-6 text-[#202023] shadow-2xl"
                    >
                        <h2 id="delete-product-title" className="text-xl font-bold">
                            Archive product?
                        </h2>
                        <p id="delete-product-description" className="mt-2 text-sm text-gray-600">
                            Archive <strong>{productToDelete.name}</strong> from Product Management and checkout? Its inventory and sales history will
                            be preserved.
                        </p>
                        {error && (
                            <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                {error}
                            </p>
                        )}
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => {
                                    setProductToDelete(null);
                                    setError('');
                                }}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={busy}
                                onClick={() => void deleteProduct()}
                                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                                {busy ? 'Archiving...' : 'Archive'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}

function VariantFields({
    form,
    setForm,
    input,
    label,
    allowStock,
    skuPrefix,
}: {
    form: VariantInput;
    setForm: Dispatch<SetStateAction<VariantInput>>;
    input: string;
    label: string;
    allowStock: boolean;
    skuPrefix: string | null;
}) {
    const field = (key: keyof VariantInput) => (value: string) => setForm((s) => ({ ...s, [key]: value }));
    const generatedSku = skuPrefix === null ? null : generateVariantSku(skuPrefix, form.size, form.color);
    return (
        <div className="grid grid-cols-2 gap-3">
            <div>
                <label className={label}>SKU *</label>
                <input
                    required
                    readOnly={generatedSku !== null}
                    maxLength={255}
                    className={`${input} ${generatedSku !== null ? 'bg-gray-50 font-mono' : ''}`}
                    value={generatedSku ?? form.sku}
                    onChange={(e) => field('sku')(e.target.value)}
                    placeholder={generatedSku === '' ? 'Enter a size and color to generate' : undefined}
                />
            </div>
            <div>
                <label className={label}>Size *</label>
                <input
                    required
                    list="product-size-options"
                    maxLength={255}
                    className={input}
                    value={form.size}
                    onChange={(e) => field('size')(e.target.value)}
                    placeholder="e.g. M, 32, or 38"
                />
            </div>
            <div>
                <label className={label}>Color *</label>
                <input required className={input} value={form.color} onChange={(e) => field('color')(e.target.value)} placeholder="Black" />
            </div>
            <div>
                <label className={label}>Price (PHP) *</label>
                <input
                    required
                    type="number"
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    className={input}
                    value={form.price}
                    onChange={(e) => field('price')(e.target.value)}
                />
            </div>
            {allowStock && (
                <div>
                    <label className={label}>Initial Stock *</label>
                    <input
                        required
                        type="number"
                        min="0"
                        step="1"
                        className={input}
                        value={form.stock_quantity}
                        onChange={(e) => field('stock_quantity')(e.target.value)}
                    />
                </div>
            )}
            <div>
                <label className={label}>Reorder Level *</label>
                <input
                    required
                    type="number"
                    min="0"
                    step="1"
                    className={input}
                    value={form.reorder_level}
                    onChange={(e) => field('reorder_level')(e.target.value)}
                />
            </div>
        </div>
    );
}
