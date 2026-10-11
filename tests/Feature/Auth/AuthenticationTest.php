<?php

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

test('login screen can be rendered', function () {
    $response = $this->get('/login');

    $response->assertStatus(200);
});

test('users can authenticate using the login screen', function () {
    $user = User::factory()->create();

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));
});

test('users can not authenticate with invalid password', function () {
    $user = User::factory()->create();

    $this->post('/login', [
        'email' => $user->email,
        'password' => 'wrong-password',
    ]);

    $this->assertGuest();
});

test('users can choose to be remembered when logging in', function () {
    $email = 'remembered@example.com';

    DB::table('users')->insert([
        'name' => 'Remembered User',
        'email' => $email,
        'password' => Hash::make('password'),
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $response = $this->post('/login', [
        'email' => $email,
        'password' => 'password',
        'remember' => 'on',
    ]);

    $response->assertRedirect(route('dashboard', absolute: false));
    expect(DB::table('users')->where('email', $email)->value('remember_token'))->not->toBeNull();
});

test('users can logout', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $this->assertGuest();
    $response->assertRedirect('/');
});
