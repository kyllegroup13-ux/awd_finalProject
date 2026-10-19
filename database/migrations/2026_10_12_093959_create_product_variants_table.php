<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


return new class extends Migration
{


    public function up(): void
    {

        Schema::create('product_variants', function (Blueprint $table) {


            $table->id();



            /*
       Product reference
    */

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();



            /*
       Product Number shown in UI

       Example:
       0001
    */

            $table->string('sku')
                ->unique();



            /*
       Example:
       S, M, L, XL
    */

            $table->string('size');



            /*
       Example:
       Orange
       Blue
       White
    */

            $table->string('color');



            /*
       Example:
       Php 200.00
    */

            $table->decimal('price', 10, 2);



            /*
       Current inventory
       
       Example:
       20
    */

            $table->integer('stock_quantity')
                ->default(0);



            /*
       Low-stock checking
    */

            $table->integer('reorder_level')
                ->default(5);



            $table->timestamps();
        });
    }



    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
