
import { Head, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import M3AuthLayout from '@/layouts/m3-auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
};

const inputClass =
    'w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-900 dark:text-white';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } =
        useForm < RegisterForm > ({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
        });

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    }

    return (
        <M3AuthLayout
            mode="register"
            title="Create your account"
            description="Get started with the M3 Dry Goods management workspace."
        >
            <Head title="Register | M3 Dry Goods" />

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label htmlFor="name" className="mb-2 block text-sm font-semibold">
                        Full name
                    </label>
                    <div className="relative">
                        <UserRound className="absolute left-3.5 top-3.5 size-5 text-slate-400" />
                        <input
                            id="name"
                            required
                            autoComplete="name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="Juan Dela Cruz"
                            className={inputClass}
                        />
                    </div>
                    {errors.name && (
                        <p className="mt-2 text-sm text-red-500">{errors.name}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="email" className="mb-2 block text-sm font-semibold">
                        Email address
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-3.5 size-5 text-slate-400" />
                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
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
                    <label htmlFor="password" className="mb-2 block text-sm font-semibold">
                        Password
                    </label>
                    <div className="relative">
                        <LockKeyhole className="absolute left-3.5 top-3.5 size-5 text-slate-400" />
                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            placeholder="Create a strong password"
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

                <div>
                    <label
                        htmlFor="password_confirmation"
                        className="mb-2 block text-sm font-semibold"
                    >
                        Confirm password
                    </label>
                    <div className="relative">
                        <LockKeyhole className="absolute left-3.5 top-3.5 size-5 text-slate-400" />
                        <input
                            id="password_confirmation"
                            type={showPassword ? 'text' : 'password'}
                            required
                            autoComplete="new-password"
                            value={data.password_confirmation}
                            onChange={(e) =>
                                setData('password_confirmation', e.target.value)
                            }
                            placeholder="Confirm your password"
                            className={inputClass}
                        />
                    </div>
                    {errors.password_confirmation && (
                        <p className="mt-2 text-sm text-red-500">
                            {errors.password_confirmation}
                        </p>
                    )}
                </div>

                <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Use at least 8 characters and a strong combination of letters,
                    numbers, and symbols.
                </p>

                <button
                    type="submit"
                    disabled={processing}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? (
                        <>
                            <LoaderCircle className="size-4 animate-spin" />
                            Creating account...
                        </>
                    ) : (
                        'Create account →'
                    )}
                </button>
            </form>
        </M3AuthLayout>
    );
}
