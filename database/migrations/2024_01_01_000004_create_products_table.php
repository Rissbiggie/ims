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
            $table->string('sku')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->string('unit_of_measure')->default('piece'); // piece, kg, litre, box, etc.
            $table->decimal('unit_price', 12, 2)->default(0);
            $table->decimal('selling_price', 12, 2)->default(0);
            $table->integer('reorder_level')->default(10);
            $table->integer('reorder_quantity')->default(50);
            $table->integer('minimum_stock')->default(5);
            $table->integer('maximum_stock')->default(1000);
            $table->string('location')->nullable(); // Shelf/bin location
            $table->string('image_path')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('track_expiry')->default(false);
            $table->timestamps();
            $table->softDeletes();

            $table->index(['category_id', 'supplier_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
