<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Http\Requests\StorePurchaseOrderRequest;
use App\Models\PurchaseOrder;
use App\Services\PurchaseOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PurchaseOrderController extends Controller
{
    use AuthorizesRequests; // For authorization checks

    public function __construct(private readonly PurchaseOrderService $service) {}

    public function index(Request $request): JsonResponse
    {
        $orders = PurchaseOrder::with(['supplier', 'createdBy', 'approvedBy'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->supplier_id, fn ($q) => $q->where('supplier_id', $request->supplier_id))
            ->when($request->from, fn ($q) => $q->where('order_date', '>=', $request->from))
            ->when($request->to, fn ($q) => $q->where('order_date', '<=', $request->to))
            ->latest()
            ->paginate($request->per_page ?? 20);

        return response()->json($orders);
    }

    public function store(StorePurchaseOrderRequest $request): JsonResponse
    {
        $po = $this->service->create(
            $request->safe()->except('items'),
            $request->items,
            $request->user()
        );

        return response()->json($po, 201);
    }

    public function show(PurchaseOrder $purchaseOrder): JsonResponse
    {
        return response()->json(
            $purchaseOrder->load(['supplier', 'createdBy', 'approvedBy', 'items.product'])
        );
    }

    public function submit(PurchaseOrder $purchaseOrder, Request $request): JsonResponse
    {
        $this->authorize('update', $purchaseOrder);
        return response()->json($this->service->submit($purchaseOrder, $request->user()));
    }

    public function approve(PurchaseOrder $purchaseOrder, Request $request): JsonResponse
    {
        $this->authorize('approve', $purchaseOrder);
        return response()->json($this->service->approve($purchaseOrder, $request->user()));
    }

    public function reject(PurchaseOrder $purchaseOrder, Request $request): JsonResponse
{
    $this->authorize('reject', $purchaseOrder); // <-- use reject policy now
    $data = $request->validate(['reason' => ['required', 'string']]);
    return response()->json($this->service->reject($purchaseOrder, $request->user(), $data['reason']));
}
    public function receive(PurchaseOrder $purchaseOrder, Request $request): JsonResponse
    {
        $this->authorize('receive', $purchaseOrder);

        $data = $request->validate([
            'items'                     => ['required', 'array'],
            'items.*.product_id'        => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity_received' => ['required', 'integer', 'min:0'],
        ]);

        return response()->json(
            $this->service->receive($purchaseOrder, $data['items'], $request->user())
        );
    }
}