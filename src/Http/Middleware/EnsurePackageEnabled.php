<?php

namespace HazemHammad\PostmanClone\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

class EnsurePackageEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        $allowedEnvs = config('postman-clone.access.enabled_environments', ['local']);

        if (! in_array(app()->environment(), $allowedEnvs, true)) {
            abort(404);
        }

        $gate = config('postman-clone.access.gate');
        if ($gate !== null && Gate::denies($gate)) {
            abort(403);
        }

        return $next($request);
    }
}
