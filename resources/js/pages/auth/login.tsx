
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import M3AuthLayout from '@/layouts/m3-auth-layout';

type LoginForm = {
    email: string;
    password: string;
    remember: boolean;
};

type LoginProps = {
    status?: string;
    canResetPassword: boolean;
};

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } =
        useForm<LoginForm>({
            email: '',
            password: '',
            remember: false,
        });

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post('/login', {
            onFinish: () => reset('password'),
        });
    }

    return (
        <M3AuthLayout
            mode="login"
            title="Welcome back"
            description="Sign in to your M3 Dry Goods workspace to continue."
        >
            <Head title="Login | M3 Dry Goods" />

            {status && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                        Email address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 size-5 text-slate-400" />
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            autoFocus
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="you@example.com"
                            className={inputClass}
                        />
                    </div>
                    {errors.email && (
                        <p className="mt-2 text-sm text-red-500">{errors.email}</p>
                    )}
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label htmlFor="password" className="text-sm font-semibold">
                            Password
                        </label>
                        {canResetPassword && (
                            <a
                                href="/forgot-password"
                                className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                            >
                                Forgot password?
                            </a>
                        )}
                    </div>

                    <div className="relative">
                        <LockKeyhole className="absolute left-3.5 top-3.5 size-5 text-slate-400" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Enter your password"
                            className={inputClass}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            className="absolute right-3.5 top-3.5 text-slate-400 hover:text-blue-600"
                        >
                            {showPassword ? (
                                <EyeOff className="size-5" />
                            ) : (
                                <Eye className="size-5" />
                            )}
                        </button>
                    </div>
                    {errors.password && (
                        <p className="mt-2 text-sm text-red-500">{errors.password}</p>
                    )}
                </div>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="size-4 rounded border-slate-300 accent-blue-600"
                    />
                    Remember me
                </label>

                <button
                    type="submit"
                    disabled={processing}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? (
                        <>
                            <LoaderCircle className="size-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        'Sign in to workspace →'
                    )}
                </button>
            </form>
        </M3AuthLayout>
    );
}
