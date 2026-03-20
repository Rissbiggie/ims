<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $suppliers = Supplier::withCount('products')
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->search, fn ($q) => $q->where(function ($q2) use ($request) {
                $q2->where('name', 'like', "%{$request->search}%")
                   ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->paginate($request->per_page ?? 20);

        return response()->json($suppliers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'                 => ['required', 'string'],
            'email'                => ['nullable', 'email', 'unique:suppliers'],
            'phone'                => ['nullable', 'string'],
            'address'              => ['nullable', 'string'],
            'contact_person'       => ['nullable', 'string'],
            'company_registration' => ['nullable', 'string'],
            'notes'                => ['nullable', 'string'],
        ]);

        return response()->json(Supplier::create($data), 201);
    }

    public function show(Supplier $supplier): JsonResponse
    {
        return response()->json($supplier->load(['products', 'purchaseOrders' => fn ($q) => $q->latest()->limit(10)]));
    }

    public function update(Request $request, Supplier $supplier): JsonResponse
    {
        $data = $request->validate([
            'name'           => ['sometimes', 'string'],
            'email'          => ['nullable', 'email', 'unique:suppliers,email,' . $supplier->id],
            'phone'          => ['nullable', 'string'],
            'address'        => ['nullable', 'string'],
            'contact_person' => ['nullable', 'string'],
            'status'         => ['sometimes', 'in:active,inactive,blacklisted'],
            'notes'          => ['nullable', 'string'],
        ]);

        $supplier->update($data);
        return response()->json($supplier);
    }

    public function destroy(Supplier $supplier): JsonResponse
    {
        abort_if($supplier->purchaseOrders()->exists(), 422, 'Cannot delete supplier with existing purchase orders.');
        $supplier->delete();
        return response()->json(['message' => 'Supplier deleted.']);
    }
}
