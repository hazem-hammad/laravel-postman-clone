<?php

namespace HazemHammad\PostmanClone\Http\Middleware;

use Closure;
use HazemHammad\PostmanClone\Services\Github\UserResolver;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureGithubAuthenticated
{
    public function __construct(private readonly UserResolver $resolver) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $this->resolver->current();
        if ($user === null) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }
        if (! $user->has_repo_access) {
            return response()->json(['error' => 'no_repo_access'], 403);
        }
        $user->forceFill(['last_seen_at' => now()])->save();
        $request->attributes->set('pmc_user', $user);

        return $next($request);
    }
}
