<?php

use App\Models\Category;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

it('allows an owner to upload a product image when creating a product', function () {
    Storage::fake('public');

    $owner = User::factory()->create([
        'role' => 'owner',
    ]);

    $category = Category::create([
        'name' => 'Tops',
    ]);

    $response = $this->actingAs($owner)->post('/owner/products', [
        'category_id' => $category->id,
        'name' => 'Featured Shirt',
        'brand' => 'M3',
        'description' => 'A sample image upload test product.',
        'status' => 'Active',
        'image' => UploadedFile::fake()->create('featured-shirt.jpg', 100, 'image/jpeg'),
        'variants' => [[
            'sku' => 'SHIRT-IMG-01',
            'size' => 'M',
            'color' => 'Black',
            'price' => 299.00,
            'stock_quantity' => 12,
            'reorder_level' => 4,
        ]],
    ]);

    $response->assertStatus(201);

    $product = \App\Models\Product::where('name', 'Featured Shirt')->firstOrFail();
    expect($product->image)->not->toBeNull()
        ->and(Str::startsWith($product->image, '/storage/'))->toBeTrue();

    $storedPath = Str::after($product->image, '/storage/');
    Storage::disk('public')->assertExists($storedPath);
});
