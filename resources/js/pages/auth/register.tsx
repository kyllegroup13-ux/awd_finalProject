
import { Head, Link, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    Mail,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';

import M3AuthLayout from '@/layouts/m3-auth-layout';

type RegisterForm = {
    name: string;
    email: string;
    password: string;
    password_confirmation: string;
    role: 'cashier' | 'owner';
};

const inputClass =
    'h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#1C3155] focus:ring-2 focus:ring-[#1C3155]/10';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const { data, setData, post, processing, errors, reset } =
        useForm<RegisterForm>({
            name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: 'cashier',
        });

    const hasMinLength = data.password.length >= 8;
    const hasNumber = /\d/.test(data.password);
    const hasLetter = /[a-zA-Z]/.test(data.password);

    function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    }

    return (
        <M3AuthLayout
            mode="register"
            title="Register"
            description=""
        >
            <Head title="Register | M3 Dry Goods" />

            <form onSubmit={submit} className="space-y-4">
                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="mb-1.5 block text-xs font-semibold text-slate-800"
                    >
                        Email Address <span className="text-red-500">*</span>
                    </label>

                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                        <input
                            id="email"
                            type="email"
                            required
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) =>
                                setData('email', e.target.value)
                            }
                            placeholder="you@example.com"
                            className={inputClass}
                        />
                    </div>

                    {errors.email && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.email}
                        </p>
                    )}
                </div>

                {/* Password fields */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label
                            htmlFor="password"
                            className="mb-1.5 block text-xs font-semibold text-slate-800"
                        >
                            Password <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                            <input
                                id="password"
                                type={showPassword ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                value={data.password}
                                onChange={(e) =>
                                    setData('password', e.target.value)
                                }
                                placeholder="Create a password"
                                className={inputClass}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(!showPassword)
                                }
                                aria-label={
                                    showPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1C3155]"
                            >
                                {showPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>

                        {errors.password && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.password}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="password_confirmation"
                            className="mb-1.5 block text-xs font-semibold text-slate-800"
                        >
                            Confirm Password <span className="text-red-500">*</span>
                        </label>

                        <div className="relative">
                            <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                            <input
                                id="password_confirmation"
                                type={showConfirmPassword ? 'text' : 'password'}
                                required
                                autoComplete="new-password"
                                value={data.password_confirmation}
                                onChange={(e) =>
                                    setData('password_confirmation', e.target.value)
                                }
                                placeholder="Confirm your password"
                                className={inputClass}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                                aria-label={
                                    showConfirmPassword
                                        ? 'Hide confirmation'
                                        : 'Show confirmation'
                                }
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1C3155]"
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="size-4" />
                                ) : (
                                    <Eye className="size-4" />
                                )}
                            </button>
                        </div>

                        {errors.password_confirmation && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.password_confirmation}
                            </p>
                        )}
                    </div>
                </div>

                {/* Password requirements */}
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                    <span>
                        <span className={hasMinLength ? 'text-green-500' : 'text-slate-400'}>
                            ●
                        </span>{' '}
                        At least 8 characters
                    </span>

                    <span>
                        <span className={hasNumber ? 'text-green-500' : 'text-slate-400'}>
                            ●
                        </span>{' '}
                        Include a number
                    </span>

                    <span>
                        <span className={hasLetter ? 'text-green-500' : 'text-slate-400'}>
                            ●
                        </span>{' '}
                        Include a letter
                    </span>
                </div>

                {/* Personal information */}
                <div className="pt-2">
                    <h3 className="mb-3 text-sm font-bold text-slate-900">
                        Personal Information
                    </h3>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-1.5 block text-xs font-semibold text-slate-800"
                            >
                                Full Name <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                <UserRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    id="name"
                                    required
                                    autoComplete="name"
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    placeholder="e.g. Juan Dela Cruz"
                                    className={inputClass}
                                />
                            </div>

                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label
                                htmlFor="role"
                                className="mb-1.5 block text-xs font-semibold text-slate-800"
                            >
                                Role <span className="text-red-500">*</span>
                            </label>

                            <div className="relative">
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(e) =>
                                        setData(
                                            'role',
                                            e.target.value as 'cashier' | 'owner'
                                        )
                                    }
                                    className="h-11 w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 pr-10 text-sm text-slate-700 outline-none transition focus:border-[#1C3155] focus:ring-2 focus:ring-[#1C3155]/10"
                                >
                                    <option value="cashier">Cashier</option>
                                    <option value="owner">Owner</option>
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
                            </div>

                            {errors.role && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.role}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={processing}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#1C3155] px-5 text-sm font-semibold text-white transition hover:bg-[#142540] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? (
                            <>
                                <LoaderCircle className="size-4 animate-spin" />
                                Creating Account...
                            </>
                        ) : (
                            <>
                                Create Account
                                <span aria-hidden="true">→</span>
                            </>
                        )}
                    </button>

                    <p className="mt-3 text-center text-xs text-slate-400">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-semibold text-[#1C3155] hover:underline"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </form>
        </M3AuthLayout>
    );
}
