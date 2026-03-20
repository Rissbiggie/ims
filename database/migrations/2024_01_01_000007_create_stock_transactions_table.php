<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('reference_number')->unique();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('performed_by')->constrained('users')->restrictOnDelete();
            $table->enum('type', [
                'stock_in',      // Receiving from supplier
                'stock_out',     // Issuing to department/user
                'adjustment_in', // Manual positive adjustment
                'adjustment_out',// Manual negative adjustment
                'transfer_in',   // Transfer from another location
                'transfer_out',  // Transfer to another location
                'return_in',     // Returned by department
                'return_out',    // Returned to supplier
                'opening_stock', // Initial stock entry
                'damage_write_off', // Write-off due to damage
                'expired_write_off', // Write-off due to expiry
            ]);
            $table->integer('quantity_before');
            $table->integer('quantity_change');  // Positive = in, Negative = out
            $table->integer('quantity_after');
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->decimal('total_cost', 14, 2)->nullable();
            $table->nullableMorphs('transactionable'); // polymorphic: purchase_order, requisition, etc.
            $table->text('reason')->nullable();
            $table->string('document_reference')->nullable(); // External document ref
            $table->timestamp('transaction_date');
            $table->timestamps();

            $table->index(['product_id', 'type', 'transaction_date']);
            $table->index(['performed_by', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_transactions');
    }
};
