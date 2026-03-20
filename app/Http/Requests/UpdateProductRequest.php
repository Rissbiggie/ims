<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role->can('products.edit');
    }

    public function rules(): array
    {
        return [
            'name'             => ['sometimes', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'category_id'      => ['sometimes', 'exists:categories,id'],
            'supplier_id'      => ['nullable', 'exists:suppliers,id'],
            'unit_of_measure'  => ['sometimes', 'string'],
            'unit_price'       => ['sometimes', 'numeric', 'min:0'],
            'selling_price'    => ['sometimes', 'numeric', 'min:0'],
            'reorder_level'    => ['sometimes', 'integer', 'min:0'],
            'reorder_quantity' => ['sometimes', 'integer', 'min:1'],
            'minimum_stock'    => ['sometimes', 'integer', 'min:0'],
            'maximum_stock'    => ['sometimes', 'integer'],
            'location'         => ['nullable', 'string'],
            'is_active'        => ['sometimes', 'boolean'],
        ];
    }
}
