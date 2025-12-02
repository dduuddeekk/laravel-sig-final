<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class AuthController extends Controller
{
    // Menampilkan Form Login
    public function showLoginForm()
    {
        return view('auth.login');
    }

    // Menampilkan Form Register
    public function showRegisterForm()
    {
        return view('auth.register');
    }

    // Proses Register ke API Eksternal
    public function register(Request $request)
    {
        // 1. Validasi input lokal
        $request->validate([
            'name' => 'required',
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // 2. Tembak API Register
        $response = Http::post('https://gisapis.manpits.xyz/api/register', [
            'name' => $request->name,
            'email' => $request->email,
            'password' => $request->password,
        ]);

        // 3. Cek respon API
        if ($response->successful()) {
            return redirect()->route('login')->with('success', 'Registrasi berhasil! Silakan login.');
        } else {
            // Tampilkan error dari API jika ada
            return back()->withErrors(['msg' => 'Registrasi gagal: ' . $response->body()]);
        }
    }

    // Proses Login ke API Eksternal
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required'
        ]);

        // 1. Tembak API Login
        $response = Http::post('https://gisapis.manpits.xyz/api/login', [
            'email' => $request->email,
            'password' => $request->password,
        ]);

        // 2. Cek respon
        if ($response->successful()) {
            // Ambil token dari response JSON API (sesuaikan dengan struktur JSON API-nya)
            // Biasanya token ada di dalam key 'meta' -> 'token' pada API manpits ini
            $token = $response->json()['meta']['token']; 
            
            // SIMPAN TOKEN KE SESSION LARAVEL
            session(['api_token' => $token]);
            session(['user_email' => $request->email]); // Opsional: simpan email buat display

            return redirect()->route('home');
        }

        return back()->withErrors(['email' => 'Login gagal, periksa email atau password.']);
    }

    // Proses Logout
    public function logout()
    {
        // Hapus token dari session
        session()->forget('api_token');
        session()->forget('user_email');
        return redirect()->route('home');
    }
}