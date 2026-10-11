<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>M3 Dry Goods - Register</title>

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
                                <p class="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-blue-300">Built for retail teams</p>
                                <h2 class="text-4xl font-black leading-tight tracking-tight">Keep inventory moving.</h2>
                            </div>

                            <p class="max-w-sm text-base text-slate-300">
                                Manage stock, automate sales, and keep your business on top of every transaction in real time.
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
                            <p class="mb-2 text-sm font-semibold uppercase tracking-[0.25em] text-blue-600">Create account</p>
                            <h1 class="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Welcome to M3 Dry Goods</h1>
                            <p class="mt-2 text-base text-slate-600">Set up your workspace and start managing operations with confidence.</p>
                        </div>

                        <form method="POST" action="{{ route('register') }}" class="space-y-6">
                            @csrf

                            <div class="space-y-5">
                                <div>
                                    <label class="mb-2 block text-sm font-semibold text-slate-700">
                                        Full Name
                                        <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <input
                                            type="text"
                                            name="name"
                                            placeholder="Juan Dela Cruz"
                                            required
                                            class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        >
                                        <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                            <path d="M20 21a8 8 0 0 0-16 0"/>
                                            <circle cx="12" cy="7" r="4"/>
                                        </svg>
                                    </div>
                                </div>

                                <div>
                                    <label class="mb-2 block text-sm font-semibold text-slate-700">
                                        Email Address
                                        <span class="text-red-500">*</span>
                                    </label>
                                    <div class="relative">
                                        <input
                                            type="email"
                                            name="email"
                                            placeholder="you@example.com"
                                            required
                                            class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                        >
                                        <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                            <rect x="3" y="5" width="18" height="14" rx="2"/>
                                            <path d="m4 7 8 6 8-6"/>
                                        </svg>
                                    </div>
                                </div>

                                <div class="grid gap-5 md:grid-cols-2">
                                    <div>
                                        <label class="mb-2 block text-sm font-semibold text-slate-700">
                                            Password
                                            <span class="text-red-500">*</span>
                                        </label>
                                        <div class="relative">
                                            <input
                                                id="password"
                                                type="password"
                                                name="password"
                                                placeholder="Create a password"
                                                required
                                                class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            >
                                            <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                <rect x="5" y="11" width="14" height="9" rx="2"/>
                                                <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
                                            </svg>
                                            <button type="button" class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600 focus:outline-none" data-toggle-password="password" aria-label="Show password">
                                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/>
                                                    <circle cx="12" cy="12" r="3"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label class="mb-2 block text-sm font-semibold text-slate-700">
                                            Confirm Password
                                            <span class="text-red-500">*</span>
                                        </label>
                                        <div class="relative">
                                            <input
                                                id="password_confirmation"
                                                type="password"
                                                name="password_confirmation"
                                                placeholder="Repeat password"
                                                required
                                                class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-11 text-sm text-slate-900 placeholder:text-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            >
                                            <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                <rect x="5" y="11" width="14" height="9" rx="2"/>
                                                <path d="M8 11V7a4 4 0 1 1 8 0v4"/>
                                            </svg>
                                            <button type="button" class="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 transition hover:text-slate-600 focus:outline-none" data-toggle-password="password_confirmation" aria-label="Show password confirmation">
                                                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                    <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/>
                                                    <circle cx="12" cy="12" r="3"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div class="rounded-2xl border border-blue-100 bg-blue-50/80 p-3">
                                    <div class="flex flex-wrap gap-3 text-xs font-medium text-slate-600">
                                        <span class="password-rule inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-slate-400 shadow-sm ring-1 ring-slate-200" data-rule="length">
                                            <span class="password-dot inline-flex h-2 w-2 rounded-full bg-slate-300"></span>
                                            8+ characters
                                        </span>
                                        <span class="password-rule inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-slate-400 shadow-sm ring-1 ring-slate-200" data-rule="number">
                                            <span class="password-dot inline-flex h-2 w-2 rounded-full bg-slate-300"></span>
                                            Includes a number
                                        </span>
                                        <span class="password-rule inline-flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-slate-400 shadow-sm ring-1 ring-slate-200" data-rule="letter">
                                            <span class="password-dot inline-flex h-2 w-2 rounded-full bg-slate-300"></span>
                                            Includes a letter
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <h3 class="mb-4 text-lg font-bold text-slate-900">Personal Information</h3>
                                    <div>
                                        <label class="mb-2 block text-sm font-semibold text-slate-700">
                                            Role
                                            <span class="text-red-500">*</span>
                                        </label>
                                        <div class="relative">
                                            <select
                                                name="role"
                                                class="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-11 pr-10 text-sm text-slate-900 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100"
                                            >
                                                <option value="Cashier">Cashier</option>
                                                <option value="Owner">Owner</option>
                                            </select>
                                            <svg class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                <path d="M8 9h8l-4 5-4-5Z"/>
                                                <path d="M7 15h10v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2Z"/>
                                            </svg>
                                            <svg class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                                
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                class="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-indigo-700 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-blue-200 transition hover:-translate-y-0.5 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-4 focus:ring-blue-200"
                            >
                                Create Account
                                <span aria-hidden="true">→</span>
                            </button>

                            <p class="text-center text-sm text-slate-600">
                                Already have an account?
                                <a href="{{ route('login') }}" class="ml-1 font-semibold text-slate-900 underline decoration-slate-300 underline-offset-4 transition hover:text-blue-700">
                                    Log in
                                </a>
                            </p>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function () {
            document.querySelectorAll('[data-toggle-password]').forEach(function (button) {
                button.addEventListener('click', function () {
                    const inputId = button.getAttribute('data-toggle-password');
                    const input = document.getElementById(inputId);
                    const isPassword = input.type === 'password';

                    input.type = isPassword ? 'text' : 'password';
                    button.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
                });
            });

            const passwordInput = document.getElementById('password');
            const passwordRules = document.querySelectorAll('.password-rule');
            const ruleChecks = {
                length: function (value) {
                    return value.length >= 8;
                },
                number: function (value) {
                    return /\d/.test(value);
                },
                letter: function (value) {
                    return /[A-Za-z]/.test(value);
                },
            };

            function updatePasswordRules() {
                const value = passwordInput.value;

                passwordRules.forEach(function (rule) {
                    const key = rule.dataset.rule;
                    const isMet = ruleChecks[key](value);

                    rule.classList.toggle('text-slate-400', !isMet);
                    rule.classList.toggle('text-emerald-600', isMet);
                    rule.classList.toggle('font-semibold', isMet);

                    const dot = rule.querySelector('.password-dot');
                    dot.classList.toggle('bg-slate-300', !isMet);
                    dot.classList.toggle('bg-emerald-500', isMet);
                });
            }

            passwordInput.addEventListener('input', updatePasswordRules);
            updatePasswordRules();
        });
    </script>
</body>

</html>
