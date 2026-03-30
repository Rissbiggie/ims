<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseOrderController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\RequisitionController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;
use Termwind\Components\Raw;

// ─── Public Auth Routes ───────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ─── Authenticated Routes ─────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // ── Auth ──────────────────────────────────────────────────────────────────
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // ── Dashboard ─────────────────────────────────────────────────────────────
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // ── Products ──────────────────────────────────────────────────────────────
    Route::apiResource('products', ProductController::class);

    Route::post('/products/{product}/adjust-stock', [ProductController::class, 'adjustStock'])
        ->middleware('role:admin,manager');

    Route::post('/products/{product}/write-off', [ProductController::class, 'writeOff'])
        ->middleware('role:admin,manager,store_clerk');
    Route::post('/products/{product}/write-on', [ProductController::class, 'writeOn'])
        ->middleware('role:admin,manager,store_clerk');
    Route::post('/products/{product}/transfer', [ProductController::class, 'transfer'])
        ->middleware('role:admin,manager,store_clerk');
    Route::post('/products/{product}/adjust-price', [ProductController::class, 'adjustPrice'])
        ->middleware('role:admin,manager');
    Route::post('/products/{product}/set-opening-stock', [ProductController::class, 'setOpeningStock'])
        ->middleware('role:admin,manager');
    Route::post('/products/{product}/set-reorder-levels', [ProductController::class, 'setReorderLevels'])
        ->middleware('role:admin,manager');    
        

    // ── Categories ────────────────────────────────────────────────────────────
    Route::apiResource('categories', CategoryController::class)->except(['show']);

    // ── Suppliers ─────────────────────────────────────────────────────────────
    Route::apiResource('suppliers', SupplierController::class);

  // ── Purchase Orders ───────────────────────────────────────────────────────
// 1. Register the base resource first (index, store, show)
Route::apiResource('purchase-orders', PurchaseOrderController::class)
    ->except(['update', 'destroy']);

// 2. Register the specific action routes
Route::prefix('purchase-orders/{purchaseOrder}')->group(function () {
    Route::post('submit',  [PurchaseOrderController::class, 'submit']);  
    Route::post('receive', [PurchaseOrderController::class, 'receive']); 

    Route::middleware('role:admin,manager')->group(function () {
        Route::post('approve', [PurchaseOrderController::class, 'approve']); 
        Route::post('reject',  [PurchaseOrderController::class, 'reject']);  
    });
});
    // ── Requisitions ──────────────────────────────────────────────────────────
   Route::middleware('auth:sanctum')->group(function () {
    
    // Standard CRUD
    Route::get('/requisitions', [RequisitionController::class, 'index']);
    Route::post('/requisitions', [RequisitionController::class, 'store']);
    Route::get('/requisitions/{requisition}', [RequisitionController::class, 'show']);

    // Workflow Actions
    Route::patch('/requisitions/{requisition}/submit', [RequisitionController::class, 'submit']);
    Route::post('/requisitions/{requisition}/approve', [RequisitionController::class, 'approve']);
    Route::post('/requisitions/{requisition}/issue',   [RequisitionController::class, 'issue']);
    Route::post('/requisitions/{requisition}/reject',  [RequisitionController::class, 'reject']);

});

    // ── Reports (admin & manager only) ────────────────────────────────────────
    Route::middleware('role:admin,manager')->prefix('reports')->group(function () {
        Route::get('/inventory-valuation', [ReportController::class, 'inventoryValuation']);
        Route::get('/stock-movement',      [ReportController::class, 'stockMovement']);
        Route::get('/low-stock',           [ReportController::class, 'lowStock']);
        Route::get('/supplier-performance',[ReportController::class, 'supplierPerformance']);
        Route::get('/monthly-trend',       [ReportController::class, 'monthlyTrend']);
        Route::get('/top-products', [ReportController::class, 'topProducts']);
        Route::get('/forecast', [ReportController::class, 'forecast']);
        Route::get('/category-distribution', [ReportController::class, 'categoryDistribution']);
        Route::get('/inventory-valuation/pdf', [ReportController::class, 'exportValuationPdf']);
        Route::get('/stock-movement/pdf', [ReportController::class, 'exportMovementPdf']);
    });



    // ── User Management (admin only) ──────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::post('/users/{user}/reset-password', [UserController::class, 'resetPassword']);
    });
});