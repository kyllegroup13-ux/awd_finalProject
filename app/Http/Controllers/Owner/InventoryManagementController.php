<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\InventoryTransaction;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryManagementController extends Controller
{
    public function restock(
        Request $request,
        ProductVariant $variant
    ): JsonResponse {
        $validated = $request->validate([
            'quantity' => [
                'required',
                'integer',
                'min:1',
                'max:2147483647',
            ],
            'supplier' => ['nullable', 'string', 'max:255'],
            'remarks' => ['nullable', 'string', 'max:2000'],
        ]);

        $result = DB::transaction(function () use (
            $request,
            $validated,
            $variant
        ) {
            // Lock this variant to prevent concurrent stock changes.
            $lockedVariant = ProductVariant::query()
                ->whereKey($variant->id)
                ->lockForUpdate()
                ->firstOrFail();

            $previousStock = $lockedVariant->stock_quantity;
            $newStock = $previousStock + $validated['quantity'];

            if ($newStock > 2147483647) {
                abort(422, 'Stock quantity exceeds the allowed limit.');
            }

            $lockedVariant->update([
                'stock_quantity' => $newStock,
            ]);

            $transaction = InventoryTransaction::create([
                'product_variant_id' => $lockedVariant->id,
                'user_id' => $request->user()->id,
                'transaction_type' => 'restock',
                'quantity' => $validated['quantity'],
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'supplier' => $validated['supplier'] ?? null,
                'remarks' => $validated['remarks'] ?? null,
            ]);

            return [
                'variant' => $lockedVariant->fresh(),
                'transaction' => $transaction->fresh(),
            ];
        }, 3);

        return response()->json([
            'message' => 'Inventory restocked successfully.',
            'variant' => $result['variant'],
            'transaction' => $result['transaction'],
        ]);
    }


    public function adjust(
        Request $request,
        ProductVariant $variant
    ): JsonResponse {
        $validated = $request->validate([
            'new_stock' => [
                'required',
                'integer',
                'min:0',
                'max:2147483647',
            ],
            'remarks' => [
                'required',
                'string',
                'max:2000',
            ],
        ]);

        $result = DB::transaction(function () use (
            $request,
            $validated,
            $variant
        ) {
            $lockedVariant = ProductVariant::query()
                ->whereKey($variant->id)
                ->lockForUpdate()
                ->firstOrFail();

            $previousStock = $lockedVariant->stock_quantity;
            $newStock = $validated['new_stock'];

            if ($previousStock === $newStock) {
                abort(422, 'The new stock must differ from the current stock.');
            }

            $lockedVariant->update([
                'stock_quantity' => $newStock,
            ]);

            $transaction = InventoryTransaction::create([
                'product_variant_id' => $lockedVariant->id,
                'user_id' => $request->user()->id,
                'transaction_type' => 'adjustment',
                'quantity' => abs($newStock - $previousStock),
                'previous_stock' => $previousStock,
                'new_stock' => $newStock,
                'remarks' => $validated['remarks'],
            ]);

            return [
                'variant' => $lockedVariant->fresh(),
                'transaction' => $transaction->fresh(),
            ];
        }, 3);

        return response()->json([
            'message' => 'Inventory adjusted successfully.',
            'variant' => $result['variant'],
            'transaction' => $result['transaction'],
        ]);
    }


    public function history(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'product_variant_id' => [
                'sometimes',
                'integer',
                'exists:product_variants,id',
            ],
            'transaction_type' => [
                'sometimes',
                'string',
                'in:restock,sale,return,adjustment,damage',
            ],
            'per_page' => [
                'sometimes',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $transactions = InventoryTransaction::query()
            ->with([
                'productVariant.product:id,name',
                'user:id,name',
            ])
            ->when(
                isset($validated['product_variant_id']),
                fn($query) => $query->where(
                    'product_variant_id',
                    $validated['product_variant_id']
                )
            )
            ->when(
                isset($validated['transaction_type']),
                fn($query) => $query->where(
                    'transaction_type',
                    $validated['transaction_type']
                )
            )
            ->latest()
            ->paginate($validated['per_page'] ?? 15);

        return response()->json($transactions);
    }
}
