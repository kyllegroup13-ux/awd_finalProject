
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState, useEffect, useRef } from 'react';

import { CashierSidebar } from '@/components/cashier-sidebar';
import {
    Minus,
    Plus,
    Search,
    ShoppingBag,
    CreditCard,
    Trash2,
    Wallet,
    ArrowLeft,
} from 'lucide-react';

type ProductVariant = {
    id: number;
    sku: string;
    size: string | null;
    color: string | null;
    price: string | number;
    stock_quantity: number;
};

type Product = {
    id: number;
    name: string;
    status: string;
    image?: string | null;
    variants: ProductVariant[];
};

type CartItem = {
    variantId: number;
    name: string;
    sku: string;
    size: string | null;
    color: string | null;
    price: number;
    stock: number;
    quantity: number;
};

type CheckoutPayload = {
    items: {
        product_variant_id: number;
        quantity: number;
    }[];
    payment_method: 'cash' | 'gcash';
    amount_received: string;
    discount: string;
    reference_number: string | null;
    idempotency_key: string;
};

export default function CashierPOS() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedVariantIds, setSelectedVariantIds] = useState<Record<number, number>>({});
    const [paymentMethod, setPaymentMethod] =
        useState<'cash' | 'gcash'>('cash');
    const [amountReceived, setAmountReceived] = useState('');
    const [bargainedPrice, setBargainedPrice] = useState('');
    const [gcashReference, setGcashReference] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const checkoutInProgress = useRef(false);
    const pendingCheckout = useRef<CheckoutPayload | null>(null);
    const [hasPendingCheckout, setHasPendingCheckout] = useState(false);
    const [success, setSuccess] = useState('');
    const [lastReceipt, setLastReceipt] = useState('');


    useEffect(() => {
        const controller = new AbortController();

        async function loadProducts() {
            try {
                const response = await fetch('/api/cashier/products', {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });

                console.log('Product API status:', response.status);

                if (!response.ok) {
                    const body = await response.text();
                    console.error('Product API response:', body);
                    throw new Error(`Failed to load products (${response.status})`);
                }

                const data: Product[] = await response.json();
                console.log('Products loaded:', data);

                setProducts(data);
            } catch (err) {
                if (controller.signal.aborted) return;

                console.error('Product loading error:', err);
                setError('Unable to load products. Check the browser console.');
            }
        }

        loadProducts();

        return () => controller.abort();
    }, []);

    useEffect(() => {
        const saved = sessionStorage.getItem('m3_pending_checkout');

        if (!saved) return;

        try {
            const parsed = JSON.parse(saved) as CheckoutPayload;

            if (
                typeof parsed.idempotency_key === 'string' &&
                Array.isArray(parsed.items)
            ) {
                pendingCheckout.current = parsed;
                setHasPendingCheckout(true);
                setError(
                    'An earlier checkout may still be pending. ' +
                    'Check Sales History before starting another sale.'
                );
            }
        } catch {
            setError(
                'A saved checkout could not be restored. ' +
                'Check Sales History before continuing.'
            );
        }
    }, []);

    const money = (value: number) =>
        new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(value);

    const subtotal = useMemo(
        () => cart.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0
        ),
        [cart]
    );

    const discountAmount = useMemo(() => {
        if (!bargainedPrice.trim()) {
            return 0;
        }

        const finalPrice = Number(bargainedPrice);

        if (
            !Number.isFinite(finalPrice) ||
            finalPrice < 0 ||
            finalPrice > subtotal
        ) {
            return 0;
        }

        return Math.max(0, subtotal - finalPrice);
    }, [bargainedPrice, subtotal]);

    const totalDue = Math.max(0, subtotal - discountAmount);

    const change = Math.max(
        0,
        Number(amountReceived || 0) - totalDue
    );

    const filteredProducts = products.filter((product) =>
        product.status === 'Active' &&
        (
            product.name.toLowerCase().includes(search.toLowerCase()) ||
            product.variants.some((variant) =>
                variant.sku.toLowerCase().includes(search.toLowerCase())
            )
        )
    );

    const addToCart = (product: Product, variant: ProductVariant) => {
        if (variant.stock_quantity <= 0) return;

        setCart((current) => {
            const existing = current.find(
                (item) => item.variantId === variant.id
            );

            if (existing) {
                return current.map((item) =>
                    item.variantId === variant.id
                        ? {
                            ...item,
                            quantity: Math.min(
                                item.quantity + 1,
                                item.stock
                            ),
                        }
                        : item
                );
            }

            return [
                ...current,
                {
                    variantId: variant.id,
                    name: product.name,
                    sku: variant.sku,
                    size: variant.size,
                    color: variant.color,
                    price: Number(variant.price),
                    stock: variant.stock_quantity,
                    quantity: 1,
                },
            ];
        });
    };

    const updateQuantity = (variantId: number, delta: number) => {
        setCart((current) =>
            current
                .map((item) =>
                    item.variantId === variantId
                        ? {
                            ...item,
                            quantity: Math.min(
                                item.stock,
                                item.quantity + delta
                            ),
                        }
                        : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const removeFromCart = (variantId: number) => {
        setCart((current) =>
            current.filter((item) => item.variantId !== variantId)
        );
    };


    const completeSale = async () => {
        if (checkoutInProgress.current || cart.length === 0) return;

        setError('');
        setSuccess('');

        const total = totalDue.toFixed(2);

        if (paymentMethod === 'cash') {
            if (
                !amountReceived.trim() ||
                !Number.isFinite(Number(amountReceived)) ||
                Number(amountReceived) < totalDue
            ) {
                setError('Cash received must cover the total amount.');
                return;
            }
        }

        if (bargainedPrice && (Number(bargainedPrice) < 0 || Number(bargainedPrice) > subtotal)) {
            setError('The bargained price must be between ₱0.00 and the sale subtotal.');
            return;
        }

        if (paymentMethod === 'gcash' && !gcashReference.trim()) {
            setError('Please enter the GCash reference number.');
            return;
        }

        if (paymentMethod === 'gcash') {
            const confirmed = window.confirm(
                'Have you verified the GCash payment was received?'
            );

            if (!confirmed) return;
        }

        // Never reuse an existing key for a different transaction.
        if (
            pendingCheckout.current ||
            sessionStorage.getItem('m3_pending_checkout')
        ) {
            setError(
                'A previous checkout needs to be resolved first. ' +
                'Check Sales History before starting another sale.'
            );
            return;
        }

        const payload: CheckoutPayload = {
            idempotency_key: crypto.randomUUID(),
            items: cart.map((item) => ({
                product_variant_id: item.variantId,
                quantity: item.quantity,
            })),
            payment_method: paymentMethod,
            amount_received:
                paymentMethod === 'cash'
                    ? Number(amountReceived).toFixed(2)
                    : total,
            discount: discountAmount.toFixed(2),
            reference_number:
                paymentMethod === 'gcash'
                    ? gcashReference.trim()
                    : null,
        };

        // Save the exact payload before sending it to Laravel.
        try {
            sessionStorage.setItem(
                'm3_pending_checkout',
                JSON.stringify(payload)
            );
            pendingCheckout.current = payload;
            setHasPendingCheckout(true);
        } catch {
            setError(
                'Checkout could not be saved safely. ' +
                'Please enable browser storage before proceeding.'
            );
            return;
        }

        checkoutInProgress.current = true;
        setLoading(true);

        try {
            const csrfCookie = document.cookie
                .split('; ')
                .find((cookie) => cookie.startsWith('XSRF-TOKEN='));

            const csrfToken = csrfCookie
                ? decodeURIComponent(
                    csrfCookie.substring('XSRF-TOKEN='.length)
                )
                : '';

            const response = await fetch('/api/cashier/checkout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken
                        ? { 'X-XSRF-TOKEN': csrfToken }
                        : {}),
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();


            if (!response.ok) {
                if (response.status === 422) {
                    const firstError = result.errors
                        ? Object.values(result.errors)
                            .flat()
                            .find((message) => typeof message === 'string')
                        : null;

                    // Laravel rejected the request before completing a sale.
                    // The cashier may correct the transaction and try again.
                    sessionStorage.removeItem('m3_pending_checkout');
                    pendingCheckout.current = null;
                    setHasPendingCheckout(false);

                    throw new Error(
                        typeof firstError === 'string'
                            ? firstError
                            : result.message || 'Please check the checkout details.'
                    );
                }

                // Other failures remain pending until resolved.
                throw new Error(
                    result.message ||
                    `Checkout failed (${response.status}).`
                );
            }


            const receipt = result.sale?.receipt_number;

            if (!receipt) {
                throw new Error(
                    'The server response did not include a receipt. ' +
                    'Check Sales History before retrying.'
                );
            }

            // Sale confirmed. The pending transaction can be cleared.
            sessionStorage.removeItem('m3_pending_checkout');
            pendingCheckout.current = null;
            setHasPendingCheckout(false);

            setLastReceipt(receipt);
            setSuccess(
                `Sale completed successfully! Receipt: ${receipt}`
            );

            setCart([]);
            setAmountReceived('');
            setBargainedPrice('');
            setGcashReference('');

            try {
                const productsResponse = await fetch(
                    '/api/cashier/products',
                    {
                        credentials: 'same-origin',
                        headers: {
                            Accept: 'application/json',
                        },
                    }
                );

                if (productsResponse.ok) {
                    const updatedProducts: Product[] =
                        await productsResponse.json();

                    setProducts(updatedProducts);
                } else {
                    setError(
                        'Sale saved, but stock could not be refreshed. ' +
                        'Reload the page.'
                    );
                }
            } catch {
                setError(
                    'Sale saved, but stock could not be refreshed. ' +
                    'Reload the page.'
                );
            }
        } catch (err) {
            setError(
                (err instanceof Error
                    ? err.message
                    : 'Checkout could not be confirmed.') +
                ' Check Sales History before starting another sale.'
            );
        } finally {
            checkoutInProgress.current = false;
            setLoading(false);
        }
    };


    const retryPendingCheckout = async () => {
        if (checkoutInProgress.current) return;

        const saved = sessionStorage.getItem('m3_pending_checkout');

        if (!saved) {
            setError('No saved checkout was found.');
            return;
        }

        let payload: CheckoutPayload;

        try {
            payload = JSON.parse(saved) as CheckoutPayload;

            if (
                typeof payload.idempotency_key !== 'string' ||
                !Array.isArray(payload.items)
            ) {
                throw new Error('Invalid saved checkout.');
            }
        } catch {
            setError(
                'The saved checkout is invalid. Check Sales History ' +
                'before attempting another sale.'
            );
            return;
        }

        checkoutInProgress.current = true;
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const csrfCookie = document.cookie
                .split('; ')
                .find((cookie) => cookie.startsWith('XSRF-TOKEN='));

            const csrfToken = csrfCookie
                ? decodeURIComponent(
                    csrfCookie.substring('XSRF-TOKEN='.length)
                )
                : '';

            const response = await fetch('/api/cashier/checkout', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken
                        ? { 'X-XSRF-TOKEN': csrfToken }
                        : {}),
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();


            if (!response.ok) {
                if (response.status === 422) {
                    const firstError = result.errors
                        ? Object.values(result.errors)
                            .flat()
                            .find((message) => typeof message === 'string')
                        : null;

                    // Laravel explicitly rejected the checkout.
                    // Allow the cashier to correct the transaction.
                    sessionStorage.removeItem('m3_pending_checkout');
                    pendingCheckout.current = null;
                    setHasPendingCheckout(false);

                    throw new Error(
                        typeof firstError === 'string'
                            ? firstError
                            : result.message ||
                            'Please check the checkout details.'
                    );
                }

                // Preserve pending checkout for uncertain outcomes.
                throw new Error(
                    result.message ||
                    `Checkout retry failed (${response.status}).`
                );
            }


            const receipt = result.sale?.receipt_number;

            if (!receipt) {
                throw new Error(
                    'The response did not contain a receipt number.'
                );
            }

            // Laravel confirmed the sale or returned the existing sale.
            sessionStorage.removeItem('m3_pending_checkout');
            pendingCheckout.current = null;
            setHasPendingCheckout(false);

            setLastReceipt(receipt);
            setSuccess(
                `Checkout confirmed! Receipt: ${receipt}`
            );

            setCart([]);
            setAmountReceived('');
            setBargainedPrice('');
            setGcashReference('');

            // Refresh stock after confirming the sale.
            try {
                const productsResponse = await fetch(
                    '/api/cashier/products',
                    {
                        credentials: 'same-origin',
                        headers: {
                            Accept: 'application/json',
                        },
                    }
                );

                if (productsResponse.ok) {
                    const updatedProducts: Product[] =
                        await productsResponse.json();

                    setProducts(updatedProducts);
                } else {
                    setError(
                        'Sale confirmed, but stock could not be refreshed. ' +
                        'Reload the page.'
                    );
                }
            } catch {
                setError(
                    'Sale confirmed, but stock could not be refreshed. ' +
                    'Reload the page.'
                );
            }
        } catch (err) {
            setError(
                (err instanceof Error
                    ? err.message
                    : 'Unable to confirm checkout.') +
                ' The saved checkout has been preserved.'
            );
        } finally {
            checkoutInProgress.current = false;
            setLoading(false);
        }
    };




    return (
        <>
            <Head title="New Transaction | M3 Dry Goods" />
            <div className="min-h-screen bg-[#F5F5F5] text-[#202020] md:flex">
                <CashierSidebar />

                <div className="min-w-0 flex-1 px-4 py-6 sm:px-7 lg:px-9">
                    <div className="mx-auto max-w-[1500px]">
                        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
                            <Link href="/cashier/sales" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600">
                                <ArrowLeft className="size-4" /> Dashboard
                            </Link>
                            <h1 className="text-lg font-extrabold">New Transaction</h1>
                            <span className="text-xs text-gray-500">M3 Dry Goods · Cashier POS</span>
                        </header>

                        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(370px,1fr)]">
                            <section className="min-w-0">
                            <div className="relative mb-4">
                                <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search Products or SKU..."
                                    aria-label="Search products or SKU"
                                    className="h-12 w-full rounded-lg border-2 border-[#D0D0D0] bg-white pl-12 pr-4 text-sm outline-none focus:border-blue-400"
                                />
                            </div>
                            <div className="mb-4 flex flex-wrap gap-2">
                                <span className="rounded-lg bg-[#D8D8D8] px-5 py-3 text-xs font-bold">All Items</span>
                                <span className="self-center text-xs text-gray-500">Choose a size and color, then add the product to the sale</span>
                            </div>

                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                                {filteredProducts.map((product) => {
                                    const availableVariants = product.variants.filter(
                                        (variant) => variant.stock_quantity > 0
                                    );
                                    const variant =
                                        product.variants.find(
                                            (item) =>
                                                item.id === selectedVariantIds[product.id] &&
                                                item.stock_quantity > 0
                                        ) ??
                                        availableVariants[0] ??
                                        product.variants[0];

                                    if (!variant) {
                                        return null;
                                    }

                                    const sizes = [...new Set(
                                        availableVariants.map((item) => item.size)
                                    )];
                                    const colorVariants = availableVariants.filter(
                                        (item) => item.size === variant.size
                                    );
                                    const colors = [...new Set(
                                        colorVariants.map((item) => item.color)
                                    )];
                                    const stock = variant.stock_quantity;
                                    const cartQuantity = cart.find((item) => item.variantId === variant.id)?.quantity ?? 0;
                                    const unavailable = stock <= 0 || cartQuantity >= stock || loading || hasPendingCheckout;
                                    const image = product.image
                                        ? (product.image.startsWith('http') || product.image.startsWith('/')
                                            ? product.image
                                            : `/storage/${product.image}`)
                                        : null;

                                    return (
                                        <article key={product.id} className="flex min-w-0 flex-col rounded-lg border border-[#D8D8D8] bg-white p-2 shadow-sm">
                                            <div className="mb-2 flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-[#EEEEEE]">
                                                {image ? (
                                                    <img src={image} alt={product.name} className="h-full w-full object-contain" loading="lazy" />
                                                ) : (
                                                    <ShoppingBag className="size-10 text-gray-300" aria-hidden="true" />
                                                )}
                                            </div>
                                            <h2 className="truncate text-xs font-bold" title={product.name}>{product.name}</h2>
                                            <p className="mt-0.5 text-xs font-extrabold">{money(Number(variant.price))}</p>
                                            <p className={`mt-1 text-[11px] font-semibold ${stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                {stock > 0 ? `In Stock (${stock})` : 'Out of Stock'}
                                            </p>
                                            <div className="mt-2 grid grid-cols-2 gap-2">
                                                <label className="min-w-0 text-[10px] font-semibold text-gray-600">
                                                    Size
                                                    <select
                                                        aria-label={`${product.name} size`}
                                                        value={sizes.length > 0 ? variant.size ?? '' : ''}
                                                        disabled={sizes.length === 0 || loading || hasPendingCheckout}
                                                        onChange={(event) => {
                                                            const candidates = availableVariants.filter(
                                                                (item) => (item.size ?? '') === event.target.value
                                                            );
                                                            const nextVariant =
                                                                candidates.find((item) => item.color === variant.color) ??
                                                                candidates[0];

                                                            if (nextVariant) {
                                                                setSelectedVariantIds((current) => ({
                                                                    ...current,
                                                                    [product.id]: nextVariant.id,
                                                                }));
                                                            }
                                                        }}
                                                        className="mt-1 w-full min-w-0 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-[#202020] disabled:bg-gray-100"
                                                    >
                                                        {sizes.length === 0 ? (
                                                            <option value="">No sizes in stock</option>
                                                        ) : sizes.map((size) => (
                                                            <option key={size ?? 'no-size'} value={size ?? ''}>
                                                                {size || 'No size'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                                <label className="min-w-0 text-[10px] font-semibold text-gray-600">
                                                    Color
                                                    <select
                                                        aria-label={`${product.name} color`}
                                                        value={colors.length > 0 ? variant.color ?? '' : ''}
                                                        disabled={colors.length === 0 || loading || hasPendingCheckout}
                                                        onChange={(event) => {
                                                            const nextVariant = colorVariants.find(
                                                                (item) => (item.color ?? '') === event.target.value
                                                            );

                                                            if (nextVariant) {
                                                                setSelectedVariantIds((current) => ({
                                                                    ...current,
                                                                    [product.id]: nextVariant.id,
                                                                }));
                                                            }
                                                        }}
                                                        className="mt-1 w-full min-w-0 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-[#202020] disabled:bg-gray-100"
                                                    >
                                                        {colors.length === 0 ? (
                                                            <option value="">No colors in stock</option>
                                                        ) : colors.map((color) => (
                                                            <option key={color ?? 'no-color'} value={color ?? ''}>
                                                                {color || 'No color'}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </label>
                                            </div>
                                            <div className="mt-auto flex items-center gap-1 pt-2">
                                                <span className="min-w-0 flex-1 truncate text-[10px] text-gray-500" title={variant.sku}>
                                                    SKU: {variant.sku}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => addToCart(product, variant)}
                                                    disabled={unavailable}
                                                    aria-label={`Add ${product.name}, ${variant.size ?? ''} ${variant.color ?? ''} to sale`}
                                                    className="flex size-8 items-center justify-center rounded bg-[#D8D8D8] hover:bg-[#B9B9B9] disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    <Plus className="size-4" />
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                            {products.length === 0 && (
                                <p className="mt-5 rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">No products available. Products will appear here when added by the Owner.</p>
                            )}
                            {products.length > 0 && filteredProducts.length === 0 && (
                                <p className="mt-5 text-center text-sm text-gray-500">No matching products.</p>
                            )}
                            </section>

                            <aside className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 lg:sticky lg:top-5">
                            <header className="flex items-center justify-between gap-3 bg-slate-900 px-5 py-5 text-white sm:px-6">
                                <div className="flex min-w-0 items-center gap-3">
                                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sky-300"><ShoppingBag className="size-5" /></span>
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-extrabold tracking-tight">Current Sale</h2>
                                        <p className="text-xs text-slate-300">{cart.length} {cart.length === 1 ? 'item' : 'items'} in your sale</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setCart([]); setAmountReceived(''); setBargainedPrice(''); setGcashReference(''); setError(''); }}
                                    disabled={loading || hasPendingCheckout || cart.length === 0}
                                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-red-300/40 hover:bg-red-500/15 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                                ><Trash2 className="size-3.5" />Clear</button>
                            </header>

                            <div className="space-y-5 p-4 sm:p-5">
                                <section aria-label="Sale items">
                                    <div className="mb-3 flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Order items</h3>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">{cart.reduce((count, item) => count + item.quantity, 0)} units</span>
                                    </div>
                                    <div className="max-h-[340px] space-y-2 overflow-y-auto pr-1">
                                        {cart.length === 0 ? (
                                            <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 text-center">
                                                <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm"><ShoppingBag className="size-5" /></span>
                                                <p className="text-sm font-bold text-slate-700">Your sale is empty</p>
                                                <p className="mt-1 max-w-52 text-xs leading-5 text-slate-500">Choose a product and add it to start a transaction.</p>
                                            </div>
                                        ) : cart.map((item) => (
                                            <article key={item.variantId} className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300 hover:shadow-sm">
                                                <div className="flex min-w-0 items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-bold text-slate-900" title={item.name}>{item.name}</p>
                                                        <p className="mt-0.5 truncate text-xs text-slate-500">{item.color || '—'} <span aria-hidden="true">/</span> {item.size || '—'} <span aria-hidden="true">·</span> {item.sku}</p>
                                                    </div>
                                                    <button type="button" onClick={() => removeFromCart(item.variantId)} disabled={loading || hasPendingCheckout} aria-label={`Remove ${item.name}`} title={`Remove ${item.name}`} className="flex size-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 className="size-4" /></button>
                                                </div>
                                                <div className="mt-3 flex items-center justify-between gap-3">
                                                    <div className="inline-flex h-9 items-center rounded-lg border border-slate-200 bg-slate-50 p-1">
                                                        <button type="button" onClick={() => updateQuantity(item.variantId, -1)} disabled={loading || hasPendingCheckout} aria-label={`Decrease ${item.name} quantity`} className="flex size-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-40"><Minus className="size-3.5" /></button>
                                                        <span className="min-w-8 text-center text-xs font-bold text-slate-800">{item.quantity}</span>
                                                        <button type="button" onClick={() => updateQuantity(item.variantId, 1)} disabled={loading || hasPendingCheckout || item.quantity >= item.stock} aria-label={`Increase ${item.name} quantity`} className="flex size-7 items-center justify-center rounded-md text-slate-600 transition hover:bg-white hover:text-slate-900 disabled:opacity-40"><Plus className="size-3.5" /></button>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-extrabold text-slate-900">{money(item.price * item.quantity)}</p>
                                                        <p className="text-[11px] text-slate-500">{money(item.price)} each</p>
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>

                                <section className="rounded-xl bg-slate-50 p-4" aria-label="Sale total">
                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <span>Subtotal</span><span>{money(subtotal)}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-between text-sm text-slate-500">
                                        <span>Discount</span><span>-{money(discountAmount)}</span>
                                    </div>
                                    <div className="my-3 border-t border-dashed border-slate-300" />
                                    <div className="flex items-end justify-between gap-3">
                                        <span className="text-sm font-bold text-slate-800">Total due</span>
                                        <span className="text-2xl font-black tracking-tight text-slate-950">{money(totalDue)}</span>
                                    </div>
                                </section>

                                <label className="block text-xs font-semibold text-slate-600">
                                    Bargained / discounted price
                                    <div className="mt-1.5 flex h-11 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                                        <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500">₱</span>
                                        <input
                                            type="number"
                                            min="0"
                                            max={subtotal.toFixed(2)}
                                            step="0.01"
                                            value={bargainedPrice}
                                            onChange={(e) => setBargainedPrice(e.target.value)}
                                            placeholder={money(subtotal)}
                                            className="w-full min-w-0 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none"
                                        />
                                    </div>
                                    <span className="mt-1.5 block text-[11px] font-normal text-slate-500">Optional. Enter the lower amount the customer agreed to pay.</span>
                                </label>

                                <section aria-label="Payment details">
                                    <div className="mb-2 flex items-center justify-between">
                                        <h3 className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Payment method</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button type="button" aria-pressed={paymentMethod === 'cash'} onClick={() => { setPaymentMethod('cash'); setError(''); }} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${paymentMethod === 'cash' ? 'border-amber-400 bg-amber-50 text-amber-900 ring-2 ring-amber-100' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><Wallet className="size-4" />Cash</button>
                                        <button type="button" aria-pressed={paymentMethod === 'gcash'} onClick={() => { setPaymentMethod('gcash'); setError(''); }} className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-3 text-sm font-bold transition ${paymentMethod === 'gcash' ? 'border-sky-400 bg-sky-50 text-sky-900 ring-2 ring-sky-100' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}><CreditCard className="size-4" />GCash</button>
                                    </div>
                                    {paymentMethod === 'cash' ? (
                                        <div className="mt-3 grid grid-cols-2 gap-3">
                                            <label className="block min-w-0 text-xs font-semibold text-slate-600">
                                                Amount received
                                                <div className="mt-1.5 flex h-11 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                                                    <span className="flex items-center border-r border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-500">₱</span>
                                                    <input type="number" min="0" step="0.01" value={amountReceived} onChange={(e) => setAmountReceived(e.target.value)} placeholder="0.00" className="w-full min-w-0 bg-transparent px-3 text-sm font-semibold text-slate-900 outline-none" />
                                                </div>
                                            </label>
                                            <div className="flex min-w-0 flex-col justify-center rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
                                                <span className="text-xs font-semibold text-emerald-800">Change</span>
                                                <span className="mt-1 truncate text-base font-extrabold text-emerald-950">{money(change)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="mt-3 block text-xs font-semibold text-slate-600">
                                            GCash reference number
                                            <input value={gcashReference} onChange={(e) => setGcashReference(e.target.value)} placeholder="Enter verified reference" className="mt-1.5 h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100" />
                                            <span className="mt-1.5 block text-[11px] font-normal text-slate-500">Manually verify payment before checkout.</span>
                                        </label>
                                    )}
                                </section>

                                {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-700">{error}</p>}
                                {success && (
                                    <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-xs text-green-800">
                                        <p className="font-bold">{success}</p>
                                        {lastReceipt && <p className="mt-1">Receipt: {lastReceipt}</p>}
                                        <Link href="/cashier/sales" className="mt-2 inline-block font-bold underline">Back to Dashboard</Link>
                                    </div>
                                )}
                                {hasPendingCheckout && (
                                    <div className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
                                        <p className="font-bold">An earlier checkout needs confirmation.</p>
                                        <p>Check Sales History before trying again. Do not collect payment twice.</p>
                                        <button type="button" onClick={retryPendingCheckout} disabled={loading} className="block w-full rounded-lg bg-amber-200 p-2.5 font-bold transition hover:bg-amber-300 disabled:opacity-50">{loading ? 'Confirming...' : 'Retry Saved Checkout'}</button>
                                        <Link href="/cashier/sales-history" className="block text-center underline">Check Sales History</Link>
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={completeSale}
                                    disabled={loading || hasPendingCheckout || cart.length === 0 || (paymentMethod === 'cash' && (!amountReceived || !Number.isFinite(Number(amountReceived)) || Number(amountReceived) < totalDue)) || (paymentMethod === 'gcash' && !gcashReference.trim()) || (!!bargainedPrice && (Number(bargainedPrice) < 0 || Number(bargainedPrice) > subtotal))}
                                    className="w-full rounded-xl bg-sky-600 px-4 py-3.5 text-sm font-extrabold text-white shadow-sm shadow-sky-200 transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                                >
                                    {loading ? 'Processing Transaction...' : 'Complete Transaction'}
                                </button>
                            </div>
                            </aside>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
