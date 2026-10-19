<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;

function makeApiTestUser(
    string $role = 'cashier',
    string $status = 'Active'
): User {
    return User::create([
        'name' => 'API Test User',
        'email' => Str::uuid() . '@example.test',
        'password' => 'test-password-123',
        'role' => $role,
        'status' => $status,
    ]);
}

function makeApiTestVariant(): ProductVariant
{
    $category = Category::create([
        'name' => 'API Test Category',
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'API Test Shirt',
        'status' => 'Active',
    ]);

    return ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'API-SHIRT-001',
        'size' => 'M',
        'color' => 'Black',
        'price' => '200.00',
        'stock_quantity' => 10,
        'reorder_level' => 2,
    ]);
}

function makeApiCheckoutPayload(
    int $variantId,
    ?string $key = null
): array {
    return [
        'idempotency_key' => $key ?? (string) Str::uuid(),
        'items' => [
            [
                'product_variant_id' => $variantId,
                'quantity' => 2,
            ],
        ],
        'payment_method' => 'cash',
        'amount_received' => '500.00',
    ];
}

test('guest cannot checkout', function () {
    $variant = makeApiTestVariant();

    $this->postJson(
        '/api/cashier/checkout',
        makeApiCheckoutPayload($variant->id)
    )->assertUnauthorized();

    expect(Sale::count())->toBe(0);
});

test('active owner cannot use cashier checkout', function () {
    $owner = makeApiTestUser('owner');

    Sanctum::actingAs($owner);

    $variant = makeApiTestVariant();

    $this->postJson(
        '/api/cashier/checkout',
        makeApiCheckoutPayload($variant->id)
    )->assertForbidden();

    expect(Sale::count())->toBe(0);
});

test('inactive cashier cannot checkout', function () {
    $cashier = makeApiTestUser('cashier', 'Inactive');

    Sanctum::actingAs($cashier);

    $variant = makeApiTestVariant();

    $this->postJson(
        '/api/cashier/checkout',
        makeApiCheckoutPayload($variant->id)
    )->assertForbidden();

    expect(Sale::count())->toBe(0);
});

test('active cashier can checkout successfully', function () {
    $cashier = makeApiTestUser();

    Sanctum::actingAs($cashier);

    $variant = makeApiTestVariant();

    $response = $this->postJson(
        '/api/cashier/checkout',
        makeApiCheckoutPayload($variant->id)
    );

    $response->assertCreated()
        ->assertJsonPath('message', 'Sale completed successfully.')
        ->assertJsonPath('sale.cashier_id', $cashier->id);

    expect(Sale::count())->toBe(1);
    expect($variant->fresh()->stock_quantity)->toBe(8);
});

test('duplicate checkout returns HTTP 200 without another stock deduction', function () {
    $cashier = makeApiTestUser();

    Sanctum::actingAs($cashier);

    $variant = makeApiTestVariant();

    $payload = makeApiCheckoutPayload($variant->id);

    $first = $this->postJson('/api/cashier/checkout', $payload);
    $second = $this->postJson('/api/cashier/checkout', $payload);

    $first->assertCreated();

    $second->assertOk()
        ->assertJsonPath(
            'message',
            'Existing sale returned successfully.'
        );

    expect($second->json('sale.id'))
        ->toBe($first->json('sale.id'));

    expect(Sale::count())->toBe(1);
    expect($variant->fresh()->stock_quantity)->toBe(8);
});

test('different payload with the same checkout key returns HTTP 409', function () {
    $cashier = makeApiTestUser();

    Sanctum::actingAs($cashier);

    $variant = makeApiTestVariant();

    $payload = makeApiCheckoutPayload($variant->id);

    $this->postJson('/api/cashier/checkout', $payload)
        ->assertCreated();

    $payload['items'][0]['quantity'] = 3;

    $this->postJson('/api/cashier/checkout', $payload)
        ->assertStatus(409);

    expect(Sale::count())->toBe(1);
    expect($variant->fresh()->stock_quantity)->toBe(8);
});

test('checkout rejects an invalid idempotency key', function () {
    $cashier = makeApiTestUser();

    Sanctum::actingAs($cashier);

    $variant = makeApiTestVariant();

    $payload = makeApiCheckoutPayload($variant->id);
    $payload['idempotency_key'] = 'invalid-key';

    $this->postJson('/api/cashier/checkout', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['idempotency_key']);

    expect(Sale::count())->toBe(0);
});

test('checkout rejects duplicate product variants', function () {
    $cashier = makeApiTestUser();

    Sanctum::actingAs($cashier);

    $variant = makeApiTestVariant();

    $payload = makeApiCheckoutPayload($variant->id);

    $payload['items'][] = [
        'product_variant_id' => $variant->id,
        'quantity' => 1,
    ];

    $this->postJson('/api/cashier/checkout', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'items.0.product_variant_id',
            'items.1.product_variant_id',
        ]);

    expect(Sale::count())->toBe(0);
});

test('checkout rejects missing GCash reference number', function () {
    $cashier = makeApiTestUser();

    Sanctum::actingAs($cashier);

    $variant = makeApiTestVariant();

    $payload = makeApiCheckoutPayload($variant->id);

    $payload['payment_method'] = 'gcash';
    $payload['amount_received'] = '400.00';

    $this->postJson('/api/cashier/checkout', $payload)
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['reference_number']);

    expect(Sale::count())->toBe(0);
});
