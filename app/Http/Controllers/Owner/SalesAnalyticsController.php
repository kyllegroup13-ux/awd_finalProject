<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class SalesAnalyticsController extends Controller
{
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
        $daily = DB::table('sales')
            ->where('status', 'completed')
            ->selectRaw('DATE(created_at) as period')
            ->selectRaw('COUNT(*) as transaction_count')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->groupByRaw('DATE(created_at)')
            ->orderBy('period')
            ->get();

        $weekly = DB::table('sales')
            ->where('status', 'completed')
            ->selectRaw('YEARWEEK(created_at, 3) as period')
            ->selectRaw('COUNT(*) as transaction_count')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->groupByRaw('YEARWEEK(created_at, 3)')
            ->orderBy('period')
            ->get();

        $monthly = DB::table('sales')
            ->where('status', 'completed')
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as period")
            ->selectRaw('COUNT(*) as transaction_count')
            ->selectRaw('SUM(total_amount) as total_revenue')
            ->groupByRaw("DATE_FORMAT(created_at, '%Y-%m')")
            ->orderBy('period')
            ->get();

        return response()->json([
            'daily' => $daily,
            'weekly' => $weekly,
            'monthly' => $monthly,
        ]);
    }
}
