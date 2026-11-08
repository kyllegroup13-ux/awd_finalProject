<?php

use App\Models\Category;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia;
use Laravel\Sanctum\Sanctum;

use function Pest\Laravel\actingAs;

it('creates each product variant with its own stock quantity', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
    ]);

    $category = Category::create([
        'name' => 'Tops',
    ]);

    $response = actingAs($owner)->postJson('/owner/products', [
        'category_id' => $category->id,
        'name' => 'Stocked Shirt',
        'variants' => [
            [
                'sku' => 'STOCKED-S-BLACK',
                'size' => 'S',
                'color' => 'Black',
                'price' => 299,
                'stock_quantity' => 3,
                'reorder_level' => 2,
            ],
            [
                'sku' => 'STOCKED-M-BLACK',
                'size' => 'M',
                'color' => 'Black',
                'price' => 299,
                'stock_quantity' => 8,
                'reorder_level' => 2,
            ],
        ],
    ]);

    $response->assertStatus(201);

    $smallVariant = ProductVariant::where('sku', 'STOCKED-S-BLACK')->firstOrFail();
    $mediumVariant = ProductVariant::where('sku', 'STOCKED-M-BLACK')->firstOrFail();

    expect($smallVariant->stock_quantity)->toBe(3)
        ->and($mediumVariant->stock_quantity)->toBe(8);

    expect(
        DB::table('inventory_transactions')
            ->where('product_variant_id', $smallVariant->id)
            ->where('quantity', 3)
            ->where('previous_stock', 0)
            ->where('new_stock', 3)
            ->exists()
    )->toBeTrue();

    expect(
        DB::table('inventory_transactions')
            ->where('product_variant_id', $mediumVariant->id)
            ->where('quantity', 8)
            ->where('previous_stock', 0)
            ->where('new_stock', 8)
            ->exists()
    )->toBeTrue();
});

it('archives and restores a product while preserving its inventory history', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
    ]);

    $category = Category::create([
        'name' => 'Tops',
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Archived Shirt',
        'status' => 'Active',
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'ARCHIVED-SHIRT-M-BLACK',
        'size' => 'M',
        'color' => 'Black',
        'price' => '200.00',
        'stock_quantity' => 5,
        'reorder_level' => 2,
    ]);

    $transaction = InventoryTransaction::create([
        'product_variant_id' => $variant->id,
        'user_id' => $owner->id,
        'transaction_type' => 'restock',
        'quantity' => 5,
        'previous_stock' => 0,
        'new_stock' => 5,
    ]);

    actingAs($owner)
        ->deleteJson("/owner/products/{$product->id}")
        ->assertOk()
        ->assertJsonPath('message', 'Product archived successfully.');

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'is_archived' => true,
    ]);
    $this->assertDatabaseHas('product_variants', [
        'id' => $variant->id,
    ]);
    $this->assertDatabaseHas('inventory_transactions', [
        'id' => $transaction->id,
    ]);

    actingAs($owner)
        ->get('/owner/manage/products')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('owner/products')
            ->where('archivedCount', 1)
            ->where('products.data', []));

    actingAs($owner)
        ->get('/owner/manage/products?archived=1')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('owner/products')
            ->where('archived', true)
            ->where('archivedCount', 1)
            ->where('products.data.0.id', $product->id));

    actingAs($owner)
        ->patchJson("/owner/products/{$product->id}/restore")
        ->assertOk()
        ->assertJsonPath('message', 'Product restored successfully.');

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'is_archived' => false,
    ]);

    actingAs($owner)
        ->get('/owner/manage/products')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('owner/products')
            ->where('archivedCount', 0)
            ->where('products.data.0.id', $product->id));
});

it('hides archived products from checkout and rejects a direct checkout request', function () {
    $cashier = User::factory()->create([
        'role' => 'cashier',
        'status' => 'Active',
    ]);

    $category = Category::create([
        'name' => 'Tops',
    ]);

    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Archived Shirt',
        'status' => 'Active',
        'is_archived' => true,
    ]);

    $variant = ProductVariant::create([
        'product_id' => $product->id,
        'sku' => 'ARCHIVED-SHIRT-S-BLACK',
        'size' => 'S',
        'color' => 'Black',
        'price' => '200.00',
        'stock_quantity' => 10,
        'reorder_level' => 2,
    ]);

    Sanctum::actingAs($cashier);

    $this->getJson('/api/cashier/products')
        ->assertOk()
        ->assertJsonMissing(['id' => $product->id]);

    $this->postJson('/api/cashier/checkout', [
        'idempotency_key' => '00000000-0000-4000-8000-000000000001',
        'items' => [
            [
                'product_variant_id' => $variant->id,
                'quantity' => 1,
            ],
        ],
        'payment_method' => 'cash',
        'amount_received' => '500.00',
    ])->assertUnprocessable()
        ->assertJsonValidationErrors('items');

    expect(Sale::count())->toBe(0);
});
