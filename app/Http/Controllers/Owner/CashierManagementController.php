<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class CashierManagementController extends Controller
{
    public function index(): Response
    {
        $cashiers = User::query()
            ->where('role', 'cashier')
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get([
                'id',
                'name',
                'email',
                'status',
                'created_at',
            ]);

        return Inertia::render('owner/cashiers', [
            'cashiers' => $cashiers,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],
            'password' => [
                'required',
                'confirmed',
                Password::min(8)->letters()->numbers(),
            ],
        ]);

        User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => 'cashier',
            'status' => 'Active',
        ]);

        return redirect()
            ->route('owner.cashiers.index')
            ->with('success', 'Cashier account created successfully.');
    }


    public function updateStatus(Request $request, User $cashier): RedirectResponse
    {
        // Only Cashier accounts can be managed through this endpoint.
        abort_unless($cashier->role === 'cashier', 404);

        $validated = $request->validate([
            'status' => ['required', 'in:Active,Inactive'],
        ]);

        $cashier->update([
            'status' => $validated['status'],
        ]);

        return redirect()
            ->route('owner.cashiers.index')
            ->with(
                'success',
                $validated['status'] === 'Active'
                    ? 'Cashier account activated successfully.'
                    : 'Cashier account deactivated successfully.'
            );
    }
}
