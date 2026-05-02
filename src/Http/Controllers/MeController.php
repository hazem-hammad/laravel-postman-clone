<?php

namespace HazemHammad\PostmanClone\Http\Controllers;

use HazemHammad\PostmanClone\Services\Github\UserResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Routing\Controller;

class MeController extends Controller
{
    public function show(UserResolver $resolver): JsonResponse
    {
        $user = $resolver->current();
        if ($user === null) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        return response()->json([
            'id' => $user->id,
            'github_login' => $user->github_login,
            'name' => $user->name,
            'avatar_url' => $user->avatar_url,
            'has_repo_access' => $user->has_repo_access,
        ]);
    }
}
