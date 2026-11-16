
<?php

use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\get;

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

test('the dashboard shows only the five most recent completed transactions', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);
    $cashier = User::factory()->create([
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    $sales = collect(range(0, 5))->map(function (int $offset) use ($cashier) {
        $sale = Sale::create([
            'receipt_number' => sprintf('DASH-%04d', $offset),
            'cashier_id' => $cashier->id,
            'subtotal' => '100.00',
            'discount' => '0.00',
            'total_amount' => '100.00',
            'status' => 'completed',
        ]);
        $sale->forceFill([
            'created_at' => Carbon::parse('2026-11-11 12:00:00')->subMinutes($offset),
        ])->save();

        return $sale;
    });

    actingAs($owner)
        ->get('/dashboard')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->has('recentSales', 5)
            ->where('recentSales.0.id', $sales[0]->id));
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
