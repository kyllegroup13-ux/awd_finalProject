<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkout_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('cashier_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('idempotency_key', 100);

            $table->char('request_hash', 64);

            $table->foreignId('sale_id')
                ->nullable()
                ->unique()
                ->constrained('sales')
                ->restrictOnDelete();

            $table->timestamps();

            $table->unique([
                'cashier_id',
                'idempotency_key',
            ], 'checkout_requests_cashier_key_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkout_requests');
    }
};
