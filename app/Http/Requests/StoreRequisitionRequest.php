<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRequisitionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role->can('requisitions.create');
    }

    public function rules(): array
    {
        return [
            'department'                   => ['nullable', 'string'],
            'purpose'                      => ['nullable', 'string'],
            'required_date'                => ['nullable', 'date', 'after_or_equal:today'],
            'notes'                        => ['nullable', 'string'],
            'items'                        => ['required', 'array', 'min:1'],
            'items.*.product_id'           => ['required', 'integer', 'exists:products,id', 'distinct'],
            'items.*.quantity_requested'   => ['required', 'integer', 'min:1'],
            'items.*.notes'                => ['nullable', 'string'],
        ];
    }
}
