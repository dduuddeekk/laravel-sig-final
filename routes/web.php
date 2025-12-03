<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\AuthController;

Route::get('/', function () {
    $user = null;
    $token = session('api_token');

    if ($token) {
        // PERBAIKAN: Tambahkan withoutVerifying() di sini
        $response = Http::withoutVerifying()->withToken($token)->get('https://gisapis.manpits.xyz/api/user');
        
        if ($response->successful()) {
            $user = $response->json()['data']['user'];
        }
    }

    return view('welcome', ['user' => $user]);
})->name('home');

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/register', [AuthController::class, 'showRegisterForm'])->name('register');
    Route::post('/register', [AuthController::class, 'register']);
});

Route::post('/logout', [AuthController::class, 'logout'])->name('logout');