<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CashierMiddleware
{
    public function handle(
        Request $request,
        Closure $next
    ): Response {
        $user = $request->user();

        if (
            !$user ||
            $user->role !== 'cashier' ||
            $user->status !== 'Active'
        ) {
            abort(403, 'Cashier access required.');
        }

        return $next($request);
    }
}