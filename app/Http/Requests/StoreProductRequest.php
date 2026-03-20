<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role->can('products.create');
    }

    public function rules(): array
    {
        return [
            'name'             => ['required', 'string', 'max:255'],
            'description'      => ['nullable', 'string'],
            'category_id'      => ['required', 'exists:categories,id'],
            'supplier_id'      => ['nullable', 'exists:suppliers,id'],
            'unit_of_measure'  => ['required', 'string'],
            'unit_price'       => ['required', 'numeric', 'min:0'],
            'selling_price'    => ['required', 'numeric', 'min:0'],
            'reorder_level'    => ['required', 'integer', 'min:0'],
            'reorder_quantity' => ['required', 'integer', 'min:1'],
            'minimum_stock'    => ['required', 'integer', 'min:0'],
            'maximum_stock'    => ['required', 'integer', 'gt:minimum_stock'],
            'location'         => ['nullable', 'string', 'max:255'],
            'track_expiry'     => ['boolean'],
            'opening_stock'    => ['nullable', 'integer', 'min:0'],
        ];
    }
}
