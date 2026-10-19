<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;

class PosProductController extends Controller
{
    public function index()
    {
        $products = Product::query()
            ->where('status', 'Active')
            ->with('variants')
            ->orderBy('name')
            ->get();

        return response()->json(
            $products->map(function ($product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'status' => $product->status,
                    'image' => $product->image,
                    'variants' => $product->variants->map(function ($variant) {
                        return [
                            'id' => $variant->id,
                            'sku' => $variant->sku,
                            'size' => $variant->size,
                            'color' => $variant->color,
                            'price' => $variant->price,
                            'stock_quantity' => $variant->stock_quantity,
                        ];
                    })->values(),
                ];
            })->values()
        );
    }
}
