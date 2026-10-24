
import { Link } from '@inertiajs/react';
import { ShoppingBag } from 'lucide-react';
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
    const isLogin = mode === 'login';

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#E9E9E9] px-4 py-8 text-black">
            <main
                className={`w-full rounded-xl bg-[#FAFAFA] shadow-[0_4px_0_0_rgba(0,0,0,0.2)] ${
                    isLogin
                        ? 'max-w-[380px] px-6 pb-12 pt-10 sm:px-7'
                        : 'max-w-[600px] px-7 py-10 sm:px-12'
                }`}
            >
                <div className="mb-8 flex flex-col items-center text-center">
                    <div className="mb-1 flex size-14 items-center justify-center bg-[#DEDEDE]">
                        <div className="relative">
                            <ShoppingBag
                                className="size-8 text-white"
                                strokeWidth={2.5}
                            />
                            <span className="absolute inset-x-0 top-3 text-center text-[12px] font-black text-blue-600">
                                M3
                            </span>
                        </div>
                    </div>

                    <h1 className="text-[23px] font-bold leading-tight tracking-tight">
                        M3 Dry Goods
                    </h1>

                    <p className="text-[10px] text-gray-700">
                        Inventory and Sales Management System
                    </p>
                </div>

                <div className={isLogin ? 'mb-4' : 'mb-6'}>
                    <h2 className="text-center text-lg font-bold">
                        {title}
                    </h2>

                    {description && (
                        <p className="mt-2 text-center text-sm text-gray-500">
                            {description}
                        </p>
                    )}
                </div>

                {children}

                {!isLogin && (
                    <div className="mt-6 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link
                            href="/login"
                            className="font-semibold text-blue-600 hover:underline"
                        >
                            Sign in
                        </Link>
                    </div>
                )}
            </main>
        </div>
    );
}
