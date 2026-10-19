
<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| M3 Dry Goods Web Routes
|--------------------------------------------------------------------------
*/

// Application status
Route::get('/', function () {
    return response()->json([
        'message' => 'M3 Dry Goods API is running',
    ]);
});

// Owner Dashboard
Route::middleware(['auth', 'owner'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get(
        '/owner/cashiers',
        [\App\Http\Controllers\Owner\CashierManagementController::class, 'index']
    )->name('owner.cashiers.index');

    Route::post(
        '/owner/cashiers',
        [\App\Http\Controllers\Owner\CashierManagementController::class, 'store']
    )->name('owner.cashiers.store');

    Route::patch(
        '/owner/cashiers/{cashier}/status',
        [\App\Http\Controllers\Owner\CashierManagementController::class, 'updateStatus']
    )->name('owner.cashiers.update-status');

    Route::get(
        '/owner/sales',
        [\App\Http\Controllers\Owner\SalesRecordController::class, 'index']
    )->name('owner.sales.index');

    Route::get(
        '/owner/sales-analytics/summary',
        [\App\Http\Controllers\Owner\SalesAnalyticsController::class, 'summary']
    )->name('owner.sales-analytics.summary');

    Route::get(
        '/owner/sales-analytics/trends',
        [\App\Http\Controllers\Owner\SalesAnalyticsController::class, 'trends']
    )->name('owner.sales-analytics.trends');


    Route::post(
        '/owner/products',
        [\App\Http\Controllers\Owner\ProductManagementController::class, 'store']
    )->name('owner.products.store');


    Route::patch(
        '/owner/products/{product}',
        [\App\Http\Controllers\Owner\ProductManagementController::class, 'update']
    )->name('owner.products.update');


    Route::patch(
        '/owner/product-variants/{variant}',
        [\App\Http\Controllers\Owner\ProductManagementController::class, 'updateVariant']
    )->name('owner.product-variants.update');


    Route::post(
        '/owner/inventory/{variant}/restock',
        [\App\Http\Controllers\Owner\InventoryManagementController::class, 'restock']
    )->name('owner.inventory.restock');


    Route::patch(
        '/owner/inventory/{variant}/adjust',
        [\App\Http\Controllers\Owner\InventoryManagementController::class, 'adjust']
    )->name('owner.inventory.adjust');


    Route::get(
        '/owner/inventory/history',
        [\App\Http\Controllers\Owner\InventoryManagementController::class, 'history']
    )->name('owner.inventory.history');


    Route::get(
        '/owner/categories',
        [\App\Http\Controllers\Owner\CategoryManagementController::class, 'index']
    )->name('owner.categories.index');

    Route::post(
        '/owner/categories',
        [\App\Http\Controllers\Owner\CategoryManagementController::class, 'store']
    )->name('owner.categories.store');

    Route::patch(
        '/owner/categories/{category}',
        [\App\Http\Controllers\Owner\CategoryManagementController::class, 'update']
    )->name('owner.categories.update');


    Route::post(
        '/owner/products/{product}/variants',
        [\App\Http\Controllers\Owner\ProductManagementController::class, 'storeVariant']
    )->name('owner.products.variants.store');
});

// Cashier workspace
Route::middleware(['auth', 'cashier'])->group(function () {
    Route::get('/cashier/pos', function () {
        return Inertia::render('cashier/pos');
    })->name('cashier.pos');

    Route::get('/cashier/sales', function () {
        return Inertia::render('cashier/sales');
    })->name('cashier.sales');
});

// Authentication and account settings
require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
