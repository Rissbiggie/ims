<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $users = User::when($request->role, fn ($q) => $q->where('role', $request->role))
            ->when($request->search, fn ($q) => $q->where(function ($q2) use ($request) {
                $q2->where('name', 'like', "%{$request->search}%")
                   ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->paginate($request->per_page ?? 20);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users'],
            'password' => ['required', Password::defaults()],
            'role'     => ['required', 'in:admin,manager,store_clerk'],
            'phone'    => ['nullable', 'string'],
            'address'  => ['nullable', 'string'],
        ]);

        $user = User::create($data);
        AuditLog::record('user.created', null, User::class, $user->id);

        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user->load('auditLogs'));
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'      => ['sometimes', 'string', 'max:255'],
            'email'     => ['sometimes', 'email', 'unique:users,email,' . $user->id],
            'role'      => ['sometimes', 'in:admin,manager,store_clerk'],
            'is_active' => ['sometimes', 'boolean'],
            'phone'     => ['nullable', 'string'],
            'address'   => ['nullable', 'string'],
        ]);

        $old = $user->only(array_keys($data));
        $user->update($data);
        AuditLog::record('user.updated', null, User::class, $user->id, $old, $data);

        return response()->json($user);
    }

    public function resetPassword(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user->update(['password' => $data['password']]);
        $user->tokens()->delete(); // Force re-login

        AuditLog::record('user.password_reset', null, User::class, $user->id);

        return response()->json(['message' => 'Password reset successfully.']);
    }

    public function destroy(User $user): JsonResponse
    {
        abort_if($user->id === auth()->id(), 422, 'You cannot delete your own account.');

        AuditLog::record('user.deleted', null, User::class, $user->id, $user->toArray());
        $user->delete();

        return response()->json(['message' => 'User deleted.']);
    }
}
