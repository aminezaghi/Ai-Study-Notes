<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Mail;
use App\Mail\EmailVerificationCode;

class AuthController extends Controller
{

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        // Generate 6-digit verification code
        $verificationCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'email_verification_code' => $verificationCode,
            'email_verification_code_expires_at' => now()->addMinutes(15), // Code expires in 15 minutes
            'email_verified_at' => null,
        ]);

        // Send verification email
        try {
            Mail::to($user->email)->send(new EmailVerificationCode($user, $verificationCode));
        } catch (\Exception $e) {
            // If email fails, still return success but log the error
            \Log::error('Failed to send verification email: ' . $e->getMessage());
        }

        return response()->json([
            'message' => 'Account created successfully. Please check your email for verification code.',
            'user_id' => $user->id
        ], 201);
    }

    public function verifyEmail(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
            'verification_code' => 'required|string|size:6',
        ]);

        $user = User::find($request->user_id);

        // Check if user is already verified
        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified'
            ], 400);
        }

        // Check if code matches and hasn't expired
        if ($user->email_verification_code !== $request->verification_code) {
            return response()->json([
                'message' => 'Invalid verification code'
            ], 400);
        }

        if ($user->email_verification_code_expires_at < now()) {
            return response()->json([
                'message' => 'Verification code has expired'
            ], 400);
        }

        // Mark email as verified
        $user->update([
            'email_verified_at' => now(),
            'email_verification_code' => null,
            'email_verification_code_expires_at' => null,
        ]);

        return response()->json([
            'message' => 'Email verified successfully'
        ]);
    }


    public function resendVerificationCode(Request $request)
    {
        $request->validate([
            'user_id' => 'required|exists:users,id',
        ]);

        $user = User::find($request->user_id);

        // Check if user is already verified
        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email is already verified'
            ], 400);
        }

        // Generate new verification code
        $verificationCode = str_pad(random_int(100000, 999999), 6, '0', STR_PAD_LEFT);

        $user->update([
            'email_verification_code' => $verificationCode,
            'email_verification_code_expires_at' => now()->addMinutes(15),
        ]);

        // Send verification email
        try {
            Mail::to($user->email)->send(new EmailVerificationCode($user, $verificationCode));
        } catch (\Exception $e) {
            \Log::error('Failed to send verification email: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to send verification email'
            ], 500);
        }

        return response()->json([
            'message' => 'Verification code sent successfully'
        ]);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = User::where('email', $request->email)->firstOrFail();

        // Check if email is verified
        if (!$user->email_verified_at) {
            return response()->json([
                'message' => 'Please verify your email before logging in',
                'user_id' => $user->id,
                'email_verified' => false
            ], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        
        return response()->json([
            'message' => 'Successfully logged out'
        ]);
    }

    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user()
        ]);
    }


}

