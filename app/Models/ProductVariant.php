<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductVariant extends Model
{
    protected $fillable = [

        'product_id',
        'sku',
        'size',
        'color',
        'price',
        'stock_quantity',
        'reorder_level',
        'cost_price',
        'unit_cost',

    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'reorder_level' => 'integer',
        'cost_price' => 'decimal:2',
        'unit_cost' => 'decimal:2',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function inventoryTransactions()
    {
        return $this->hasMany(
            InventoryTransaction::class
        );
    }

    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }
}
