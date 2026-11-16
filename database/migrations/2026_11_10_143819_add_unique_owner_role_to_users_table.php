<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $duplicateOwnerIds = DB::table('users')
            ->where('role', 'owner')
            ->orderBy('id')
            ->pluck('id')
            ->slice(1);

        if ($duplicateOwnerIds->isNotEmpty()) {
            DB::table('users')
                ->whereIn('id', $duplicateOwnerIds)
                ->update(['role' => 'cashier']);
        }

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedTinyInteger('owner_role_guard')
                ->nullable()
                ->virtualAs("case when role = 'owner' then 1 else null end")
                ->unique('users_owner_role_guard_unique');
        });
    }

    /**
     * Reverse the migrations.
     *
     * Duplicate accounts converted by up() remain cashiers to avoid restoring
     * multiple owners when the constraint is removed.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_owner_role_guard_unique');
            $table->dropColumn('owner_role_guard');
        });
    }
};
