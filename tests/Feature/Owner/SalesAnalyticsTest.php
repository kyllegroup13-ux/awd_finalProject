<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Illuminate\Support\Carbon;

use function Pest\Laravel\actingAs;

test('owners can see the best and least selling products for a date range', function () {
    $owner = User::factory()->create(['role' => 'owner']);
    $cashier = User::factory()->create(['role' => 'cashier']);

    $category = Category::create(['name' => 'Sales report category']);
    $shirt = Product::create([
        'category_id' => $category->id,
        'name' => 'Cotton Shirt',
        'status' => 'Active',
    ]);
    $pants = Product::create([
        'category_id' => $category->id,
        'name' => 'Linen Pants',
        'status' => 'Active',
    ]);
    $shirtSmall = ProductVariant::create([
        'product_id' => $shirt->id,
        'sku' => 'REPORT-SHIRT-S',
        'size' => 'S',
        'color' => 'Blue',
        'price' => '100.00',
        'stock_quantity' => 20,
        'reorder_level' => 5,
    ]);
    $shirtMedium = ProductVariant::create([
        'product_id' => $shirt->id,
        'sku' => 'REPORT-SHIRT-M',
        'size' => 'M',
        'color' => 'Blue',
        'price' => '100.00',
        'stock_quantity' => 20,
        'reorder_level' => 5,
    ]);
    $pantsVariant = ProductVariant::create([
        'product_id' => $pants->id,
        'sku' => 'REPORT-PANTS-M',
        'size' => 'M',
        'color' => 'Black',
        'price' => '400.00',
        'stock_quantity' => 20,
        'reorder_level' => 5,
    ]);

    $createSale = function (string $receipt, string $status, string $createdAt) use ($cashier): Sale {
        $sale = Sale::create([
            'receipt_number' => $receipt,
            'cashier_id' => $cashier->id,
            'subtotal' => '1000.00',
            'discount' => '0.00',
            'total_amount' => '1000.00',
            'status' => $status,
        ]);
        $sale->forceFill([
            'created_at' => Carbon::parse($createdAt),
        ])->save();

        return $sale;
    };

    $inRange = $createSale('REPORT-001', 'completed', '2026-11-10 12:00:00');
    SaleItem::create([
        'sale_id' => $inRange->id,
        'product_variant_id' => $shirtSmall->id,
        'product_name' => $shirt->name,
        'sku' => $shirtSmall->sku,
        'size' => $shirtSmall->size,
        'color' => $shirtSmall->color,
        'quantity' => 3,
        'unit_price' => '100.00',
        'subtotal' => '300.00',
    ]);
    SaleItem::create([
        'sale_id' => $inRange->id,
        'product_variant_id' => $shirtMedium->id,
        'product_name' => $shirt->name,
        'sku' => $shirtMedium->sku,
        'size' => $shirtMedium->size,
        'color' => $shirtMedium->color,
        'quantity' => 2,
        'unit_price' => '100.00',
        'subtotal' => '200.00',
    ]);
    SaleItem::create([
        'sale_id' => $inRange->id,
        'product_variant_id' => $pantsVariant->id,
        'product_name' => $pants->name,
        'sku' => $pantsVariant->sku,
        'size' => $pantsVariant->size,
        'color' => $pantsVariant->color,
        'quantity' => 1,
        'unit_price' => '400.00',
        'subtotal' => '400.00',
    ]);

    $pendingSale = $createSale('REPORT-002', 'pending', '2026-11-10 13:00:00');
    SaleItem::create([
        'sale_id' => $pendingSale->id,
        'product_variant_id' => $pantsVariant->id,
        'product_name' => $pants->name,
        'sku' => $pantsVariant->sku,
        'size' => $pantsVariant->size,
        'color' => $pantsVariant->color,
        'quantity' => 20,
        'unit_price' => '400.00',
        'subtotal' => '8000.00',
    ]);

    $outsideRange = $createSale('REPORT-003', 'completed', '2026-11-11 12:00:00');
    SaleItem::create([
        'sale_id' => $outsideRange->id,
        'product_variant_id' => $pantsVariant->id,
        'product_name' => $pants->name,
        'sku' => $pantsVariant->sku,
        'size' => $pantsVariant->size,
        'color' => $pantsVariant->color,
        'quantity' => 30,
        'unit_price' => '400.00',
        'subtotal' => '12000.00',
    ]);

    actingAs($owner)
        ->getJson(route('owner.sales-analytics.products', [
            'from' => '2026-11-10',
            'to' => '2026-11-10',
        ]))
        ->assertOk()
        ->assertJsonPath('best_selling_product.product_name', 'Cotton Shirt')
        ->assertJsonPath('best_selling_product.units_sold', 5)
        ->assertJsonPath('best_selling_product.revenue', '500.00')
        ->assertJsonPath('least_selling_product.product_name', 'Linen Pants')
        ->assertJsonPath('least_selling_product.units_sold', 1)
        ->assertJsonPath('least_selling_product.revenue', '400.00');
});

test('cashiers cannot access product sales analytics', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);

    actingAs($cashier)
        ->getJson(route('owner.sales-analytics.products', [
            'from' => '2026-11-10',
            'to' => '2026-11-10',
        ]))
        ->assertForbidden();
});

test('owners can see gross income from completed sale subtotals', function () {
    $owner = User::factory()->create(['role' => 'owner']);
    $cashier = User::factory()->create(['role' => 'cashier']);

    Sale::create([
        'receipt_number' => 'GROSS-001',
        'cashier_id' => $cashier->id,
        'subtotal' => '250.00',
        'discount' => '50.00',
        'total_amount' => '200.00',
        'status' => 'completed',
    ]);

    Sale::create([
        'receipt_number' => 'GROSS-002',
        'cashier_id' => $cashier->id,
        'subtotal' => '500.00',
        'discount' => '50.00',
        'total_amount' => '450.00',
        'status' => 'completed',
    ]);

    Sale::create([
        'receipt_number' => 'GROSS-003',
        'cashier_id' => $cashier->id,
        'subtotal' => '1000.00',
        'discount' => '0.00',
        'total_amount' => '1000.00',
        'status' => 'pending',
    ]);

    actingAs($owner)
        ->getJson(route('owner.sales-analytics.trends'))
        ->assertOk()
        ->assertJsonPath('daily.0.total_revenue', 650)
        ->assertJsonPath('daily.0.total_gross_income', 750)
        ->assertJsonPath('daily.0.transaction_count', 2);
});

test('product sales analytics returns empty product stats when the range has no sales', function () {
    $owner = User::factory()->create(['role' => 'owner']);

    actingAs($owner)
        ->getJson(route('owner.sales-analytics.products', [
            'from' => '2026-11-10',
            'to' => '2026-11-10',
        ]))
        ->assertOk()
        ->assertExactJson([
            'best_selling_product' => null,
            'least_selling_product' => null,
        ]);
});

test('product sales analytics requires a valid date range', function () {
    $owner = User::factory()->create(['role' => 'owner']);

    actingAs($owner)
        ->getJson(route('owner.sales-analytics.products', [
            'from' => '2026-11-11',
            'to' => '2026-11-10',
        ]))
        ->assertUnprocessable()
        ->assertJsonValidationErrors('to');
});
