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

    public function summary(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'from' => ['nullable', 'date_format:Y-m-d'],
            'to' => ['nullable', 'date_format:Y-m-d', 'after_or_equal:from'],
        ]);

        $completedSales = Sale::query()
            ->where('status', 'completed');

        if (! empty($validated['from'])) {
            $completedSales->whereDate('created_at', '>=', $validated['from']);
        }
        if (! empty($validated['to'])) {
            $completedSales->whereDate('created_at', '<=', $validated['to']);
        }

        $totalTransactions = (clone $completedSales)->count();

        $totalRevenue = (clone $completedSales)
            ->sum('total_amount');

        $eligibleSales = (clone $completedSales)
            ->whereHas('items')
            ->whereDoesntHave('items', function ($query) {
                $query->whereNull('unit_cost');
            });

        $profitRevenue = (clone $eligibleSales)->sum('total_amount');
        $profitCost = DB::table('sale_items')
            ->join('sales', 'sales.id', '=', 'sale_items.sale_id')
            ->where('sales.status', 'completed')
            ->whereNotNull('sale_items.unit_cost')
            ->whereIn('sales.id', (clone $eligibleSales)->select('id'))
            ->selectRaw('COALESCE(SUM(sale_items.quantity * sale_items.unit_cost), 0) as total_cost')
            ->value('total_cost');

        $totalProfit = (float) $profitRevenue - (float) $profitCost;
        $eligibleSalesCount = (clone $eligibleSales)->count();

        $paymentBreakdown = DB::table('sales')
            ->join('payments', 'payments.sale_id', '=', 'sales.id')
            ->where('sales.status', 'completed')
            ->when(! empty($validated['from']), fn ($query) => $query->whereDate('sales.created_at', '>=', $validated['from']))
            ->when(! empty($validated['to']), fn ($query) => $query->whereDate('sales.created_at', '<=', $validated['to']))
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
            'total_profit' => number_format($totalProfit, 2, '.', ''),
            'eligible_sales_count' => $eligibleSalesCount,
            'total_completed_sales' => $totalTransactions,
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
