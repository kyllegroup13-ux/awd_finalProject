<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Inertia\Testing\AssertableInertia;

use function Pest\Laravel\actingAs;

test('inventory list paginates ten matching variants and keeps filters', function () {
    $owner = User::factory()->create([
        'role' => 'owner',
        'status' => 'Active',
    ]);
    $category = Category::create(['name' => 'Inventory pagination']);
    $product = Product::create([
        'category_id' => $category->id,
        'name' => 'Pagination Test Product',
        'status' => 'Active',
    ]);

    $variants = collect(range(1, 11))->map(fn (int $number) => ProductVariant::create([
        'product_id' => $product->id,
        'sku' => sprintf('PAGE-%03d', $number),
        'size' => (string) $number,
        'color' => 'Blue',
        'price' => '100.00',
        'stock_quantity' => 10,
        'reorder_level' => 5,
    ]));

    actingAs($owner)
        ->get('/owner/manage/inventory?status=in')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->component('owner/inventory')
            ->where('variants.total', 11)
            ->where('variants.per_page', 10)
            ->where('variants.current_page', 1)
            ->has('variants.data', 10)
            ->where('variants.data.0.id', $variants[10]->id)
            ->where('variants.data.9.id', $variants[1]->id)
            ->where('variants.next_page_url', fn (string $url) => str_contains($url, 'status=in')
                && str_contains($url, 'page=2')));

    actingAs($owner)
        ->get('/owner/manage/inventory?status=in&page=2')
        ->assertOk()
        ->assertInertia(fn (AssertableInertia $page) => $page
            ->where('variants.total', 11)
            ->where('variants.per_page', 10)
            ->where('variants.current_page', 2)
            ->has('variants.data', 1)
            ->where('variants.data.0.id', $variants[0]->id));
});
