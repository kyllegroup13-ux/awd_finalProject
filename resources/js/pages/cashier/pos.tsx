
import { Head, Link } from '@inertiajs/react';
import { useMemo, useState, useEffect, useRef } from 'react';
import {
    Minus,
    Plus,
    Search,
    ShoppingCart,
    Trash2,
    Wallet,
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
    reference_number: string | null;
    idempotency_key: string;
};

export default function CashierPOS() {
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethod, setPaymentMethod] =
        useState<'cash' | 'gcash'>('cash');
    const [amountReceived, setAmountReceived] = useState('');
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

    const change = Math.max(
        0,
        Number(amountReceived || 0) - subtotal
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

        const total = subtotal.toFixed(2);

        if (paymentMethod === 'cash') {
            if (
                !amountReceived.trim() ||
                !Number.isFinite(Number(amountReceived)) ||
                Number(amountReceived) < subtotal
            ) {
                setError('Cash received must cover the total amount.');
                return;
            }
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
            <Head title="Cashier POS" />

            <div className="min-h-screen bg-background p-6 text-foreground">
                <div className="mx-auto max-w-7xl space-y-6">
                    <header className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold">
                                M3 Dry Goods
                            </h1>
                            <p className="text-muted-foreground">
                                Cashier Point of Sale
                            </p>
                        </div>
                        <Link
                            href="/cashier/sales"
                            className="inline-flex items-center justify-center rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                            Sales History
                        </Link>
                    </header>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <section className="space-y-4 lg:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products or SKU..."
                                    className="w-full rounded-lg border bg-background py-3 pl-11 pr-4"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {filteredProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="rounded-xl border bg-card p-4"
                                    >
                                        <h2 className="mb-3 font-semibold">
                                            {product.name}
                                        </h2>

                                        <div className="space-y-2">
                                            {product.variants.map((variant) => (
                                                <div
                                                    key={variant.id}
                                                    className="flex items-center justify-between gap-2 rounded-lg border p-3"
                                                >
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {variant.size} / {variant.color}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {variant.sku}
                                                        </p>
                                                        <p className="font-semibold">
                                                            {money(Number(variant.price))}
                                                        </p>
                                                        <p className="text-xs">
                                                            Stock: {variant.stock_quantity}
                                                        </p>
                                                    </div>

                                                    <button
                                                        onClick={() =>
                                                            addToCart(product, variant)
                                                        }
                                                        disabled={variant.stock_quantity <= 0}
                                                        className="rounded-lg bg-primary p-2 text-primary-foreground disabled:opacity-50"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {products.length === 0 && (
                                <div className="rounded-xl border p-10 text-center text-muted-foreground">
                                    Product catalog is not loaded yet.
                                </div>
                            )}
                        </section>

                        <aside className="space-y-5 rounded-xl border bg-card p-5">
                            <div className="flex items-center gap-2">
                                <ShoppingCart size={22} />
                                <h2 className="text-xl font-bold">
                                    Shopping Cart
                                </h2>
                            </div>

                            {cart.length === 0 ? (
                                <p className="py-8 text-center text-muted-foreground">
                                    No items added yet.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {cart.map((item) => (
                                        <div
                                            key={item.variantId}
                                            className="space-y-2 border-b pb-4"
                                        >
                                            <div className="flex justify-between gap-2">
                                                <div>
                                                    <p className="font-medium">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {item.size} / {item.color}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={() =>
                                                        removeFromCart(item.variantId)
                                                    }
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 size={17} />
                                                </button>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(item.variantId, -1)
                                                        }
                                                        aria-label="Decrease quantity"
                                                    >
                                                        <Minus size={16} />
                                                    </button>

                                                    <span>{item.quantity}</span>

                                                    <button
                                                        onClick={() =>
                                                            updateQuantity(item.variantId, 1)
                                                        }
                                                        disabled={item.quantity >= item.stock}
                                                        aria-label="Increase quantity"
                                                    >
                                                        <Plus size={16} />
                                                    </button>
                                                </div>

                                                <span className="font-semibold">
                                                    {money(item.price * item.quantity)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="flex justify-between border-t pt-4 text-lg font-bold">
                                <span>Total</span>
                                <span>{money(subtotal)}</span>
                            </div>

                            <div className="space-y-3">
                                <h3 className="flex items-center gap-2 font-semibold">
                                    <Wallet size={18} />
                                    Payment Method
                                </h3>

                                <div className="grid grid-cols-2 gap-2">
                                    {(['cash', 'gcash'] as const).map((method) => (
                                        <button
                                            key={method}
                                            onClick={() => setPaymentMethod(method)}
                                            className={`rounded-lg border p-3 ${paymentMethod === method
                                                ? 'border-primary bg-primary/10 font-semibold'
                                                : ''
                                                }`}
                                        >
                                            {method === 'cash' ? 'Cash' : 'GCash'}
                                        </button>
                                    ))}
                                </div>

                                {paymentMethod === 'cash' ? (
                                    <>
                                        <label className="block text-sm">
                                            Cash Received
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={amountReceived}
                                            onChange={(e) =>
                                                setAmountReceived(e.target.value)
                                            }
                                            className="w-full rounded-lg border bg-background p-3"
                                            placeholder="0.00"
                                        />

                                        <div className="flex justify-between">
                                            <span>Change</span>
                                            <strong>{money(change)}</strong>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <label className="block text-sm">
                                            GCash Reference Number
                                        </label>
                                        <input
                                            value={gcashReference}
                                            onChange={(e) =>
                                                setGcashReference(e.target.value)
                                            }
                                            className="w-full rounded-lg border bg-background p-3"
                                            placeholder="Enter reference number"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Verify payment manually before completing checkout.
                                        </p>
                                    </>
                                )}
                            </div>

                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            {success && (
                                <div
                                    role="status"
                                    className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-600 dark:text-green-400"
                                >
                                    <p className="font-semibold">{success}</p>
                                    {lastReceipt && (
                                        <p className="mt-1">Receipt Number: {lastReceipt}</p>
                                    )}
                                </div>
                            )}


                            {hasPendingCheckout && (
                                <div className="space-y-2 rounded-lg border p-4">
                                    <p className="text-sm font-medium">
                                        A previous checkout needs confirmation.
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Retry the saved transaction using its original
                                        details. Do not collect payment again.
                                    </p>

                                    <button
                                        type="button"
                                        disabled={loading}
                                        onClick={retryPendingCheckout}
                                        className="w-full rounded-lg border border-primary px-4 py-3 font-semibold text-primary disabled:opacity-50"
                                    >
                                        {loading
                                            ? 'Confirming Checkout...'
                                            : 'Retry Pending Checkout'}
                                    </button>

                                    <Link
                                        href="/cashier/sales"
                                        className="block text-center text-sm underline"
                                    >
                                        Check Sales History
                                    </Link>
                                </div>
                            )}


                            <button
                                type="button"
                                disabled={
                                    loading ||
                                    hasPendingCheckout ||
                                    cart.length === 0 ||
                                    (paymentMethod === 'cash' &&
                                        (!amountReceived ||
                                            !Number.isFinite(Number(amountReceived)) ||
                                            Number(amountReceived) < subtotal)) ||
                                    (paymentMethod === 'gcash' && !gcashReference.trim())
                                }
                                onClick={completeSale}
                                className="w-full rounded-lg bg-primary py-3 font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading ? 'Processing Sale...' : 'Complete Sale'}
                            </button>

                        </aside>
                    </div>
                </div>
            </div>
        </>
    );
}
