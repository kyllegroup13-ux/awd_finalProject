<?php

use App\Models\Category;
use App\Models\CheckoutRequest;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\User;
use App\Services\CheckoutService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

function makeCheckoutTestData(): array
{
    $cashier = User::create([
        'name' => 'Test Cashier',
        'email' => 'checkout-cashier@example.test',
        'password' => 'test-password-123',
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    $category = Category::create([
        'name' => 'Test Clothing',
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Test T-Shirt',
        'status' => 'Active',
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'TEST-SHIRT-001',
        'size' => 'M',
        'color' => 'Black',
        'price' => '200.00',
        'stock_quantity' => 10,
        'reorder_level' => 2,
    ]);

    return [$cashier, $variant];
}

function makeCheckoutPayload(
    int $variantId,
    string $key,
    int $quantity = 2,
    string $amount = '500.00'
): array {
    return [
        'idempotency_key' => $key,
        'items' => [
            [
                'product_variant_id' => $variantId,
                'quantity' => $quantity,
            ],
        ],
        'payment_method' => 'cash',
        'amount_received' => $amount,
    ];
}

test('successful checkout creates one sale and deducts stock', function () {
    [$cashier, $variant] = makeCheckoutTestData();

    $payload = makeCheckoutPayload(
        $variant->id,
        (string) Str::uuid()
    );

    $result = app(CheckoutService::class)
        ->checkout($payload, $cashier->id);

    expect($result['replayed'])->toBeFalse();
    expect($result['sale']->total_amount)->toBe('400.00');
    expect($variant->fresh()->stock_quantity)->toBe(8);

    expect(Sale::count())->toBe(1);
    expect(CheckoutRequest::count())->toBe(1);
    expect(InventoryTransaction::count())->toBe(1);

    expect(DB::table('sale_items')
        ->where('sale_id', $result['sale']->id)
        ->where('product_variant_id', $variant->id)
        ->where('quantity', 2)
        ->exists())->toBeTrue();

    expect(DB::table('payments')
        ->where('sale_id', $result['sale']->id)
        ->where('payment_method', 'cash')
        ->exists())->toBeTrue();
});

test('repeating checkout returns original sale without deducting stock twice', function () {
    [$cashier, $variant] = makeCheckoutTestData();

    $payload = makeCheckoutPayload(
        $variant->id,
        (string) Str::uuid()
    );

    $service = app(CheckoutService::class);

    $first = $service->checkout($payload, $cashier->id);
    $second = $service->checkout($payload, $cashier->id);

    expect($first['replayed'])->toBeFalse();
    expect($second['replayed'])->toBeTrue();

    expect($second['sale']->id)->toBe($first['sale']->id);
    expect($variant->fresh()->stock_quantity)->toBe(8);

    expect(Sale::count())->toBe(1);
    expect(CheckoutRequest::count())->toBe(1);
    expect(InventoryTransaction::count())->toBe(1);
});

test('reusing checkout key with different details is rejected', function () {
    [$cashier, $variant] = makeCheckoutTestData();

    $key = (string) Str::uuid();

    $service = app(CheckoutService::class);

    $service->checkout(
        makeCheckoutPayload($variant->id, $key, 2),
        $cashier->id
    );

    try {
        $service->checkout(
            makeCheckoutPayload($variant->id, $key, 3),
            $cashier->id
        );

        $this->fail('Expected a checkout conflict.');
    } catch (ConflictHttpException $exception) {
        expect($exception->getStatusCode())->toBe(409);
    }

    expect(Sale::count())->toBe(1);
    expect($variant->fresh()->stock_quantity)->toBe(8);
});

test('insufficient stock rolls back the checkout transaction', function () {
    [$cashier, $variant] = makeCheckoutTestData();

    $payload = makeCheckoutPayload(
        $variant->id,
        (string) Str::uuid(),
        20,
        '5000.00'
    );

    try {
        app(CheckoutService::class)
            ->checkout($payload, $cashier->id);

        $this->fail('Expected insufficient stock validation.');
    } catch (\Illuminate\Validation\ValidationException $exception) {
        expect($exception->errors())->toHaveKey('items');
    }

    expect(Sale::count())->toBe(0);
    expect(CheckoutRequest::count())->toBe(0);
    expect(InventoryTransaction::count())->toBe(0);
    expect($variant->fresh()->stock_quantity)->toBe(10);
});

test('insufficient cash payment rolls back checkout', function () {
    [$cashier, $variant] = makeCheckoutTestData();

    $payload = makeCheckoutPayload(
        $variant->id,
        (string) Str::uuid(),
        2,
        '100.00'
    );

    try {
        app(CheckoutService::class)
            ->checkout($payload, $cashier->id);

        $this->fail('Expected insufficient payment validation.');
    } catch (\Illuminate\Validation\ValidationException $exception) {
        expect($exception->errors())->toHaveKey('amount_received');
    }

    expect(Sale::count())->toBe(0);
    expect($variant->fresh()->stock_quantity)->toBe(10);
});

test('GCash payment must equal the checkout total', function () {
    [$cashier, $variant] = makeCheckoutTestData();

    $payload = makeCheckoutPayload(
        $variant->id,
        (string) Str::uuid()
    );

    $payload['payment_method'] = 'gcash';
    $payload['amount_received'] = '300.00';
    $payload['reference_number'] = 'GCASH-TEST-001';

    try {
        app(CheckoutService::class)
            ->checkout($payload, $cashier->id);

        $this->fail('Expected GCash amount validation.');
    } catch (\Illuminate\Validation\ValidationException $exception) {
        expect($exception->errors())->toHaveKey('amount_received');
    }

    expect(Sale::count())->toBe(0);
    expect($variant->fresh()->stock_quantity)->toBe(10);
});
