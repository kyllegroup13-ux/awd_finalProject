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
        'reorder_level'

    ];

    protected $casts = [
        'price' => 'decimal:2',
        'stock_quantity' => 'integer',
        'reorder_level' => 'integer',
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
