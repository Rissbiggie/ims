<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreRequisitionRequest;
use App\Models\Requisition;
use App\Services\RequisitionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RequisitionController extends Controller
{
    public function __construct(private readonly RequisitionService $service) {}

    public function index(Request $request): JsonResponse
    {
        $query = Requisition::with(['requestedBy', 'approvedBy', 'issuedBy'])
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->department, fn ($q) => $q->where('department', $request->department));

        // Store clerks can only see their own requisitions
        if ($request->user()->isStoreClerk()) {
            $query->where('requested_by', $request->user()->id);
        }

        return response()->json($query->latest()->paginate($request->per_page ?? 20));
    }

    public function store(StoreRequisitionRequest $request): JsonResponse
    {
        $req = $this->service->create(
            $request->safe()->except('items'),
            $request->items,
            $request->user()
        );

        return response()->json($req, 201);
    }

    public function show(Requisition $requisition): JsonResponse
    {
        return response()->json(
            $requisition->load(['requestedBy', 'approvedBy', 'issuedBy', 'items.product.stock'])
        );
    }

    public function approve(Requisition $requisition, Request $request): JsonResponse
    {
        $this->authorize('approve', $requisition);

        $data = $request->validate([
            'approved_quantities'   => ['sometimes', 'array'],
            'approved_quantities.*' => ['integer', 'min:0'],
        ]);

        return response()->json(
            $this->service->approve($requisition, $request->user(), $data['approved_quantities'] ?? [])
        );
    }

    public function reject(Requisition $requisition, Request $request): JsonResponse
    {
        $this->authorize('approve', $requisition);
        $data = $request->validate(['reason' => ['required', 'string']]);

        return response()->json(
            $this->service->reject($requisition, $request->user(), $data['reason'])
        );
    }

    public function issue(Requisition $requisition, Request $request): JsonResponse
    {
        $this->authorize('issue', $requisition);

        $data = $request->validate([
            'items'                    => ['required', 'array'],
            'items.*.product_id'       => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity_issued'  => ['required', 'integer', 'min:0'],
        ]);

        return response()->json(
            $this->service->issue($requisition, $data['items'], $request->user())
        );
    }
}
