<?php

use App\Models\User;
use Illuminate\Database\UniqueConstraintViolationException;
use Inertia\Testing\AssertableInertia;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('registration screen can be rendered', function () {
    $response = $this->get('/register');

    $response->assertStatus(200);
});

test('registration screen only offers the owner role when no owner exists', function () {
    User::factory()->create(['role' => 'owner']);

    $this->get('/register')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('auth/register')
            ->where('ownerAvailable', false)
        );
});

test('register route is available to the app', function () {
    expect(route('register'))->toEndWith('/register');
    expect(route('login'))->toEndWith('/login');
});

test('users can register without being signed in and are redirected to the login screen', function () {
    $response = $this->post('/register', [
        'name' => 'New Cashier',
        'email' => 'cashier@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $this->assertGuest();
    $response->assertRedirect('/login');
    $response->assertSessionHas('status', 'Account created successfully. Please log in.');
});

test('owners can register with the owner role and login to the dashboard', function () {
    $response = $this->post('/register', [
        'name' => 'Owner User',
        'email' => 'owner@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'owner',
    ]);

    $this->assertGuest();
    $response->assertRedirect('/login');
    $this->assertDatabaseHas('users', [
        'email' => 'owner@example.com',
        'role' => 'owner',
    ]);

    $this->post('/login', [
        'email' => 'owner@example.com',
        'password' => 'password123',
    ])->assertRedirect('/dashboard');
});

test('guests cannot register another owner account', function () {
    User::factory()->create(['role' => 'owner']);

    $this->from('/register')->post('/register', [
        'name' => 'Second Owner',
        'email' => 'second-owner@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'owner',
    ])
        ->assertSessionHasErrors([
            'role' => 'An owner account already exists.',
        ]);

    $this->assertDatabaseMissing('users', [
        'email' => 'second-owner@example.com',
    ]);
    $this->assertDatabaseCount('users', 1);
});

test('guests can still register as cashiers when an owner exists', function () {
    User::factory()->create(['role' => 'owner']);

    $this->post('/register', [
        'name' => 'New Cashier',
        'email' => 'new-cashier@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'role' => 'cashier',
    ])->assertRedirect('/login');

    $this->assertDatabaseHas('users', [
        'email' => 'new-cashier@example.com',
        'role' => 'cashier',
    ]);
});

test('the database prevents creating a second owner account', function () {
    User::factory()->create(['role' => 'owner']);

    expect(fn () => User::factory()->create(['role' => 'owner']))
        ->toThrow(UniqueConstraintViolationException::class);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect('/cashier/sales');
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});
