<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePurchaseOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role->can('purchase_orders.create');
    }

    public function rules(): array
    {
        return [
            'supplier_id'              => ['required', 'exists:suppliers,id'],
            'expected_delivery_date'   => ['nullable', 'date', 'after_or_equal:today'],
            'notes'                    => ['nullable', 'string'],
            'items'                    => ['required', 'array', 'min:1'],
            'items.*.product_id'       => ['required', 'integer', 'exists:products,id', 'distinct'],
            'items.*.quantity_ordered' => ['required', 'integer', 'min:1'],
            'items.*.unit_price'       => ['required', 'numeric', 'min:0'],
            'items.*.notes'            => ['nullable', 'string'],
        ];
    }
}
