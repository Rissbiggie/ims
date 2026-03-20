<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Models\AuditLog;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function __construct(private readonly StockService $stockService) {}

    public function index(Request $request): JsonResponse
    {
        $query = Product::with(['category', 'supplier', 'stock'])
            ->when($request->search, fn ($q) => $q->search($request->search))
            ->when($request->category_id, fn ($q) => $q->where('category_id', $request->category_id))
            ->when($request->supplier_id, fn ($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->status === 'low_stock', fn ($q) => $q->lowStock())
            ->when($request->status === 'out_of_stock', fn ($q) => $q->outOfStock())
            ->when($request->status === 'active', fn ($q) => $q->active());

        $products = $query->orderBy($request->sort_by ?? 'name', $request->sort_dir ?? 'asc')
                          ->paginate($request->per_page ?? 20);

        return response()->json($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $product = Product::create($request->validated());

        if ($request->opening_stock > 0) {
            $this->stockService->setOpeningStock(
                $product,
                $request->opening_stock,
                $request->user(),
                $request->unit_price
            );
        }

        AuditLog::record('product.created', null, Product::class, $product->id,
            null, $request->validated());

        return response()->json($product->fresh(['category', 'supplier', 'stock']), 201);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(
            $product->load(['category', 'supplier', 'stock',
                'stockTransactions' => fn ($q) => $q->latest()->limit(20)])
        );
    }

    public function update(UpdateProductRequest $request, Product $product): JsonResponse
    {
        $old = $product->only(array_keys($request->validated()));
        $product->update($request->validated());

        AuditLog::record('product.updated', null, Product::class, $product->id,
            $old, $request->validated());

        return response()->json($product->fresh(['category', 'supplier', 'stock']));
    }

    public function destroy(Product $product): JsonResponse
    {
        abort_if(
            $product->stockTransactions()->exists(),
            422,
            'Cannot delete a product with existing stock transactions.'
        );

        AuditLog::record('product.deleted', null, Product::class, $product->id,
            $product->toArray());
        $product->delete();

        return response()->json(['message' => 'Product deleted successfully.']);
    }

    /**
     * Manually adjust stock quantity.
     */
    public function adjustStock(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'new_quantity' => ['required', 'integer', 'min:0'],
            'reason'       => ['required', 'string', 'max:500'],
        ]);

        $tx = $this->stockService->adjustStock(
            $product,
            $data['new_quantity'],
            $request->user(),
            $data['reason']
        );

        return response()->json([
            'transaction' => $tx,
            'stock'       => $product->fresh()->stock,
        ]);
    }

    /**
     * Write off stock (damage/expiry).
     */
    public function writeOff(Request $request, Product $product): JsonResponse
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
            'type'     => ['required', 'in:damage,expired'],
            'reason'   => ['required', 'string', 'max:500'],
        ]);

        $tx = $this->stockService->writeOff(
            $product, $data['quantity'], $request->user(),
            $data['type'], $data['reason']
        );

        return response()->json(['transaction' => $tx, 'stock' => $product->fresh()->stock]);
    }
}
