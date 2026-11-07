
<?php

use App\Http\Controllers\Owner\CashierManagementController;
use App\Http\Controllers\Owner\CategoryManagementController;
use App\Http\Controllers\Owner\InventoryManagementController;
use App\Http\Controllers\Owner\ProductManagementController;
use App\Http\Controllers\Owner\SalesAnalyticsController;
use App\Http\Controllers\Owner\SalesRecordController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| M3 Dry Goods Web Routes
|--------------------------------------------------------------------------
*/

Route::get('/', function () {
    if (! Auth::check()) {
        return redirect()->route('login');
    }

    return match (Auth::user()->role) {
        'owner' => redirect()->route('dashboard'),
        'cashier' => redirect()->route('cashier.pos'),
        default => redirect()->route('login'),
    };
});

// Owner Dashboard

 // Owner Dashboard
Route::middleware(['auth', 'owner'])->group(function () {
    Route::get('/dashboard', function () {
        $completedSales = \App\Models\Sale::query()
            ->where('status', 'completed');

        $todaySales = (clone $completedSales)
            ->whereDate('created_at', today())
            ->sum('total_amount');

        $recentSales = (clone $completedSales)
            ->with('cashier:id,name')
            ->latest()
            ->take(8)
            ->get();

        $lowStockQuery = \App\Models\ProductVariant::query()
            ->whereColumn('stock_quantity', '<=', 'reorder_level');

        return Inertia::render('dashboard', [
            'todaySales' => $todaySales,
            'totalProducts' => \App\Models\Product::count(),
            'lowStockCount' => (clone $lowStockQuery)->count(),
            'recentSales' => $recentSales,
            'lowStockVariants' => (clone $lowStockQuery)
                ->with('product:id,name')
                ->orderBy('stock_quantity')
                ->take(8)
                ->get(),
        ]);
    })->name('dashboard');


    Route::get(
        '/owner/cashiers',
        [CashierManagementController::class, 'index']
    )->name('owner.cashiers.index');

    Route::post(
        '/owner/cashiers',
        [CashierManagementController::class, 'store']
    )->name('owner.cashiers.store');

    Route::patch(
        '/owner/cashiers/{cashier}/status',
        [CashierManagementController::class, 'updateStatus']
    )->name('owner.cashiers.update-status');

    Route::get(
        '/owner/sales',
        [SalesRecordController::class, 'index']
    )->name('owner.sales.index');

    Route::get(
        '/owner/sales-analytics/summary',
        [SalesAnalyticsController::class, 'summary']
    )->name('owner.sales-analytics.summary');

    Route::get(
        '/owner/sales-analytics/trends',
        [SalesAnalyticsController::class, 'trends']
    )->name('owner.sales-analytics.trends');
    
    Route::get('/owner/reports', function () {
    return Inertia::render('owner/reports');
    })->name('owner.reports');

    Route::get('/owner/manage/products', function (\Illuminate\Http\Request $request) {
    $filters = [
        'search' => (string) $request->query('search', ''),
        'category' => (string) $request->query('category', ''),
        'size' => (string) $request->query('size', ''),
        'status' => (string) $request->query('status', ''),
    ];

    $products = \App\Models\Product::query()
        ->with(['category', 'variants'])
        ->when($filters['search'], function ($query, $search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('brand', 'like', "%{$search}%")
                    ->orWhereHas('variants', function ($variants) use ($search) {
                        $variants->where('sku', 'like', "%{$search}%");
                    });
            });
        })
        ->when($filters['category'], function ($query, $category) {
            $query->where('category_id', $category);
        })
        ->when($filters['size'], function ($query, $size) {
            $query->whereHas('variants', function ($variants) use ($size) {
                $variants->where('size', $size);
            });
        })
        ->when($filters['status'], function ($query, $status) {
            $query->where('status', $status);
        })
        ->latest()
        ->paginate(12)
        ->withQueryString();

    return Inertia::render('owner/products', [
        'products' => $products,
        'categories' => \App\Models\Category::orderBy('name')->get(),
        'filters' => $filters,
    ]);
    })->name('owner.products.index');

    Route::post(
        '/owner/products',
        [ProductManagementController::class, 'store']
    )->name('owner.products.store');

    Route::patch(
        '/owner/products/{product}',
        [ProductManagementController::class, 'update']
    )->name('owner.products.update');

    Route::patch(
        '/owner/product-variants/{variant}',
        [ProductManagementController::class, 'updateVariant']
    )->name('owner.product-variants.update');

    Route::get('/owner/manage/inventory', function (\Illuminate\Http\Request $request) {
    $filters = [
        'search' => (string) $request->query('search', ''),
        'category' => (string) $request->query('category', ''),
        'size' => (string) $request->query('size', ''),
        'status' => (string) $request->query('status', ''),
    ];

    $base = \App\Models\ProductVariant::query();
    $counts = [
        'total' => (clone $base)->count(),
        'inStock' => (clone $base)
            ->where('stock_quantity', '>', 0)
            ->whereColumn('stock_quantity', '>', 'reorder_level')->count(),
        'lowStock' => (clone $base)
            ->where('stock_quantity', '>', 0)
            ->whereColumn('stock_quantity', '<=', 'reorder_level')->count(),
        'outOfStock' => (clone $base)->where('stock_quantity', 0)->count(),
    ];

    $variants = \App\Models\ProductVariant::query()
        ->with(['product.category'])
        ->when($filters['search'], function ($query, $value) {
            $query->where(function ($q) use ($value) {
                $q->where('sku', 'like', "%{$value}%")
                  ->orWhereHas('product', function ($p) use ($value) {
                      $p->where('name', 'like', "%{$value}%");
                  });
            });
        })
        ->when($filters['category'], function ($query, $id) {
            $query->whereHas('product', fn ($p) => $p->where('category_id', $id));
        })
        ->when($filters['size'], fn ($query, $size) => $query->where('size', $size))
        ->when($filters['status'] === 'in', function ($query) {
            $query->where('stock_quantity', '>', 0)
                ->whereColumn('stock_quantity', '>', 'reorder_level');
        })
        ->when($filters['status'] === 'low', function ($query) {
            $query->where('stock_quantity', '>', 0)
                ->whereColumn('stock_quantity', '<=', 'reorder_level');
        })
        ->when($filters['status'] === 'out', fn ($query) => $query->where('stock_quantity', 0))
        ->latest('id')
        ->paginate(12)
        ->withQueryString();

    return Inertia::render('owner/inventory', [
        'variants' => $variants,
        'categories' => \App\Models\Category::orderBy('name')->get(['id', 'name']),
        'sizes' => \App\Models\ProductVariant::query()->distinct()->orderBy('size')->pluck('size'),
        'counts' => $counts,
        'filters' => $filters,
    ]);
    })->name('owner.inventory.index');

    Route::post(
        '/owner/inventory/{variant}/restock',
        [InventoryManagementController::class, 'restock']
    )->name('owner.inventory.restock');

    Route::patch(
        '/owner/inventory/{variant}/adjust',
        [InventoryManagementController::class, 'adjust']
    )->name('owner.inventory.adjust');

    Route::get(
        '/owner/inventory/history',
        [InventoryManagementController::class, 'history']
    )->name('owner.inventory.history');

    Route::get(
        '/owner/categories',
        [CategoryManagementController::class, 'index']
    )->name('owner.categories.index');

    Route::post(
        '/owner/categories',
        [CategoryManagementController::class, 'store']
    )->name('owner.categories.store');

    Route::patch(
        '/owner/categories/{category}',
        [CategoryManagementController::class, 'update']
    )->name('owner.categories.update');

    Route::post(
        '/owner/products/{product}/variants',
        [ProductManagementController::class, 'storeVariant']
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
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
