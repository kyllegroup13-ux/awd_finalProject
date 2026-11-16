<?php

use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

test('active cashiers can access POS without email verification', function () {
    $cashier = User::factory()->create([
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    actingAs($cashier)
        ->get('/cashier/pos')
        ->assertOk();
});

test('active owners can access dashboard without email verification', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);

    actingAs($owner)
        ->get('/dashboard')
        ->assertOk();
});

test('guests cannot access protected pages', function () {
    get('/dashboard')
        ->assertRedirect('/login');

    get('/cashier/pos')
        ->assertRedirect('/login');
});
