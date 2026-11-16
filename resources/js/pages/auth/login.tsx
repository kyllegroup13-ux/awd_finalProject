import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';

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

export default function Login({ status, canResetPassword }: LoginProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
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
        <M3AuthLayout mode="login" title="Sign In" description="">
            <Head title="Sign In | M3 Dry Goods" />

            <div className="space-y-5">
                <div className="text-center">
                    <p className="text-sm font-semibold text-[#1C3155]">Welcome back</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">Sign in to manage your store and continue where you left off.</p>
                </div>

                {status && (
                    <p
                        role="status"
                        className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800"
                    >
                        {status}
                    </p>
                )}

                <form onSubmit={submit} className="space-y-4">
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="block text-xs font-semibold text-gray-700">
                            Email address
                        </label>
                        <div className="group relative">
                            <Mail className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400 transition group-focus-within:text-[#397EFA]" />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                autoFocus
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="you@example.com"
                                aria-invalid={Boolean(errors.email)}
                                aria-describedby={errors.email ? 'email-error' : undefined}
                                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pr-4 pl-10 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-[#397EFA] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                        </div>
                        {errors.email && (
                            <p id="email-error" className="text-xs font-medium text-red-600">
                                {errors.email}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="password" className="block text-xs font-semibold text-gray-700">
                            Password
                        </label>
                        <div className="group relative">
                            <LockKeyhole className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-gray-400 transition group-focus-within:text-[#397EFA]" />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="current-password"
                                required
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Enter your password"
                                aria-invalid={Boolean(errors.password)}
                                aria-describedby={errors.password ? 'password-error' : undefined}
                                className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pr-11 pl-10 text-sm text-gray-900 transition outline-none placeholder:text-gray-400 hover:border-gray-300 focus:border-[#397EFA] focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Hide password' : 'Show password'}
                                aria-pressed={showPassword}
                                className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#397EFA]"
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p id="password-error" className="text-xs font-medium text-red-600">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
                        <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-gray-600">
                            <input
                                type="checkbox"
                                name="remember"
                                checked={data.remember}
                                onChange={(e) => setData('remember', e.target.checked)}
                                className="size-4 rounded border-gray-300 accent-[#1C3155] focus:ring-2 focus:ring-blue-500/20"
                            />
                            Remember me
                        </label>
                        {canResetPassword && (
                            <Link
                                href="/forgot-password"
                                className="text-xs font-semibold text-[#1C3155] transition hover:text-[#397EFA] hover:underline"
                            >
                                Forgot password?
                            </Link>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1C3155] px-5 text-sm font-bold text-white shadow-md shadow-[#1C3155]/15 transition hover:-translate-y-0.5 hover:bg-[#263F6B] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                        {processing ? (
                            <>
                                <LoaderCircle className="size-4 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            'Sign in to your account'
                        )}
                    </button>

                    <div className="flex items-center gap-3 py-1">
                        <span className="h-px flex-1 bg-gray-200" />
                        <span className="text-[10px] font-medium text-gray-400">NEW TO M3 DRY GOODS?</span>
                        <span className="h-px flex-1 bg-gray-200" />
                    </div>

                    <p className="text-center text-xs text-gray-600">
                        Need an account?{' '}
                        <Link href="/register" className="font-bold text-[#1C3155] transition hover:text-[#397EFA] hover:underline">
                            Create account
                        </Link>
                    </p>
                </form>
            </div>
        </M3AuthLayout>
    );
}
