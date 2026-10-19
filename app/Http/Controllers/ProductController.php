<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;


class ProductController extends Controller
{

    public function index()
    {
        $products = Product::with([
            'category',
            'variants'
        ])->get();


        $data = $products->map(function ($product) {

            return [

                'id' => $product->id,

                'product_no' =>
                $product->variants->first()->sku ?? null,

                'image' =>
                $product->image,

                'name' =>
                $product->name,

                'category' =>
                $product->category->name,

                'sizes' =>
                $product->variants->pluck('size'),

                'colors' =>
                $product->variants->pluck('color'),

                'price' =>
                $product->variants->first()->price,

                'stock' =>
                $product->variants->sum('stock_quantity'),

                'status' =>
                $product->variants->sum('stock_quantity') > 0
                    ? 'In Stock'
                    : 'Out of Stock'

            ];
        });


        return response()->json($data);
    }
}
