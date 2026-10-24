
import { Head, useForm } from '@inertiajs/react';
import {
    Eye,
    EyeOff,
    LoaderCircle,
    LockKeyhole,
    UserRound,
} from 'lucide-react';
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
            title="Sign In"
            description=""
        >
            <Head title="Sign In | M3 Dry Goods" />

            {status && (
                <p className="mb-4 text-center text-sm text-green-600">
                    {status}
                </p>
            )}

            <form onSubmit={submit} className="space-y-3">
                <div>
                    <div className="relative">
                        <UserRound className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />

                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            required
                            autoFocus
                            value={data.email}
                            onChange={(e) =>
                                setData('email', e.target.value)
                            }
                            placeholder="Email"
                            aria-label="Email"
                            className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:border-blue-500"
                        />
                    </div>

                    {errors.email && (
                        <p className="mt-1 text-xs text-red-500">
                            {errors.email}
                        </p>
                    )}
                </div>

                <div>
                    <div className="relative">
                        <LockKeyhole className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />

                        <input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            autoComplete="current-password"
                            required
                            value={data.password}
                            onChange={(e) =>
                                setData('password', e.target.value)
                            }
                            placeholder="Password"
                            aria-label="Password"
                            className="h-11 w-full rounded-lg border-2 border-gray-300 bg-white pl-11 pr-11 text-sm text-gray-900 outline-none transition focus:border-blue-500"
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
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

                <div className="flex justify-end">
                    {canResetPassword && (
                        <a
                            href="/forgot-password"
                            className="text-[10px] font-semibold text-red-500 hover:underline"
                        >
                            Forgot Password?
                        </a>
                    )}
                </div>

                <div className="pt-5 text-center">
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex h-10 min-w-24 items-center justify-center gap-2 rounded-lg bg-[#BDBDBD] px-6 text-sm font-semibold text-black transition hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processing ? (
                            <>
                                <LoaderCircle className="size-4 animate-spin" />
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </div>
            </form>
        </M3AuthLayout>
    );
}
