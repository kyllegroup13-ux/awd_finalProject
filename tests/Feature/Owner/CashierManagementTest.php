<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia;

use function Pest\Laravel\actingAs;

test('active owners can view their cashier accounts', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);
    $cashier = User::factory()->create([
        'name' => 'Sam Cashier',
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    actingAs($owner)
        ->get(route('owner.cashiers.index'))
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('owner/cashiers')
            ->has('cashiers', 1)
            ->where('cashiers.0.id', $cashier->id)
            ->where('cashiers.0.name', 'Sam Cashier')
        );
});

test('owners can create an active cashier account and receive a flash message', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);

    actingAs($owner)
        ->post(route('owner.cashiers.store'), [
            'name' => 'New Cashier',
            'email' => 'new.cashier@example.com',
            'password' => 'SecurePass123',
            'password_confirmation' => 'SecurePass123',
        ])
        ->assertRedirect(route('owner.cashiers.index'))
        ->assertSessionHas('success', 'Cashier account created successfully.');

    $cashier = User::query()->where('email', 'new.cashier@example.com')->firstOrFail();

    expect($cashier->role)->toBe('cashier')
        ->and($cashier->status)->toBe('Active')
        ->and(Hash::check('SecurePass123', $cashier->password))->toBeTrue();

    actingAs($owner)
        ->get(route('owner.cashiers.index'))
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('flash.success', 'Cashier account created successfully.')
        );
});

test('owners can deactivate and reactivate a cashier transaction dashboard', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);
    $cashier = User::factory()->create([
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    actingAs($owner)
        ->patch(route('owner.cashiers.update-status', $cashier), [
            'status' => 'Inactive',
        ])
        ->assertRedirect(route('owner.cashiers.index'));

    expect(
        User::query()
            ->where('id', $cashier->id)
            ->where('status', 'Inactive')
            ->exists()
    )->toBeTrue();

    actingAs($cashier->fresh())
        ->get(route('cashier.sales'))
        ->assertForbidden();

    actingAs($owner)
        ->patch(route('owner.cashiers.update-status', $cashier), [
            'status' => 'Active',
        ])
        ->assertRedirect(route('owner.cashiers.index'));

    expect(
        User::query()
            ->where('id', $cashier->id)
            ->where('status', 'Active')
            ->exists()
    )->toBeTrue();

    actingAs($cashier->fresh())
        ->get(route('cashier.sales'))
        ->assertOk();
});

test('cashiers cannot open the cashier management page', function () {
    $cashier = User::factory()->create([
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    actingAs($cashier)
        ->get(route('owner.cashiers.index'))
        ->assertForbidden();
});

test('owners cannot change the status of another owner through cashier management', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);

    actingAs($owner)
        ->patch(route('owner.cashiers.update-status', $owner), [
            'status' => 'Inactive',
        ])
        ->assertNotFound();

    expect(
        User::query()
            ->where('id', $owner->id)
            ->where('role', 'owner')
            ->where('status', 'Active')
            ->exists()
    )->toBeTrue();
});
