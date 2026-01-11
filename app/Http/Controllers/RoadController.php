<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log; // Cache tidak perlu di-use lagi kalau tidak dipakai

class RoadController extends Controller
{
    // --- HAPUS CACHE DI SINI AGAR DATA SELALU UPDATE ---
    public function getAllRuasJalan(Request $request) {
        $baseUrl = env('API_URL');
        $endPoint = 'ruasjalan';
        
        // Pastikan URL rapi (handle slash)
        $apiUrl = rtrim($baseUrl, '/') . '/' . $endPoint;

        try {
            $token = $request->bearerToken();

            // LANGSUNG GET KE API, TIDAK ADA CACHE::REMEMBER
            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get($apiUrl);

            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            return response()->json($response->json(), 200);
        } catch (\Exception $e) {
            $statusCode = $e->getCode();
            if ($statusCode < 100 || $statusCode > 599) $statusCode = 500;
            
            $errorBody = json_decode($e->getMessage(), true) ?? [
                'status' => 'error',
                'message' => $e->getMessage()
            ];

            Log::error('Get All Ruas Jalan Error: ' . $e->getMessage());
            return response()->json($errorBody, $statusCode);
        }
    }

    // ... (Fungsi getRuasJalanById, addNewRuasJalan, editRuasJalanById tetap sama) ...
    // Pastikan editRuasJalanById juga sudah pakai asJson() seperti pembahasan sebelumnya
    
    public function getRuasJalanById(Request $request, $id) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/ruasjalan/' . $id;

        try {
            $token = $request->bearerToken();
            $response = Http::withoutVerifying()->withToken($token)->get($apiUrl);

            if ($response->failed()) throw new \Exception($response->body(), $response->status());

            return response()->json($response->json(), 200);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function addNewRuasJalan(Request $request) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/ruasjalan';

        $request->validate([
            'paths' => 'required',
            'desa_id' => 'required',
            'kode_ruas' => 'required',
            'nama_ruas' => 'required',
            'panjang' => 'required',
            'lebar' => 'required',
            'eksisting_id' => 'required',
            'kondisi_id' => 'required',
            'jenisjalan_id' => 'required',
            'keterangan' => 'required',
        ]);

        try {
            $token = $request->bearerToken();
            
            // Format Data Sesuai Postman
            $payload = [
                'paths' => $request->paths,
                'desa_id' => (int) $request->desa_id,
                'kode_ruas' => $request->kode_ruas,
                'nama_ruas' => $request->nama_ruas,
                'panjang' => (float) $request->panjang,
                'lebar' => (float) $request->lebar,
                'eksisting_id' => (int) $request->eksisting_id,
                'kondisi_id' => (int) $request->kondisi_id,
                'jenisjalan_id' => (int) $request->jenisjalan_id,
                'keterangan' => $request->keterangan,
            ];

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->asJson() // JSON Request
                ->post($apiUrl, $payload);
            
            if ($response->failed()) throw new \Exception($response->body(), $response->status());

            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    public function editRuasJalanById(Request $request, $id) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/ruasjalan/' . $id;

        $request->validate([
            'paths' => 'required',
            'desa_id' => 'required',
            'kode_ruas' => 'required',
            'nama_ruas' => 'required',
            'panjang' => 'required',
            'lebar' => 'required',
            'eksisting_id' => 'required',
            'kondisi_id' => 'required',
            'jenisjalan_id' => 'required',
            'keterangan' => 'required',
        ]);

        try {
            $token = $request->bearerToken();

            $payload = [
                'paths' => $request->paths,
                'desa_id' => (int) $request->desa_id,
                'kode_ruas' => $request->kode_ruas,
                'nama_ruas' => $request->nama_ruas,
                'panjang' => (float) $request->panjang,
                'lebar' => (float) $request->lebar,
                'eksisting_id' => (int) $request->eksisting_id,
                'kondisi_id' => (int) $request->kondisi_id,
                'jenisjalan_id' => (int) $request->jenisjalan_id,
                'keterangan' => $request->keterangan,
            ];

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->asJson()
                ->put($apiUrl, $payload);
            
            if ($response->failed()) throw new \Exception($response->body(), $response->status());

            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }
}