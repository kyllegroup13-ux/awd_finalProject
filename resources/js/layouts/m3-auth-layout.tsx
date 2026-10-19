
import { Link } from '@inertiajs/react';
import { ArrowLeft, Boxes, ChartNoAxesCombined, ShieldCheck, ShoppingBag } from 'lucide-react';
import type { ReactNode } from 'react';

type M3AuthLayoutProps = {
    children: ReactNode;
    title: string;
    description: string;
    mode: 'login' | 'register';
};

export default function M3AuthLayout({
    children,
    title,
    description,
    mode,
}: M3AuthLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 lg:grid lg:grid-cols-2">
            <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#0F172A] p-10 text-white lg:flex xl:p-16">
                <div className="pointer-events-none absolute -right-32 top-24 size-96 rounded-full bg-blue-600/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-32 -left-24 size-96 rounded-full bg-indigo-500/20 blur-3xl" />

                <div className="relative z-10 flex items-center gap-3">
                    <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-600 text-xl font-black shadow-lg shadow-blue-950/30">
                        M3
                    </div>
                    <div>
                        <div className="text-xl font-bold tracking-tight">M3 Dry Goods</div>
                        <div className="text-xs tracking-wide text-slate-400">
                            INVENTORY & SALES MANAGEMENT
                        </div>
                    </div>
                </div>

                <div className="relative z-10 max-w-xl">
                    <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-blue-200">
                        <span className="size-2 rounded-full bg-blue-400" />
                        Smart retail management
                    </div>

                    <h2 className="text-5xl font-bold leading-tight tracking-tight xl:text-6xl">
                        Manage smarter.
                        <br />
                        <span className="text-blue-400">Sell better.</span>
                    </h2>

                    <p className="mt-6 max-w-md text-lg leading-8 text-slate-400">
                        A streamlined workspace for inventory, sales, and daily
                        store operations — built for M3 Dry Goods.
                    </p>

                    <div className="mt-12 grid grid-cols-3 gap-3">
                        {[
                            { icon: Boxes, label: 'Inventory' },
                            { icon: ShoppingBag, label: 'Point of Sale' },
                            { icon: ChartNoAxesCombined, label: 'Reports' },
                        ].map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                            >
                                <Icon className="mb-4 size-6 text-blue-400" />
                                <span className="text-sm font-medium text-slate-200">
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center justify-between text-xs text-slate-500">
                    <span>© {new Date().getFullYear()} M3 Dry Goods</span>
                    <span>Built for better business</span>
                </div>
            </aside>

            <main className="flex min-h-screen flex-col">
                <div className="flex items-center justify-between px-6 py-6 sm:px-12">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-blue-600 dark:text-slate-400"
                    >
                        <ArrowLeft className="size-4" />
                        Home
                    </Link>

                    <div className="flex items-center gap-2 font-bold lg:hidden">
                        <div className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-sm text-white">
                            M3
                        </div>
                        M3 Dry Goods
                    </div>
                </div>

                <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
                    <div className="w-full max-w-[440px]">
                        <div className="mb-8">
                            <div className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
                                <ShieldCheck className="size-6" />
                            </div>

                            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                                {title}
                            </h1>
                            <p className="mt-3 leading-7 text-slate-500 dark:text-slate-400">
                                {description}
                            </p>
                        </div>

                        {children}

                        <div className="mt-9 border-t border-slate-200 pt-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400">
                            {mode === 'login' ? (
                                <>
                                    Need an account?{' '}
                                    <Link
                                        href="/register"
                                        className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        Create account
                                    </Link>
                                </>
                            ) : (
                                <>
                                    Already have an account?{' '}
                                    <Link
                                        href="/login"
                                        className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                                    >
                                        Sign in
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pb-6 text-center text-xs text-slate-400 lg:hidden">
                    © {new Date().getFullYear()} M3 Dry Goods
                </div>
            </main>
        </div>
    );
}
