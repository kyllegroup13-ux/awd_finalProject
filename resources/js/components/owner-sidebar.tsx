import { Link } from '@inertiajs/react';
import { Archive, BarChart3, LayoutDashboard, LogOut, Tag, Wallet } from 'lucide-react';

import AppLogoIcon from '@/components/app-logo-icon';

const navItems = [
    {
        href: '/dashboard',
        label: 'Dashboard',
        icon: LayoutDashboard,
    },
    {
        href: '/owner/manage/products',
        label: 'Products',
        icon: Tag,
    },
    {
        href: '/owner/manage/inventory',
        label: 'Inventory',
        icon: Archive,
    },
    {
        href: '/owner/sales',
        label: 'Sales Records',
        icon: Wallet,
    },
    {
        href: '/owner/reports',
        label: 'Reports',
        icon: BarChart3,
    },
] as const;

export function OwnerSidebar() {
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    return (
        <aside className="flex w-full flex-col bg-[#19191C] px-5 py-7 text-white md:min-h-screen md:w-[244px] md:shrink-0">
            <Link href="/dashboard" className="mb-8 flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-lg bg-white/10 p-2">
                    <AppLogoIcon className="size-9 text-white" />
                </div>
                <span className="text-xl font-bold">M3 Dry Goods</span>
            </Link>

            <nav className="flex-1 space-y-1 text-sm font-semibold">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = !item.disabled && (pathname === item.href || pathname.startsWith(`${item.href}/`));

                    if (item.disabled) {
                        return (
                            <div
                                key={item.label}
                                className="flex cursor-not-allowed items-center gap-3 rounded-lg px-4 py-3 text-gray-500"
                                title="This page is not yet available"
                            >
                                <Icon className="size-5" />
                                {item.label}
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={[
                                'flex items-center gap-3 rounded-lg px-4 py-3 transition',
                                isActive
                                    ? 'bg-[#303033] text-white'
                                    : 'text-gray-400 hover:bg-[#303033] hover:text-white',
                            ].join(' ')}
                        >
                            <Icon className="size-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <Link
                href="/logout"
                method="post"
                as="button"
                className="mt-10 flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold transition hover:bg-[#303033]"
            >
                <LogOut className="size-5" />
                Logout
            </Link>
        </aside>
    );
}
