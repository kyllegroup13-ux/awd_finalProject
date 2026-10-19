<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class OwnerMiddleware
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $user = $request->user();

        if (
            !$user ||
            $user->role !== 'owner' ||
            $user->status !== 'Active'
        ) {
            abort(403, 'Owner access required.');
        }

        return $next($request);
    }
}
