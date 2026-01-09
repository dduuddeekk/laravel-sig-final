<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    public function showLoginForm()
    {
        return view('auth.login');
    }

    public function showRegisterForm()
    {
        return view('auth.register');
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required',
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // PERBAIKAN: Menggabungkan env('API_URL') dengan 'register'
        // Karena env diakhiri '/', maka 'register' tidak perlu '/' di depan
        $response = Http::withoutVerifying()->post(env('API_URL') . 'register', [
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
        ]);

        $data = $response->json();

        if ($response->successful() && isset($data['meta']['code']) && $data['meta']['code'] == 200) {
            $message = $data['meta']['message'] ?? 'Registrasi berhasil! Silakan login.';
            return redirect()->route('login')->with('success', $message);
        } else {
            $errorMessage = $data['meta']['message'] ?? 'Terjadi kesalahan pada server.';
            return back()->withErrors(['msg' => 'Registrasi gagal: ' . $errorMessage]);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // PERBAIKAN: endpoint digabung
        $response = Http::withoutVerifying()->post(env('API_URL') . 'login', [
            'email' => $request->email,
            'password' => $request->password,
        ]);
        
        $data = $response->json();

        if ($response->successful() && isset($data['meta']['code']) && $data['meta']['code'] == 200) {
            if (isset($data['meta']['token'])) {
                $token = $data['meta']['token']; 
                
                session(['api_token' => $token]);
                session(['user_email' => $request->email]);

                return redirect()->route('home');
            }
        }

        $errorMessage = $data['meta']['message'] ?? 'Login gagal, periksa email atau password.';
        return back()->withErrors(['email' => $errorMessage]);
    }

    public function logout(Request $request)
    {
        $token = session('api_token');
        $apiMessage = 'Logout berhasil'; 

        if ($token) {
            // PERBAIKAN: endpoint digabung
            $response = Http::withoutVerifying()->withToken($token)->post(env('API_URL') . 'logout');
            
            $data = $response->json();

            // Cek sukses logout API
            if ($response->successful() && isset($data['meta']['code']) && $data['meta']['code'] == 200) {
                if (isset($data['meta']['message'])) {
                    $apiMessage = $data['meta']['message'];
                }
            } else {
                // Opsional: Jika token expired, tetap logout dari local session
                $apiMessage = $data['meta']['message'] ?? 'Sesi API berakhir, logout lokal berhasil.';
            }
        }

        $request->session()->forget(['api_token', 'user_email']);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login')->with('success', $apiMessage);
    }
}