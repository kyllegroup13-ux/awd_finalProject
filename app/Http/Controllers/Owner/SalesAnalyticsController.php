<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesAnalyticsController extends Controller
{
    public function products(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $productSales = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->join('product_variants', 'product_variants.id', '=', 'sale_items.product_variant_id')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->where('sales.status', 'completed')
            ->whereDate('sales.created_at', '>=', $validated['from'])
            ->whereDate('sales.created_at', '<=', $validated['to'])
            ->select('products.name as product_name')
            ->selectRaw('SUM(sale_items.quantity) as units_sold')
            ->selectRaw('SUM(sale_items.subtotal) as revenue')
            ->groupBy('products.id', 'products.name');

        $toProductStat = static fn (?object $product): ?array => $product === null ? null : [
            'product_name' => $product->product_name,
            'units_sold' => (int) $product->units_sold,
            'revenue' => number_format((float) $product->revenue, 2, '.', ''),
        ];

        $bestSellingProduct = (clone $productSales)
            ->orderByDesc('units_sold')
            ->orderBy('products.name')
            ->orderBy('products.id')
            ->first();

        $leastSellingProduct = (clone $productSales)
            ->orderBy('units_sold')
            ->orderBy('products.name')
            ->orderBy('products.id')
            ->first();

        return response()->json([
            'best_selling_product' => $toProductStat($bestSellingProduct),
            'least_selling_product' => $toProductStat($leastSellingProduct),
        ]);
    }

    public function summary(): JsonResponse
    {
        $completedSales = Sale::query()
            ->where('status', 'completed');

        $totalTransactions = (clone $completedSales)->count();

        $totalRevenue = (clone $completedSales)
            ->sum('total_amount');

        $paymentBreakdown = DB::table('sales')
            ->join('payments', 'payments.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->select(
                'payments.payment_method',
                DB::raw('COUNT(*) as transaction_count'),
                DB::raw('SUM(sales.total_amount) as total_revenue')
            )
            ->groupBy('payments.payment_method')
            ->get();

        return response()->json([
            'total_transactions' => $totalTransactions,
            'total_revenue' => number_format(
                (float) $totalRevenue,
                2,
                '.',
                ''
            ),
            'payment_breakdown' => $paymentBreakdown,
        ]);
    }

    public function trends(): JsonResponse
    {
        $driver = DB::connection()->getDriverName();
        $weekPeriod = $driver === 'sqlite'
            ? "strftime('%Y-%W', created_at)"
            : 'YEARWEEK(created_at, 3)';
        $monthPeriod = $driver === 'sqlite'
            ? "strftime('%Y-%m', created_at)"
            : "DATE_FORMAT(created_at, '%Y-%m')";

        $daily = DB::table('sales')
            ->where('status', 'completed')
            ->selectRaw('DATE(created_at) as period')
            ->selectRaw('COUNT(*) as transaction_count')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->selectRaw('SUM(subtotal) as total_gross_income')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('period')
            ->get();

        $weekly = DB::table('sales')
            ->where('status', 'completed')
            ->selectRaw("{$weekPeriod} as period")
            ->selectRaw('COUNT(*) as transaction_count')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->selectRaw('SUM(subtotal) as total_gross_income')
            ->groupByRaw($weekPeriod)
            ->orderBy('period')
            ->get();

        $monthly = DB::table('sales')
            ->where('status', 'completed')
            ->selectRaw("{$monthPeriod} as period")
            ->selectRaw('COUNT(*) as transaction_count')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->selectRaw('SUM(subtotal) as total_gross_income')
            ->groupByRaw($monthPeriod)
            ->orderBy('period')
            ->get();

        return response()->json([
            'daily' => $daily,
            'weekly' => $weekly,
            'monthly' => $monthly,
        ]);
    }
}
