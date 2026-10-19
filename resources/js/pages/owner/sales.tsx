
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';

type Cashier = {
    id: number;
    name: string;
};

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
    cashier: Cashier | null;
    subtotal: string;
    discount: string;
    total_amount: string;
    status: string;
    created_at: string;
    payment: Payment | null;
};

type PaginatedSales = {
    data: Sale[];
    current_page: number;
    last_page: number;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
};

type Props = {
    sales: PaginatedSales;
};

const peso = (value: string | number) =>
    new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
    }).format(Number(value));

const breadcrumbs = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Sales Records', href: '/owner/sales' },
];

export default function OwnerSales({ sales }: Props) {
    const [query, setQuery] = useState('');
    const [method, setMethod] = useState('all');

    const filtered = sales.data.filter((sale) => {
        const matchesSearch =
            sale.receipt_number
                .toLowerCase()
                .includes(query.toLowerCase()) ||
            (sale.cashier?.name ?? '')
                .toLowerCase()
                .includes(query.toLowerCase());

        const matchesMethod =
            method === 'all' ||
            sale.payment?.payment_method === method;

        return matchesSearch && matchesMethod;
    });

    function navigate(url: string | null) {
        if (url) {
            router.get(url, {}, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Owner Sales Records" />

            <div className="flex flex-col gap-6 p-4 md:p-6">
                <header className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold">
                            Sales Records
                        </h1>
                        <p className="text-muted-foreground">
                            View completed transactions from all cashiers.
                        </p>
                    </div>

                    <Link
                        href="/dashboard"
                        className="rounded-lg border px-4 py-2 hover:bg-muted"
                    >
                        Back to Dashboard
                    </Link>
                </header>

                <section className="space-y-4 rounded-xl border bg-card p-5">
                    <div className="flex flex-wrap gap-3">
                        <input
                            aria-label="Search sales"
                            value={query}
                            onChange={(event) =>
                                setQuery(event.target.value)
                            }
                            placeholder="Search receipt or cashier on this page"
                            className="min-w-56 flex-1 rounded-lg border bg-background px-3 py-2"
                        />

                        <select
                            aria-label="Payment method"
                            value={method}
                            onChange={(event) =>
                                setMethod(event.target.value)
                            }
                            className="rounded-lg border bg-background px-3 py-2"
                        >
                            <option value="all">All payments</option>
                            <option value="cash">Cash</option>
                            <option value="gcash">GCash</option>
                        </select>
                    </div>

                    <p className="text-sm text-muted-foreground">
                        {sales.total} completed transactions.
                        Search and payment filters apply to the current page only.
                    </p>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="py-3 pr-4">Receipt</th>
                                    <th className="py-3 pr-4">Date</th>
                                    <th className="py-3 pr-4">Cashier</th>
                                    <th className="py-3 pr-4">Payment</th>
                                    <th className="py-3 pr-4">Total</th>
                                    <th className="py-3 pr-4">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {filtered.map((sale) => (
                                    <tr
                                        key={sale.id}
                                        className="border-b"
                                    >
                                        <td className="py-3 pr-4 font-medium">
                                            {sale.receipt_number}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {new Date(
                                                sale.created_at,
                                            ).toLocaleString('en-PH')}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {sale.cashier?.name ??
                                                `Cashier #${sale.cashier_id}`}
                                        </td>
                                        <td className="py-3 pr-4 uppercase">
                                            {sale.payment?.payment_method ??
                                                '—'}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {peso(sale.total_amount)}
                                        </td>
                                        <td className="py-3 pr-4 capitalize">
                                            {sale.status}
                                        </td>
                                    </tr>
                                ))}

                                {filtered.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No matching sales on this page.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                        <button
                            type="button"
                            disabled={!sales.prev_page_url}
                            onClick={() =>
                                navigate(sales.prev_page_url)
                            }
                            className="rounded-lg border px-3 py-2 disabled:opacity-40"
                        >
                            Previous
                        </button>

                        <span className="text-sm">
                            Page {sales.current_page} of {sales.last_page}
                        </span>

                        <button
                            type="button"
                            disabled={!sales.next_page_url}
                            onClick={() =>
                                navigate(sales.next_page_url)
                            }
                            className="rounded-lg border px-3 py-2 disabled:opacity-40"
                        >
                            Next
                        </button>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
