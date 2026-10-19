import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

type Payment = { payment_method: string; amount_received: string; amount_paid: string; change_amount: string; reference_number: string | null };
type SaleItem = { id: number; product_name: string; sku: string; size: string | null; color: string | null; quantity: number; unit_price: string; subtotal: string };
type Sale = { id: number; receipt_number: string; cashier_id: number; subtotal: string; discount: string; total_amount: string; status: string; created_at: string; items?: SaleItem[]; payment: Payment | null };
type PageData = { data: Sale[]; current_page: number; last_page: number; total: number };

const peso = (value: string | number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(value));

export default function CashierSales() {
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
                const response = await fetch(`/api/cashier/sales?page=${page}`, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: controller.signal });
                if (!response.ok) throw new Error(`Could not load sales (${response.status}).`);
                const result: PageData = await response.json();
                setSales(result.data);
                setLastPage(result.last_page);
                setTotal(result.total);
            } catch (e) {
                if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Unable to load sales.');
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        }
        void load();
        return () => controller.abort();
    }, [page]);

    async function viewDetails(id: number) {
        setDetailLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/cashier/sales/${id}`, { credentials: 'same-origin', headers: { Accept: 'application/json' } });
            if (!response.ok) throw new Error(`Could not load sale details (${response.status}).`);
            setSelected((await response.json()) as Sale);
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Unable to load sale details.');
        } finally {
            setDetailLoading(false);
        }
    }

    const filtered = sales.filter(s => (s.receipt_number.toLowerCase().includes(query.toLowerCase())) && (method === 'all' || s.payment?.payment_method === method));

    return (
        <>
            <Head title="Cashier Sales History" />
            <main className="min-h-screen bg-background p-6 text-foreground">
                <div className="mx-auto max-w-6xl space-y-6">
                    <header className="flex flex-wrap items-center justify-between gap-4">
                        <div><h1 className="text-3xl font-bold">Sales History</h1><p className="text-muted-foreground">Review your completed transactions</p></div>
                        <Link href="/cashier/pos" className="rounded-lg border px-4 py-2 hover:bg-muted">Back to POS</Link>
                    </header>
                    <section className="rounded-xl border bg-card p-5 space-y-4">
                        <div className="flex flex-wrap gap-3">
                            <input aria-label="Search receipt" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search receipt number on this page" className="min-w-56 flex-1 rounded-lg border bg-background px-3 py-2" />
                            <select aria-label="Payment method" value={method} onChange={e => setMethod(e.target.value)} className="rounded-lg border bg-background px-3 py-2"><option value="all">All payments</option><option value="cash">Cash</option><option value="gcash">GCash</option></select>
                        </div>
                        <p className="text-sm text-muted-foreground">{total} total transactions. Search and payment filters apply to the current page only.</p>
                        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                        {loading ? <p>Loading sales...</p> : (
                            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="py-3 pr-4">Receipt</th><th className="py-3 pr-4">Date</th><th className="py-3 pr-4">Payment</th><th className="py-3 pr-4">Total</th><th className="py-3 pr-4">Status</th><th className="py-3">Action</th></tr></thead><tbody>
                                {filtered.map(s => <tr key={s.id} className="border-b"><td className="py-3 pr-4 font-medium">{s.receipt_number}</td><td className="py-3 pr-4">{new Date(s.created_at).toLocaleString('en-PH')}</td><td className="py-3 pr-4 uppercase">{s.payment?.payment_method ?? '—'}</td><td className="py-3 pr-4">{peso(s.total_amount)}</td><td className="py-3 pr-4 capitalize">{s.status}</td><td className="py-3"><button disabled={detailLoading} onClick={() => void viewDetails(s.id)} className="rounded-lg border px-3 py-1 hover:bg-muted disabled:opacity-50">View details</button></td></tr>)}
                                {filtered.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No matching sales on this page.</td></tr>}
                            </tbody></table></div>
                        )}
                        <div className="flex items-center justify-between"><button disabled={loading || page <= 1} onClick={() => setPage(p => p - 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Previous</button><span className="text-sm">Page {page} of {lastPage}</span><button disabled={loading || page >= lastPage} onClick={() => setPage(p => p + 1)} className="rounded-lg border px-3 py-2 disabled:opacity-40">Next</button></div>
                    </section>
                    {selected && <section className="rounded-xl border bg-card p-5 space-y-4"><div className="flex justify-between gap-4"><div><h2 className="text-xl font-semibold">{selected.receipt_number}</h2><p className="text-sm text-muted-foreground">{new Date(selected.created_at).toLocaleString('en-PH')}</p></div><button onClick={() => setSelected(null)} className="rounded-lg border px-3 py-1">Close</button></div><div className="space-y-2">{selected.items?.map(item => <div key={item.id} className="flex justify-between gap-4 border-b pb-2"><div><p className="font-medium">{item.product_name}</p><p className="text-sm text-muted-foreground">{item.sku} · {item.size ?? '—'} / {item.color ?? '—'} · {item.quantity} × {peso(item.unit_price)}</p></div><span>{peso(item.subtotal)}</span></div>)}</div><div className="space-y-1 text-sm"><p>Subtotal: {peso(selected.subtotal)}</p><p>Discount: {peso(selected.discount)}</p><p className="text-lg font-bold">Total: {peso(selected.total_amount)}</p><p>Payment: {selected.payment?.payment_method.toUpperCase() ?? '—'}</p><p>Received: {selected.payment ? peso(selected.payment.amount_received) : '—'}</p><p>Change: {selected.payment ? peso(selected.payment.change_amount) : '—'}</p>{selected.payment?.reference_number && <p>GCash reference: {selected.payment.reference_number}</p>}</div></section>}
                </div>
            </main>
        </>
    );
}
