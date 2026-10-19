<?php

use App\Models\User;

test('active cashiers can access POS without email verification', function () {
    $cashier = User::factory()->create([
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    $this->actingAs($cashier)
        ->get('/cashier/pos')
        ->assertOk();
});

test('active owners can access dashboard without email verification', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);

    $this->actingAs($owner)
        ->get('/dashboard')
        ->assertOk();
});

test('guests cannot access protected pages', function () {
    $this->get('/dashboard')
        ->assertRedirect('/login');

    $this->get('/cashier/pos')
        ->assertRedirect('/login');
});
