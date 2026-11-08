<?php

use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Auth;
use Inertia\Testing\AssertableInertia;

it('shows ten sales records per page and keeps date filters when navigating', function () {
    /** @var \Tests\TestCase $this */
    $owner = User::factory()->create([
        'role' => 'owner',
    ]);

    $cashier = User::factory()->create([
        'role' => 'cashier',
    ]);

    $sales = collect(range(0, 10))->map(function (int $offset) use ($cashier) {
        $sale = Sale::create([
            'receipt_number' => sprintf('PAGE-%04d', $offset),
            'cashier_id' => $cashier->id,
            'subtotal' => '100.00',
            'discount' => '0.00',
            'total_amount' => '100.00',
            'status' => 'completed',
        ]);

        $sale->forceFill([
            'created_at' => Carbon::parse('2026-11-08 12:00:00')->subMinutes($offset),
        ])->save();

        return $sale;
    });

    Auth::login($owner);

    $this->get('/owner/sales?from=2026-11-08&to=2026-11-08')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('owner/sales')
            ->where('sales.total', 11)
            ->where('sales.current_page', 1)
            ->has('sales.data', 10)
            ->where('sales.data.0.id', $sales[0]->id)
            ->where('sales.data.9.id', $sales[9]->id)
            ->where('sales.next_page_url', fn (string $url) => str_contains($url, 'from=2026-11-08')
                && str_contains($url, 'to=2026-11-08')
                && str_contains($url, 'page=2')));

    $this->get('/owner/sales?from=2026-11-08&to=2026-11-08&page=2')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('owner/sales')
            ->where('sales.total', 11)
            ->where('sales.current_page', 2)
            ->has('sales.data', 1)
            ->where('sales.data.0.id', $sales[10]->id)
            ->where('sales.prev_page_url', fn (string $url) => str_contains($url, 'from=2026-11-08')
                && str_contains($url, 'to=2026-11-08')
                && str_contains($url, 'page=1')));
});
