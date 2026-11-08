<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function createSalesHistoryCashier(
    string $role = 'cashier',
    string $status = 'Active'
): User {
    return User::create([
        'name' => 'History Test User',
        'email' => Str::uuid().'@example.test',
        'password' => 'test-password-123',
        'role' => $role,
        'status' => $status,
    ]);
}

function createSalesHistoryVariant(): ProductVariant
{
    $category = Category::create([
        'name' => 'Sales History Category',
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Sales History Shirt',
        'image' => 'https://example.com/shirt.jpg',
        'status' => 'Active',
    ]);

    return ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'HISTORY-SHIRT-001',
        'size' => 'M',
        'color' => 'Black',
        'price' => '200.00',
        'stock_quantity' => 50,
        'reorder_level' => 5,
    ]);
}

function createSalesHistorySale(
    User $cashier,
    ProductVariant $variant
): Sale {
    Sanctum::actingAs($cashier);

    $response = test()->postJson('/api/cashier/checkout', [
        'idempotency_key' => (string) Str::uuid(),
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ],
        ],
        'payment_method' => 'cash',
        'amount_received' => '200.00',
    ]);

    $response->assertCreated();

    return Sale::findOrFail($response->json('sale.id'));
}

test('cashier can view their own sales history', function () {
    $cashier = createSalesHistoryCashier();
    $variant = createSalesHistoryVariant();

    $sale = createSalesHistorySale($cashier, $variant);

    Sanctum::actingAs($cashier);

    test()->getJson('/api/cashier/sales')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.id', $sale->id)
        ->assertJsonPath('data.0.cashier_id', $cashier->id)
        ->assertJsonCount(1, 'data.0.items')
        ->assertJsonPath('data.0.items.0.product_variant.product.image', 'https://example.com/shirt.jpg');
});

test('cashier sales cards include only transactions created today', function () {
    $today = Carbon::parse('2026-11-08 10:00:00');
    Carbon::setTestNow($today);

    $cashier = createSalesHistoryCashier();
    $variant = createSalesHistoryVariant();
    $todaysSale = createSalesHistorySale($cashier, $variant);
    $yesterdaysSale = createSalesHistorySale($cashier, $variant);

    $yesterdaysSale->forceFill([
        'created_at' => $today->copy()->subDay(),
    ])->save();

    Sanctum::actingAs($cashier);

    test()->getJson('/api/cashier/sales')
        ->assertOk()
        ->assertJsonPath('total', 1)
        ->assertJsonPath('data.0.id', $todaysSale->id);

    Carbon::setTestNow();
});

test('cashier cannot see another cashiers sales in history', function () {
    $cashierA = createSalesHistoryCashier();
    $cashierB = createSalesHistoryCashier();
    $variant = createSalesHistoryVariant();

    $saleA = createSalesHistorySale($cashierA, $variant);
    $saleB = createSalesHistorySale($cashierB, $variant);

    Sanctum::actingAs($cashierA);

    $response = test()->getJson('/api/cashier/sales')
        ->assertOk()
        ->assertJsonPath('total', 1);

    expect(collect($response->json('data'))->pluck('id')->all())
        ->toContain($saleA->id)
        ->not->toContain($saleB->id);
});

test('cashier can view their own sale details', function () {
    $cashier = createSalesHistoryCashier();
    $variant = createSalesHistoryVariant();

    $sale = createSalesHistorySale($cashier, $variant);

    Sanctum::actingAs($cashier);

    test()->getJson("/api/cashier/sales/{$sale->id}")
        ->assertOk()
        ->assertJsonPath('id', $sale->id)
        ->assertJsonPath('cashier_id', $cashier->id)
        ->assertJsonCount(1, 'items')
        ->assertJsonPath('payment.payment_method', 'cash');
});

test('cashier cannot view another cashiers sale details', function () {
    $cashierA = createSalesHistoryCashier();
    $cashierB = createSalesHistoryCashier();
    $variant = createSalesHistoryVariant();

    $sale = createSalesHistorySale($cashierA, $variant);

    Sanctum::actingAs($cashierB);

    test()->getJson("/api/cashier/sales/{$sale->id}")
        ->assertForbidden();
});

test('guest cannot access cashier sales history', function () {
    test()->getJson('/api/cashier/sales')
        ->assertUnauthorized();
});

test('owner cannot access cashier sales history', function () {
    $owner = createSalesHistoryCashier('owner');

    Sanctum::actingAs($owner);

    test()->getJson('/api/cashier/sales')
        ->assertForbidden();
});

test('inactive cashier cannot access sales history', function () {
    $cashier = createSalesHistoryCashier('cashier', 'Inactive');

    Sanctum::actingAs($cashier);

    test()->getJson('/api/cashier/sales')
        ->assertForbidden();
});
