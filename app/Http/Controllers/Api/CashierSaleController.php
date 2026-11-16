<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Services\CheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CashierSaleController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $scope = $request->query('scope', 'today');
        $query = Sale::with([
            'cashier:id,name',
            'payment',
            'items.productVariant.product',
        ])
            ->where('cashier_id', $request->user()->id);

        if ($scope !== 'all') {
            $today = now()->startOfDay();
            $query->where('created_at', '>=', $today)
                ->where('created_at', '<', $today->copy()->addDay());
        }

        $sales = $query
            ->latest()
            ->orderByDesc('id')
            ->paginate($scope === 'all' ? 10 : 15);

        return response()->json($sales);
    }

    public function store(
        Request $request,
        CheckoutService $checkout
    ): JsonResponse {
        $data = $request->validate([
            'items' => ['required', 'array', 'min:1'],

            'items.*.product_variant_id' => [
                'required',
                'integer',
                'distinct',
                'exists:product_variants,id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],

            'payment_method' => [
                'required',
                Rule::in(['cash', 'gcash']),
            ],

            'amount_received' => [
                'required',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'discount' => [
                'sometimes',
                'nullable',
                'numeric',
                'min:0',
                'decimal:0,2',
            ],

            'reference_number' => [
                'required_if:payment_method,gcash',
                'nullable',
                'string',
                'max:100',
            ],

            'idempotency_key' => [
                'required',
                'string',
                'uuid',
                'max:100',
            ],
        ]);

        $result = $checkout->checkout(
            $data,
            $request->user()->id
        );

        $replayed = $result['replayed'];

        return response()->json([
            'message' => $replayed
                ? 'Existing sale returned successfully.'
                : 'Sale completed successfully.',
            'sale' => $result['sale'],
        ], $replayed ? 200 : 201);
    }

    public function show(
        Request $request,
        Sale $sale
    ): JsonResponse {
        abort_unless(
            $sale->cashier_id === $request->user()->id,
            403
        );

        return response()->json(
            $sale->load([
                'cashier:id,name',
                'items',
                'payment',
            ])
        );
    }
}
