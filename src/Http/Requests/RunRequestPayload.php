<?php

namespace HazemHammad\PostmanClone\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RunRequestPayload extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'method' => ['required', 'string', 'in:GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS'],
            'url' => ['required', 'string'],
            'headers' => ['array'],
            'headers.*.key' => ['required_with:headers', 'string'],
            'headers.*.value' => ['required_with:headers', 'string'],
            'headers.*.disabled' => ['nullable', 'boolean'],
            'params' => ['array'],
            'params.*.key' => ['required_with:params', 'string'],
            'params.*.value' => ['required_with:params', 'string'],
            'params.*.disabled' => ['nullable', 'boolean'],
            'body_mode' => ['nullable', 'string', 'in:raw,urlencoded,formdata'],
            'body' => ['nullable'],
            'environment_id' => ['nullable', 'string'],
            'collection_id' => ['nullable', 'string'],
            'request_id' => ['nullable', 'string'],
            'request_name' => ['nullable', 'string'],
        ];
    }
}
