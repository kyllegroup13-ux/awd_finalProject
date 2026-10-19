<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{

    public function up(): void
    {

        Schema::create('products', function (Blueprint $table) {


            $table->id();


            /*
             Product Category

             Example:
             Tops
            */

            $table->foreignId('category_id')
                ->constrained()
                ->cascadeOnDelete();



            /*
             Example:
             Classic Cotton T-Shirt
            */

            $table->string('name');



            /*
             Product details
            */

            $table->text('description')
                ->nullable();



            /*
             Example:
             Uniqlo
            */

            $table->string('brand')
                ->nullable();



            /*
             Example:
             products/shirt.jpg
            */

            $table->string('image')
                ->nullable();



            /*
             Active / Inactive
            */

            $table->enum('status', [
                'Active',
                'Inactive'
            ])
                ->default('Active');



            $table->timestamps();
        });
    }



    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
