<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CashierSaleController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\Api\PosProductController;

/*
|--------------------------------------------------------------------------
| M3 Dry Goods API Routes
|--------------------------------------------------------------------------
| Cashier endpoints require authentication and the cashier role.
*/

Route::middleware(['auth:sanctum', 'cashier'])
    ->prefix('cashier')
    ->group(function () {

        // Get cashier's sales history
        Route::get('/sales', [
            CashierSaleController::class,
            'index'
        ]);

        // Process Cash or GCash checkout
        Route::post('/checkout', [
            CashierSaleController::class,
            'store'
        ]);

        // View individual transaction
        Route::get('/sales/{sale}', [
            CashierSaleController::class,
            'show'
        ]);

        Route::get('/products', [
            PosProductController::class,
            'index'
        ]);
    });

Route::middleware(['auth:sanctum', 'active'])->get('/products', [
    ProductController::class,
    'index',
]);
