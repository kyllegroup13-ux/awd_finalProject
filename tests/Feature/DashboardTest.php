
<?php

use App\Models\User;
use Tests\TestCase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

uses(TestCase::class);

test('guests are redirected to the login page', function () {
    get('/dashboard')->assertRedirect('/login');
});

test('guests are redirected from the root route to the login page', function () {
    get('/')->assertRedirect('/login');
});

test('active owners can visit the dashboard', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);

    actingAs($owner)
        ->get('/dashboard')
        ->assertOk();
});

test('cashiers cannot access the owner dashboard', function () {
    $cashier = User::factory()->create([
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    actingAs($cashier)
        ->get('/dashboard')
        ->assertForbidden();
});
