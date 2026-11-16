import { OwnerSidebar } from '@/components/owner-sidebar';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, CalendarDays, CheckCircle2, LoaderCircle, Mail, Plus, ShieldCheck, UserPlus, UserRound, UserX, Users, X } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';

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
    auth?: {
        user?: {
            name: string;
        } | null;
    };
};

export default function CashierManagement() {
    const { cashiers, flash, auth } = usePage<PageProps>().props;
    const [showForm, setShowForm] = useState(false);
    const [statusTarget, setStatusTarget] = useState<Cashier | null>(null);
    const [statusProcessing, setStatusProcessing] = useState(false);
    const activeCount = cashiers.filter((cashier) => cashier.status === 'Active').length;
    const inactiveCount = cashiers.length - activeCount;

    const { data, setData, post, processing, errors, reset } = useForm({
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
        setStatusTarget(cashier);
    }

    function confirmStatusChange() {
        if (!statusTarget || statusProcessing) return;
        const cashier = statusTarget;
        const nextStatus = cashier.status === 'Active' ? 'Inactive' : 'Active';
        setStatusProcessing(true);
        router.patch(
            `/owner/cashiers/${cashier.id}/status`,
            { status: nextStatus },
            {
                preserveScroll: true,
                onSuccess: () => setStatusTarget(null),
                onFinish: () => setStatusProcessing(false),
            },
        );
    }

    useEffect(() => {
        if (!statusTarget || statusProcessing) return;
        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape') setStatusTarget(null);
        }
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [statusTarget, statusProcessing]);

    return (
        <>
            <Head title="Cashier Management" />
            <div className="min-h-screen bg-[#F5F6F8] text-[#19191C] md:flex">
                <OwnerSidebar />
                <div className="min-w-0 flex-1">
                    <header className="flex min-h-[76px] items-center justify-between border-b border-gray-200/80 bg-white px-5 sm:px-8">
                        <div className="flex items-center gap-3">
                            <div className="hidden size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 sm:flex">
                                <Users className="size-5" />
                            </div>
                            <div>
                                <h1 className="text-lg leading-tight font-extrabold">Cashier Management</h1>
                                <p className="text-xs text-gray-500">Create accounts and control transaction dashboard access</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="hidden text-sm font-semibold text-gray-700 sm:inline">{auth?.user?.name ?? 'Owner'}</span>
                            <div className="flex size-10 items-center justify-center rounded-full bg-[#19191C] text-white">
                                <UserRound className="size-5" />
                            </div>
                        </div>
                    </header>

                    <main className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
                        <section className="flex flex-col justify-between gap-5 rounded-3xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/40 sm:flex-row sm:items-center sm:p-7">
                            <div className="flex items-start gap-4">
                                <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
                                    <Users className="size-6" />
                                </span>
                                <div>
                                    <p className="text-[10px] font-bold tracking-[0.16em] text-violet-600 uppercase">Team access</p>
                                    <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-[#19191C] sm:text-3xl">Cashier accounts</h2>
                                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-500">
                                        Create cashier logins and manage access to the point-of-sale workspace.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowForm(!showForm)}
                                aria-expanded={showForm}
                                aria-controls="cashier-create-form"
                                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#19191C] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#303033] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#397EFA]"
                            >
                                <Plus className="size-4" />
                                {showForm ? 'Close form' : 'Add cashier'}
                            </button>
                        </section>

                        {flash?.success && (
                            <div
                                role="status"
                                className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
                            >
                                <CheckCircle2 className="size-5 shrink-0" />
                                {flash.success}
                            </div>
                        )}

                        <section className="grid gap-4 sm:grid-cols-3">
                            <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/30">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold text-gray-500">Total cashiers</p>
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                                        <Users className="size-5" />
                                    </span>
                                </div>
                                <p className="mt-4 text-3xl font-extrabold text-[#19191C] tabular-nums">{cashiers.length}</p>
                                <p className="mt-1 text-xs text-gray-400">Registered staff accounts</p>
                            </article>
                            <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/30">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold text-gray-500">Active access</p>
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                                        <ShieldCheck className="size-5" />
                                    </span>
                                </div>
                                <p className="mt-4 text-3xl font-extrabold text-[#19191C] tabular-nums">{activeCount}</p>
                                <p className="mt-1 text-xs text-gray-400">Can sign in to the cashier workspace</p>
                            </article>
                            <article className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm shadow-gray-200/30">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold text-gray-500">Inactive access</p>
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
                                        <UserX className="size-5" />
                                    </span>
                                </div>
                                <p className="mt-4 text-3xl font-extrabold text-[#19191C] tabular-nums">{inactiveCount}</p>
                                <p className="mt-1 text-xs text-gray-400">Accounts currently deactivated</p>
                            </article>
                        </section>

                        {showForm && (
                            <form
                                id="cashier-create-form"
                                onSubmit={submit}
                                className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40"
                            >
                                <div className="flex items-start gap-3 border-b border-gray-100 bg-gradient-to-r from-violet-50 via-white to-white px-5 py-5 sm:px-7">
                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                                        <UserPlus className="size-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-base font-bold text-[#19191C]">Create cashier account</h3>
                                        <p className="mt-1 text-xs text-gray-500">Set up login credentials and grant cashier access.</p>
                                    </div>
                                </div>

                                <div className="grid gap-x-5 gap-y-4 p-5 sm:grid-cols-2 sm:p-7">
                                    <div>
                                        <label htmlFor="cashier-name" className="mb-2 block text-xs font-bold text-gray-700">
                                            Full name
                                        </label>
                                        <input
                                            id="cashier-name"
                                            name="name"
                                            required
                                            maxLength={255}
                                            autoComplete="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            aria-invalid={Boolean(errors.name)}
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                            placeholder="Cashier's full name"
                                        />
                                        {errors.name && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.name}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="cashier-email" className="mb-2 block text-xs font-bold text-gray-700">
                                            Email address
                                        </label>
                                        <div className="relative">
                                            <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400" />
                                            <input
                                                id="cashier-email"
                                                name="email"
                                                type="email"
                                                required
                                                maxLength={255}
                                                autoComplete="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                aria-invalid={Boolean(errors.email)}
                                                className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pr-3.5 pl-10 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                                placeholder="name@example.com"
                                            />
                                        </div>
                                        {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="cashier-password" className="mb-2 block text-xs font-bold text-gray-700">
                                            Initial password
                                        </label>
                                        <input
                                            id="cashier-password"
                                            name="password"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            aria-invalid={Boolean(errors.password)}
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                            placeholder="Create a secure password"
                                        />
                                        {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password}</p>}
                                    </div>

                                    <div>
                                        <label htmlFor="cashier-confirm" className="mb-2 block text-xs font-bold text-gray-700">
                                            Confirm password
                                        </label>
                                        <input
                                            id="cashier-confirm"
                                            name="password_confirmation"
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-violet-500 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                            placeholder="Enter the password again"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4 border-t border-gray-100 bg-gray-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                    <p className="max-w-xl text-xs leading-relaxed text-gray-500">
                                        This account starts with active cashier access. Passwords must be at least eight characters and include
                                        letters and numbers.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#19191C] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#303033] disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {processing ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                                        {processing ? 'Creating account...' : 'Create cashier'}
                                    </button>
                                </div>
                            </form>
                        )}

                        <section className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm shadow-gray-200/40">
                            <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                                        <Users className="size-5" />
                                    </span>
                                    <div>
                                        <h3 className="text-sm font-bold text-[#19191C]">Registered cashiers</h3>
                                        <p className="mt-0.5 text-xs text-gray-500">Review staff details and manage account access.</p>
                                    </div>
                                </div>
                                <span className="inline-flex w-fit items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600">
                                    {cashiers.length} {cashiers.length === 1 ? 'account' : 'accounts'}
                                </span>
                            </div>

                            {cashiers.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px] text-left text-sm">
                                        <thead className="bg-gray-50/80 text-[10px] font-bold tracking-wide text-gray-500 uppercase">
                                            <tr>
                                                <th scope="col" className="px-6 py-3.5">
                                                    Cashier
                                                </th>
                                                <th scope="col" className="px-6 py-3.5">
                                                    Account email
                                                </th>
                                                <th scope="col" className="px-6 py-3.5">
                                                    Access status
                                                </th>
                                                <th scope="col" className="px-6 py-3.5">
                                                    Date added
                                                </th>
                                                <th scope="col" className="px-6 py-3.5 text-right">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {cashiers.map((cashier) => (
                                                <tr key={cashier.id} className="transition hover:bg-gray-50/70">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-xs font-extrabold text-violet-700">
                                                                {cashier.name
                                                                    .trim()
                                                                    .split(/\s+/)
                                                                    .slice(0, 2)
                                                                    .map((part) => part[0])
                                                                    .join('')
                                                                    .toUpperCase()}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="truncate font-bold text-gray-800">{cashier.name}</p>
                                                                <p className="mt-0.5 text-[11px] text-gray-400">Cashier</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600">{cashier.email}</td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                                cashier.status === 'Active'
                                                                    ? 'bg-emerald-50 text-emerald-700'
                                                                    : 'bg-gray-100 text-gray-600'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`size-1.5 rounded-full ${cashier.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400'}`}
                                                            />
                                                            {cashier.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs text-gray-500">
                                                        <span className="inline-flex items-center gap-2">
                                                            <CalendarDays className="size-3.5 text-gray-400" />
                                                            {cashier.created_at ? new Date(cashier.created_at).toLocaleDateString('en-PH') : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => changeStatus(cashier)}
                                                            aria-label={`${cashier.status === 'Active' ? 'Deactivate' : 'Activate'} ${cashier.name}`}
                                                            className={`rounded-lg border px-3 py-2 text-xs font-bold transition ${
                                                                cashier.status === 'Active'
                                                                    ? 'border-gray-200 text-gray-600 hover:border-red-200 hover:bg-red-50 hover:text-red-700'
                                                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                                            }`}
                                                        >
                                                            {cashier.status === 'Active' ? 'Deactivate' : 'Activate'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center px-6 py-14 text-center">
                                    <span className="flex size-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-500">
                                        <Users className="size-7" />
                                    </span>
                                    <h4 className="mt-4 text-sm font-bold text-gray-800">No cashier accounts yet</h4>
                                    <p className="mt-1 max-w-sm text-xs leading-relaxed text-gray-500">
                                        Add a cashier account to give your team access to the point-of-sale workspace.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(true)}
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#19191C] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#303033]"
                                    >
                                        <Plus className="size-4" />
                                        Add first cashier
                                    </button>
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>
            {statusTarget && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/55 p-4 backdrop-blur-[2px]"
                    onMouseDown={(event) => {
                        if (event.currentTarget === event.target && !statusProcessing) {
                            setStatusTarget(null);
                        }
                    }}
                >
                    <section
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="cashier-status-title"
                        aria-describedby="cashier-status-description"
                        className="my-auto w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-black/25"
                    >
                        <div className="flex items-start justify-between gap-4 p-6 sm:p-7">
                            <span
                                className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${
                                    statusTarget.status === 'Active' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                                }`}
                            >
                                {statusTarget.status === 'Active' ? <AlertTriangle className="size-6" /> : <ShieldCheck className="size-6" />}
                            </span>
                            <button
                                type="button"
                                disabled={statusProcessing}
                                onClick={() => setStatusTarget(null)}
                                aria-label="Close confirmation"
                                className="flex size-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                        <div className="px-6 pb-6 sm:px-7">
                            <p className="text-[10px] font-bold tracking-[0.16em] text-gray-400 uppercase">Account access</p>
                            <h2 id="cashier-status-title" className="mt-1 text-xl font-extrabold tracking-tight text-[#19191C]">
                                {statusTarget.status === 'Active' ? 'Deactivate cashier?' : 'Activate cashier?'}
                            </h2>
                            <p id="cashier-status-description" className="mt-3 text-sm leading-relaxed text-gray-600">
                                {statusTarget.status === 'Active'
                                    ? `This will prevent ${statusTarget.name} from signing in to the cashier workspace. You can reactivate this account later.`
                                    : `This will restore ${statusTarget.name}'s access to the cashier workspace.`}
                            </p>
                            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3.5">
                                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-sm font-extrabold text-violet-700">
                                    {statusTarget.name
                                        .trim()
                                        .split(/\s+/)
                                        .slice(0, 2)
                                        .map((part) => part[0])
                                        .join('')
                                        .toUpperCase()}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-gray-800">{statusTarget.name}</p>
                                    <p className="truncate text-xs text-gray-500">{statusTarget.email}</p>
                                </div>
                                <span
                                    className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                                        statusTarget.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-200 text-gray-600'
                                    }`}
                                >
                                    {statusTarget.status}
                                </span>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/80 p-5 sm:flex-row sm:justify-end sm:gap-3 sm:px-7">
                            <button
                                type="button"
                                disabled={statusProcessing}
                                onClick={() => setStatusTarget(null)}
                                className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={statusProcessing}
                                onClick={confirmStatusChange}
                                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                    statusTarget.status === 'Active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {statusProcessing && <LoaderCircle className="size-4 animate-spin" />}
                                {statusProcessing
                                    ? 'Updating access...'
                                    : statusTarget.status === 'Active'
                                      ? 'Deactivate account'
                                      : 'Activate account'}
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
