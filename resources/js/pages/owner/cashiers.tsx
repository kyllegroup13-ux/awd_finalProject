import { Head, router, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { LoaderCircle, Plus, Users } from 'lucide-react';
import { useState, type FormEvent } from 'react';

type Cashier = {
    id: number;
    name: string;
    email: string;
    status: 'Active' | 'Inactive';
    created_at: string | null;
};

type PageProps = {
    cashiers: Cashier[];
    flash?: {
        success?: string;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Cashier Management', href: '/owner/cashiers' },
];

export default function CashierManagement() {
    const { cashiers, flash } = usePage<PageProps>().props;
    const [showForm, setShowForm] = useState(false);

    const {
        data,
        setData,
        post,
        processing,
        errors,
        reset,
    } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post('/owner/cashiers', {
            preserveScroll: true,
            onSuccess: () => {
                reset();
                setShowForm(false);
            },
            onError: () => {
                reset('password', 'password_confirmation');
            },
        });
    }


    function changeStatus(cashier: Cashier) {
        const nextStatus =
            cashier.status === 'Active' ? 'Inactive' : 'Active';

        const confirmed = window.confirm(
            `Are you sure you want to ${nextStatus === 'Active' ? 'activate' : 'deactivate'} ${cashier.name}?`
        );

        if (!confirmed) return;

        router.patch(
            `/owner/cashiers/${cashier.id}/status`,
            { status: nextStatus },
            {
                preserveScroll: true,
            }
        );
    }


    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cashier Management" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">
                            Cashier Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Manage Cashier accounts for M3 Dry Goods.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowForm(!showForm)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                        <Plus size={18} />
                        {showForm ? 'Close Form' : 'Add Cashier'}
                    </button>
                </div>

                {flash?.success && (
                    <div
                        role="status"
                        className="rounded-lg border border-green-500/40 bg-green-500/10 p-4 text-sm text-green-700 dark:text-green-400"
                    >
                        {flash.success}
                    </div>
                )}

                {showForm && (
                    <form
                        onSubmit={submit}
                        className="space-y-4 rounded-xl border bg-card p-5"
                    >
                        <h2 className="text-lg font-semibold">
                            Create Cashier Account
                        </h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label htmlFor="cashier-name" className="mb-2 block text-sm font-medium">
                                    Full Name
                                </label>
                                <input
                                    id="cashier-name"
                                    required
                                    maxLength={255}
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full rounded-lg border bg-background p-3"
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="cashier-email" className="mb-2 block text-sm font-medium">
                                    Email Address
                                </label>
                                <input
                                    id="cashier-email"
                                    type="email"
                                    required
                                    maxLength={255}
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full rounded-lg border bg-background p-3"
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="cashier-password" className="mb-2 block text-sm font-medium">
                                    Initial Password
                                </label>
                                <input
                                    id="cashier-password"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    className="w-full rounded-lg border bg-background p-3"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-destructive">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="cashier-confirm" className="mb-2 block text-sm font-medium">
                                    Confirm Password
                                </label>
                                <input
                                    id="cashier-confirm"
                                    type="password"
                                    required
                                    autoComplete="new-password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData('password_confirmation', e.target.value)
                                    }
                                    className="w-full rounded-lg border bg-background p-3"
                                />
                            </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                            The account will automatically receive the Cashier role
                            and Active status. Passwords must contain at least
                            eight characters, including letters and numbers.
                        </p>

                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                        >
                            {processing && (
                                <LoaderCircle size={16} className="animate-spin" />
                            )}
                            {processing ? 'Creating Account...' : 'Create Cashier'}
                        </button>
                    </form>
                )}

                <div className="overflow-hidden rounded-xl border bg-card">
                    <div className="flex items-center gap-2 border-b p-5">
                        <Users size={20} />
                        <h2 className="font-semibold">
                            Registered Cashiers ({cashiers.length})
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-muted/40">
                                <tr>
                                    <th className="px-5 py-3">Name</th>
                                    <th className="px-5 py-3">Email</th>
                                    <th className="px-5 py-3">Status</th>
                                    <th className="px-5 py-3">Date Created</th>
                                    <th className="px-5 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cashiers.map((cashier) => (
                                    <tr key={cashier.id} className="border-b last:border-0">
                                        <td className="px-5 py-4 font-medium">
                                            {cashier.name}
                                        </td>
                                        <td className="px-5 py-4">
                                            {cashier.email}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-2.5 py-1 text-xs font-medium ${cashier.status === 'Active'
                                                    ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                    : 'bg-red-500/10 text-red-600 dark:text-red-400'
                                                    }`}
                                            >
                                                {cashier.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-muted-foreground">
                                            {cashier.created_at
                                                ? new Date(cashier.created_at).toLocaleDateString('en-PH')
                                                : '—'}
                                        </td>

                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => changeStatus(cashier)}
                                                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${cashier.status === 'Active'
                                                        ? 'border-red-500/30 text-red-600 hover:bg-red-500/10 dark:text-red-400'
                                                        : 'border-green-500/30 text-green-600 hover:bg-green-500/10 dark:text-green-400'
                                                    }`}
                                            >
                                                {cashier.status === 'Active'
                                                    ? 'Deactivate'
                                                    : 'Activate'}
                                            </button>
                                        </td>

                                    </tr>
                                ))}
                                {cashiers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-5 py-10 text-center text-muted-foreground"
                                        >
                                            No Cashier accounts found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
