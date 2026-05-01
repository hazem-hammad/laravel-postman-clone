<?php

namespace HazemHammad\PostmanClone\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEnvironmentVariableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'value' => ['required', 'string'],
        ];
    }
}
