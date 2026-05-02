<?php

namespace HazemHammad\PostmanClone\Services\Github;

use Illuminate\Support\Facades\Session;

class OAuthStateGenerator
{
    public const KEY = 'postman_clone_oauth_state';

    public function generate(): string
    {
        $state = bin2hex(random_bytes(16));
        Session::put(self::KEY, $state);

        return $state;
    }

    public function validate(string $candidate): bool
    {
        $stored = Session::pull(self::KEY);
        if (! is_string($stored) || $stored === '') {
            return false;
        }

        return hash_equals($stored, $candidate);
    }
}
