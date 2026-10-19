<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\InventoryTransaction;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductManagementController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => [
                'required',
                'integer',
                Rule::exists('categories', 'id'),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'brand' => ['nullable', 'string', 'max:255'],
            'image' => ['nullable', 'string', 'max:255'],
            'status' => ['sometimes', Rule::in(['Active', 'Inactive'])],

            'variants' => ['required', 'array', 'min:1'],
            'variants.*.sku' => [
                'required',
                'string',
                'max:255',
                'distinct',
                Rule::unique('product_variants', 'sku'),
            ],
            'variants.*.size' => ['required', 'string', 'max:255'],
            'variants.*.color' => ['required', 'string', 'max:255'],
            'variants.*.price' => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'variants.*.stock_quantity' => [
                'required',
                'integer',
                'min:0',
                'max:2147483647',
            ],
            'variants.*.reorder_level' => [
                'sometimes',
                'integer',
                'min:0',
                'max:2147483647',
            ],
        ]);

        $product = DB::transaction(function () use ($validated, $request) {
            $product = Product::create([
                'category_id' => $validated['category_id'],
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'brand' => $validated['brand'] ?? null,
                'image' => $validated['image'] ?? null,
                'status' => $validated['status'] ?? 'Active',
            ]);

            foreach ($validated['variants'] as $variantData) {
                $variant = $product->variants()->create([
                    'sku' => $variantData['sku'],
                    'size' => $variantData['size'],
                    'color' => $variantData['color'],
                    'price' => $variantData['price'],
                    'stock_quantity' => $variantData['stock_quantity'],
                    'reorder_level' => $variantData['reorder_level'] ?? 5,
                ]);

                if ($variant->stock_quantity > 0) {
                    InventoryTransaction::create([
                        'product_variant_id' => $variant->id,
                        'user_id' => $request->user()->id,
                        'transaction_type' => 'restock',
                        'quantity' => $variant->stock_quantity,
                        'previous_stock' => 0,
                        'new_stock' => $variant->stock_quantity,
                        'remarks' => 'Initial stock upon product creation',
                    ]);
                }
            }

            return $product->load(['category', 'variants']);
        });

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => $product,
        ], 201);
    }


    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $request->validate([
            'category_id' => [
                'sometimes',
                'required',
                'integer',
                Rule::exists('categories', 'id'),
            ],
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'sometimes',
                'nullable',
                'string',
            ],
            'brand' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'image' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],
            'status' => [
                'sometimes',
                'required',
                Rule::in(['Active', 'Inactive']),
            ],
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $product->fresh(['category', 'variants']),
        ]);
    }


    public function updateVariant(
        Request $request,
        \App\Models\ProductVariant $variant
    ): JsonResponse {
        $validated = $request->validate([
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('product_variants', 'sku')
                    ->ignore($variant->id),
            ],
            'size' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'color' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],
            'price' => [
                'sometimes',
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
            ],
            'reorder_level' => [
                'sometimes',
                'required',
                'integer',
                'min:0',
                'max:2147483647',
            ],
        ]);

        $variant->update($validated);

        return response()->json([
            'message' => 'Product variant updated successfully.',
            'variant' => $variant->fresh(),
        ]);
    }


    public function storeVariant(
        Request $request,
        Product $product
    ): JsonResponse {
        $validated = $request->validate([
            'sku' => [
                'required',
                'string',
                'max:255',
                Rule::unique('product_variants', 'sku'),
            ],
            'size' => ['required', 'string', 'max:255'],
            'color' => ['required', 'string', 'max:255'],
            'price' => [
                'required',
                'numeric',
                'min:0',
                'max:99999999.99',
            ],
            'stock_quantity' => [
                'required',
                'integer',
                'min:0',
                'max:2147483647',
            ],
            'reorder_level' => [
                'sometimes',
                'integer',
                'min:0',
                'max:2147483647',
            ],
        ]);

        $result = DB::transaction(function () use (
            $request,
            $product,
            $validated
        ) {
            $variant = $product->variants()->create([
                'sku' => $validated['sku'],
                'size' => $validated['size'],
                'color' => $validated['color'],
                'price' => $validated['price'],
                'stock_quantity' => $validated['stock_quantity'],
                'reorder_level' => $validated['reorder_level'] ?? 5,
            ]);

            $transaction = null;

            if ($variant->stock_quantity > 0) {
                $transaction = InventoryTransaction::create([
                    'product_variant_id' => $variant->id,
                    'user_id' => $request->user()->id,
                    'transaction_type' => 'restock',
                    'quantity' => $variant->stock_quantity,
                    'previous_stock' => 0,
                    'new_stock' => $variant->stock_quantity,
                    'remarks' => 'Initial stock for new product variant',
                ]);
            }

            return [
                'variant' => $variant,
                'transaction' => $transaction,
            ];
        });

        return response()->json([
            'message' => 'Product variant created successfully.',
            'variant' => $result['variant'],
            'transaction' => $result['transaction'],
        ], 201);
    }
}
