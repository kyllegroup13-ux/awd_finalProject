import { Link } from '@inertiajs/react';
import { Archive, BarChart3, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, Tag, Users, Wallet } from 'lucide-react';
import { useState } from 'react';

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
        href: '/owner/cashiers',
        label: 'Cashier Management',
        icon: Users,
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
    const [isExpanded, setIsExpanded] = useState(() =>
        typeof window === 'undefined' ? true : window.localStorage.getItem('owner-sidebar-expanded') !== 'false',
    );

    function toggleSidebar() {
        const nextIsExpanded = !isExpanded;
        window.localStorage.setItem('owner-sidebar-expanded', String(nextIsExpanded));
        setIsExpanded(nextIsExpanded);
    }

    return (
        <aside
            className={`flex w-full flex-col bg-[#19191C] py-7 text-white transition-[width] md:sticky md:top-0 md:h-screen md:max-h-screen md:shrink-0 md:overflow-hidden ${isExpanded ? 'px-5 md:w-[244px]' : 'px-5 md:w-20 md:px-0'}`}
        >
            <div className={`mb-8 flex items-center ${isExpanded ? 'justify-between gap-2' : 'justify-end md:justify-center'}`}>
                <Link href="/dashboard" className={`min-w-0 text-xl font-bold ${isExpanded ? '' : 'md:hidden'}`}>
                    M3 Dry Goods
                </Link>
                <button
                    type="button"
                    aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                    aria-expanded={isExpanded}
                    aria-controls="owner-sidebar-navigation"
                    title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
                    onClick={toggleSidebar}
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-[#303033] hover:text-white"
                >
                    {isExpanded ? <PanelLeftClose className="size-5" /> : <PanelLeftOpen className="size-5" />}
                </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col">
                <nav id="owner-sidebar-navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto text-sm font-semibold">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isDisabled = 'disabled' in item && item.disabled;
                        const isActive = !isDisabled && (pathname === item.href || pathname.startsWith(`${item.href}/`));

                        if (isDisabled) {
                            return (
                                <div
                                    key={item.label}
                                    className={`flex items-center gap-3 rounded-lg py-3 text-gray-500 ${isExpanded ? 'px-4' : 'md:justify-center md:px-2'}`}
                                    title="This page is not yet available"
                                >
                                    <Icon className="size-5" />
                                    <span className={isExpanded ? '' : 'md:hidden'}>{item.label}</span>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                aria-label={item.label}
                                title={!isExpanded ? item.label : undefined}
                                className={[
                                    'flex items-center gap-3 rounded-lg py-3 transition',
                                    isExpanded ? 'px-4' : 'md:justify-center md:px-2',
                                    isActive ? 'bg-[#303033] text-white' : 'text-gray-400 hover:bg-[#303033] hover:text-white',
                                ].join(' ')}
                            >
                                <Icon className="size-5" />
                                <span className={isExpanded ? '' : 'md:hidden'}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <Link
                href="/logout"
                method="post"
                as="button"
                aria-label="Logout"
                title={!isExpanded ? 'Logout' : undefined}
                className={`mt-10 flex items-center gap-3 rounded-lg py-3 text-left text-sm font-semibold transition hover:bg-[#303033] ${isExpanded ? 'px-3' : 'md:justify-center md:px-2'}`}
            >
                <LogOut className="size-5" />
                <span className={isExpanded ? '' : 'md:hidden'}>Logout</span>
            </Link>
        </aside>
    );
}
