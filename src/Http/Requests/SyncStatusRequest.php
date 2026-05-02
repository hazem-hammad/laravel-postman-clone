<?php

namespace HazemHammad\PostmanClone\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SyncStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string|int>>
     */
    public function rules(): array
    {
        return [
            'linked_issue_ids' => ['required', 'array', 'min:1', 'max:100'],
            'linked_issue_ids.*' => ['integer'],
        ];
    }
}
