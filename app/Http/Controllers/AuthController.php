<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt($credentials, $request->boolean('remember'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();

        if (!$user->is_active) {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated. Please contact the administrator.'],
            ]);
        }

        $user->update([
            'last_login_at' => now(),
            'last_login_ip' => $request->ip(),
        ]);

        AuditLog::record('user.login', $user->id, null, null);

        $token = $user->createToken('api-token')->plainTextToken;

        // Determine dashboard route based on user role
        $dashboardRoute = match($user->role->value) {
            'admin' => '/admin-dashboard',
            'manager' => '/manager-dashboard',
            'store_clerk' => '/clerk-dashboard',
            default => '/dashboard',
        };

        return response()->json([
            'user'  => $user->only('id', 'name', 'email', 'role'),
            'token' => $token,
            'dashboard_route' => $dashboardRoute,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        AuditLog::record('user.logout', $request->user()->id);

        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user()->load('stockTransactions'));
    }
}
