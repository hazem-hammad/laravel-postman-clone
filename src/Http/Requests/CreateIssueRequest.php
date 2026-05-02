<?php

namespace HazemHammad\PostmanClone\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateIssueRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'collection_id' => ['required', 'string'],
            'request_id' => ['required', 'string'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'assignee' => ['nullable', 'string'],
            'idempotency_key' => ['required', 'string', 'max:64'],
            'context' => ['array'],
            'context.collection_name' => ['string'],
            'context.request_path' => ['string'],
            'context.method' => ['string'],
            'context.url_raw' => ['string'],
            'context.url_resolved' => ['string'],
            'context.env_id' => ['nullable', 'string'],
            'context.branch' => ['nullable', 'string'],
            'context.last_run' => ['nullable', 'array'],
        ];
    }
}
