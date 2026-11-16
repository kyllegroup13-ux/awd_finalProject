<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register', [
            'ownerAvailable' => ! User::query()->where('role', 'owner')->exists(),
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $roleRules = ['sometimes', 'in:cashier,owner'];

        if ($request->input('role') === 'owner') {
            $roleRules[] = 'unique:users,role';
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'role' => $roleRules,
        ], [
            'role.unique' => 'An owner account already exists.',
        ]);

        $role = $validated['role'] ?? 'cashier';

        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => $role,
                'status' => 'Active',
            ]);
        } catch (UniqueConstraintViolationException $exception) {
            $errors = [];

            if (User::query()->where('email', $validated['email'])->exists()) {
                $errors['email'] = 'The email has already been taken.';
            }

            if ($role === 'owner' && User::query()->where('role', 'owner')->exists()) {
                $errors['role'] = 'An owner account already exists.';
            }

            if ($errors === []) {
                throw $exception;
            }

            throw ValidationException::withMessages($errors);
        }

        event(new Registered($user));

        return redirect()->route('login')->with(
            'status',
            'Account created successfully. Please log in.'
        );
    }
}
