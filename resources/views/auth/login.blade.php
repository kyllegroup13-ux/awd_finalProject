<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ __('Log in') }} - M3 Dry Goods</title>

    @vite(['resources/css/app.css', 'resources/js/app.tsx'])
</head>

<body class="min-h-screen bg-slate-100 text-slate-900 antialiased">
    <div class="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-4 sm:p-6 lg:p-10">
        <div class="w-full overflow-hidden rounded-[30px] border border-slate-200/80 bg-white/90 shadow-[0_30px_80px_-30px_rgba(15,23,42,0.35)] backdrop-blur-sm">
            <div class="grid lg:grid-cols-[1.05fr_1.45fr]">
                <aside class="hidden bg-slate-950 p-8 text-white lg:flex lg:flex-col lg:justify-between">
                    <div>
                        <div class="mb-8 flex items-center gap-3">
                            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                                <span class="text-lg font-black tracking-[0.18em] text-blue-300">M3</span>
                            </div>
                            <div>
                                <p class="text-xs font-medium uppercase tracking-[0.25em] text-slate-300">Operations Suite</p>
                                <p class="text-sm font-semibold text-white">M3 Dry Goods</p>
                            </div>
                        </div>

                        <div class="space-y-6">
                            <div>
                                <p class="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">Welcome back</p>
                                <h1 class="text-4xl font-black leading-tight tracking-tight">Your business, in motion.</h1>
                            </div>

                            <p class="max-w-sm text-base text-slate-300">
                                Sign in to keep track of stock, sales, and the details that keep your store moving.
                            </p>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                            <div class="mb-2 flex items-center justify-between text-sm text-slate-200">
                                <span>Inventory health</span>
                                <span class="font-semibold text-emerald-300">98%</span>
                            </div>
                            <div class="h-2 rounded-full bg-white/10">
                                <div class="h-2 w-[98%] rounded-full bg-gradient-to-r from-blue-400 to-emerald-400"></div>
                            </div>
                        </div>

                        <div class="grid gap-3 text-sm text-slate-200">
                            <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                <span class="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
                                Live inventory tracking
                            </div>
                            <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                <span class="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400"></span>
                                Sales and cash flow insights
                            </div>
                            <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                                <span class="inline-flex h-2.5 w-2.5 rounded-full bg-violet-400"></span>
                                Secure team access controls
                            </div>
                        </div>
                    </div>
                </aside>

                <main class="p-6 sm:p-8 lg:p-10 xl:p-12">
                    <div class="mx-auto max-w-xl">
                        <div class="mb-8 flex justify-center lg:justify-start">
                            <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-xl font-black text-white shadow-lg shadow-blue-200">
                                M3
                            </div>
                        </div>

                        <div class="mb-8 text-center lg:text-left">
                            <p class="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Account access</p>
                            <h2 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Welcome back</h2>
                            <p class="mt-2 text-base text-slate-600">Enter your details to sign in to your account.</p>
                        </div>

                        <x-auth-session-status class="mb-6" :status="session('status')" />

                        <form method="POST" action="{{ route('login') }}" class="space-y-6">
                            @csrf

                            <div class="space-y-5">
                                <div>
                                    <label for="email" class="mb-2 block text-sm font-semibold text-slate-700">
                                        {{ __('Email address') }}
                                    </label>
                                    <div class="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value="{{ old('email') }}"
                                            required
                                            autofocus
                                            autocomplete="username"
                                            placeholder="you@example.com"
                                            class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        >
                                        <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                            <rect x="3" y="5" width="18" height="14" rx="2"/>
                                            <path d="m4 7 8 6 8-6"/>
                                        </svg>
                                    </div>
                                    <x-input-error :messages="$errors->get('email')" class="mt-2" />
                                </div>

                                <div>
                                    <div class="mb-2 flex items-center justify-between gap-3">
                                        <label for="password" class="block text-sm font-semibold text-slate-700">
                                            {{ __('Password') }}
                                        </label>

                                        @if (Route::has('password.request'))
                                            <a href="{{ route('password.request') }}" class="text-sm font-semibold text-blue-700 underline decoration-blue-200 underline-offset-4 transition hover:text-blue-900">
                                                {{ __('Forgot password?') }}
                                            </a>
                                        @endif
                                    </div>
                                    <div class="relative">
                                        <input
                                            id="password"
                                            type="password"
                                            name="password"
                                            required
                                            autocomplete="current-password"
                                            placeholder="Enter your password"
                                            class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        >
                                        <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                            <rect x="5" y="11" width="14" height="9" rx="2"/>
                                            <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
                                        </svg>
                                    </div>
                                    <x-input-error :messages="$errors->get('password')" class="mt-2" />
                                </div>
                            </div>

                            <label for="remember_me" class="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                                <input id="remember_me" type="checkbox" name="remember" class="h-4 w-4 rounded border-slate-300 text-blue-700 shadow-sm focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                                <span>{{ __('Remember me') }}</span>
                            </label>

                            <button
                                type="submit"
                                class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-blue-200"
                            >
                                {{ __('Log in') }}
                                <span aria-hidden="true">→</span>
                            </button>

                            <p class="text-center text-sm text-slate-600">
                                {{ __("Don't have an account?") }}
                                <a href="{{ route('register') }}" class="ml-1 font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-blue-700">
                                    {{ __('Create an account') }}
                                </a>
                            </p>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    </div>
</body>

</html>
