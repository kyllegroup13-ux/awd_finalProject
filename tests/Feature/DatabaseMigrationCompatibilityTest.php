<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

uses(RefreshDatabase::class);

test('all application migrations work in isolated SQLite', function () {
    expect(DB::getDefaultConnection())->toBe('sqlite');

    expect(DB::connection()->getDatabaseName())->toBe(':memory:');

    expect(Schema::hasTable('categories'))->toBeTrue();
    expect(Schema::hasTable('products'))->toBeTrue();
    expect(Schema::hasTable('product_variants'))->toBeTrue();
    expect(Schema::hasTable('inventory_transactions'))->toBeTrue();
    expect(Schema::hasTable('sales'))->toBeTrue();
    expect(Schema::hasTable('sale_items'))->toBeTrue();
    expect(Schema::hasTable('payments'))->toBeTrue();
    expect(Schema::hasTable('checkout_requests'))->toBeTrue();
});
