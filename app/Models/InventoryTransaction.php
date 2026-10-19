<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class InventoryTransaction extends Model
{
    protected $fillable = [
        'product_variant_id',
        'user_id',
        'transaction_type',
        'quantity',
        'previous_stock',
        'new_stock',
        'transaction_number',
        'supplier',
        'remarks',
    ];

    protected $casts = [
        'transaction_number' => 'string',
    ];

    public function productVariant()
    {
        return $this->belongsTo(ProductVariant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted(): void
    {
        static::created(function (InventoryTransaction $transaction) {
            if (!$transaction->transaction_number) {
                $transaction->transaction_number =
                    'INV-' .
                    str_pad(
                        (string) $transaction->id,
                        8,
                        '0',
                        STR_PAD_LEFT
                    );

                $transaction->saveQuietly();
            }
        });
    }
}
