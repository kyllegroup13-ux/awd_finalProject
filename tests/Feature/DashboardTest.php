
<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/dashboard')->assertRedirect('/login');
});

test('active owners can visit the dashboard', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);

    $this->actingAs($owner)
        ->get('/dashboard')
        ->assertOk();
});

test('cashiers cannot access the owner dashboard', function () {
    $cashier = User::factory()->create([
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    $this->actingAs($cashier)
        ->get('/dashboard')
        ->assertForbidden();
});
