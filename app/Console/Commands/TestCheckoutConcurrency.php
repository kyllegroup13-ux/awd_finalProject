<?php

namespace App\Console\Commands;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TestCheckoutConcurrency extends Command
{
    protected $signature = 'test:checkout-concurrency
        {--prepare : Create isolated concurrency test data}';

    protected $description =
        'Prepare and inspect MySQL checkout concurrency tests';

    public function handle(): int
    {
        if (
            DB::connection()->getDriverName() !== 'mysql'
            || DB::connection()->getDatabaseName()
                !== 'm3_dry_goods_testing'
        ) {
            $this->error(
                'SAFETY BLOCK: Only m3_dry_goods_testing is allowed.'
            );

            return self::FAILURE;
        }

        $this->info('MySQL testing database verified.');

        if ($this->option('prepare')) {
            $this->prepareTestData();
        }

        $this->table(
            ['Table', 'Records'],
            [
                ['users', DB::table('users')->count()],
                ['products', DB::table('products')->count()],
                ['product_variants', DB::table('product_variants')->count()],
                ['sales', DB::table('sales')->count()],
                ['checkout_requests', DB::table('checkout_requests')->count()],
                ['inventory_transactions', DB::table('inventory_transactions')->count()],
            ]
        );

        return self::SUCCESS;
    }

    private function prepareTestData(): void
    {
        $runId = (string) Str::uuid();

        $cashierA = User::create([
            'name' => 'Concurrency Cashier A',
            'email' => 'concurrency-a-' . $runId . '@example.test',
            'password' => Str::random(40),
            'role' => 'cashier',
            'status' => 'Active',
        ]);

        $cashierB = User::create([
            'name' => 'Concurrency Cashier B',
            'email' => 'concurrency-b-' . $runId . '@example.test',
            'password' => Str::random(40),
            'role' => 'cashier',
            'status' => 'Active',
        ]);

        $category = Category::create([
            'name' => 'Concurrency Test ' . $runId,
        ]);

        $product = Product::create([
            'category_id' => $category->id,
            'name' => 'Concurrency Test Product',
            'status' => 'Active',
        ]);

        // Scenario 1: Same cashier, same checkout key.
        $duplicateVariant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'DUP-' . $runId,
            'size' => 'M',
            'color' => 'Black',
            'price' => '100.00',
            'stock_quantity' => 10,
            'reorder_level' => 2,
        ]);

        // Scenario 2: Different cashiers, only one item available.
        $limitedVariant = ProductVariant::create([
            'product_id' => $product->id,
            'sku' => 'LIMIT-' . $runId,
            'size' => 'L',
            'color' => 'White',
            'price' => '100.00',
            'stock_quantity' => 1,
            'reorder_level' => 1,
        ]);

        $this->info('Test data prepared successfully.');

        $this->table(
            ['Test setting', 'Value'],
            [
                ['Cashier A ID', $cashierA->id],
                ['Cashier B ID', $cashierB->id],
                ['Duplicate test variant ID', $duplicateVariant->id],
                ['Limited-stock variant ID', $limitedVariant->id],
                ['Duplicate variant stock', 10],
                ['Limited variant stock', 1],
            ]
        );

        $this->warn(
            'Save these IDs. They are needed for the concurrency tests.'
        );
    }
}
