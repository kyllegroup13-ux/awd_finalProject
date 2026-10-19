<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropForeign(['category_id']);

            $table->foreign('category_id')
                ->references('id')
                ->on('categories')
                ->restrictOnDelete();
        });

        Schema::table('product_variants', function (Blueprint $table) {
            $table->dropForeign(['product_id']);

            $table->foreign('product_id')
                ->references('id')
                ->on('products')
                ->restrictOnDelete();
        });

        Schema::table('inventory_transactions', function (Blueprint $table) {
            $table->dropForeign(['product_variant_id']);
            $table->dropForeign(['user_id']);

            $table->foreign('product_variant_id')
                ->references('id')
                ->on('product_variants')
                ->restrictOnDelete();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->restrictOnDelete();
        });
    }

    public function down(): void
    {
        // Intentionally do not restore cascading deletions.
        // Historical inventory records should remain protected.
        throw new RuntimeException(
            'Automatic rollback is disabled to protect inventory history.'
        );
    }
};
