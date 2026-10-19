<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_id')
                ->constrained('sales')
                ->restrictOnDelete();

            $table->string('payment_method', 20);

            $table->decimal('amount_received', 12, 2);
            $table->decimal('amount_paid', 12, 2);
            $table->decimal('change_amount', 12, 2)->default(0);

            $table->string('reference_number', 100)
                ->nullable();

            $table->timestamps();

            // One payment per sale in the initial POS design.
            $table->unique('sale_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
