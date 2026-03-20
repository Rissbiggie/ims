<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'manager', 'store_clerk'])->default('store_clerk')->after('email');
            $table->boolean('is_active')->default(true)->after('role');
            $table->string('phone')->nullable()->after('is_active');
            $table->text('address')->nullable()->after('phone');
            $table->timestamp('last_login_at')->nullable()->after('address');
            $table->string('last_login_ip')->nullable()->after('last_login_at');
            $table->softDeletes()->after('updated_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'role', 'is_active', 'phone', 'address',
                'last_login_at', 'last_login_ip', 'deleted_at',
            ]);
        });
    }
};