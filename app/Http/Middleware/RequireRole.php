<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    /**
     * Usage in routes: ->middleware('role:admin,manager')
     */
   public function handle(Request $request, Closure $next, string ...$roles): Response
{
    $user = $request->user();

    if (!$user) {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }

    try {
        // Convert string roles from route to Enum instances
        $allowedRoles = array_map(fn ($r) => UserRole::from($r), $roles);
    } catch (\ValueError $e) {
        // This catches typos like 'role:adminn' in your api.php
        return response()->json([
            'message' => "Invalid role defined in route: " . implode(', ', $roles)
        ], 500);
    }

    if (!$user->hasRole(...$allowedRoles)) {
        return response()->json([
            'message' => 'Forbidden: You do not have the required role (' . implode(' or ', $roles) . ').',
        ], 403);
    }

    return $next($request);
}
}
