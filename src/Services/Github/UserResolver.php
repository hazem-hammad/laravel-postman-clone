<?php

namespace HazemHammad\PostmanClone\Services\Github;

use HazemHammad\PostmanClone\Models\User;
use Illuminate\Support\Facades\Session;

class UserResolver
{
    public function current(): ?User
    {
        $id = Session::get('postman_clone_user_id');
        if (! is_int($id) && ! ctype_digit((string) $id)) {
            return null;
        }

        return User::find((int) $id);
    }

    public function signIn(User $user): void
    {
        Session::put('postman_clone_user_id', $user->id);
    }

    public function signOut(): void
    {
        Session::forget('postman_clone_user_id');
    }
}
