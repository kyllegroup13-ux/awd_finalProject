<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_transactions', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | Product Variant Reference
            |--------------------------------------------------------------------------
            */

            $table->foreignId('product_variant_id')
                ->constrained('product_variants')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | User who performed the action
            |--------------------------------------------------------------------------
            */

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | Transaction Information
            |--------------------------------------------------------------------------
            */

            $table->enum('transaction_type', [
                'restock',
                'sale',
                'return',
                'adjustment',
                'damage',
            ]);

            /*
            |--------------------------------------------------------------------------
            | Stock Movement
            |--------------------------------------------------------------------------
            */

            $table->integer('quantity');
            $table->integer('previous_stock');
            $table->integer('new_stock');

            /*
            |--------------------------------------------------------------------------
            | Additional Information
            |--------------------------------------------------------------------------
            */

            $table->string('reference_number')->nullable();
            $table->string('supplier')->nullable();
            $table->text('remarks')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_transactions');
    }
};
