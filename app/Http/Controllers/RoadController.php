<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RoadController extends Controller
{
    public function getAllRuasJalan(Request $request) {
        $baseUrl = env('API_URL');
        $endPoint = 'ruasjalan';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'all_ruas_jalan_data';
        $cacheTime = 60 * 60 * 24;

        try {
            $data = Cache::remember($cacheKey, $cacheTime, function () use ($apiUrl, $request) {
                $token = $request->bearerToken();

                $response = Http::withoutVerifying()
                    ->withToken($token)
                    ->get($apiUrl);

                if ($response->failed()) {
                    throw new \Exception($response->body(), $response->status());
                }

                return $response->json();
            });

            return response()->json($data, 200);
        } catch (\Exception $e) {
            $statusCode = $e->getCode();
            if ($statusCode < 100 || $statusCode > 599) {
                $statusCode = 500;
            }

            $errorBody = json_decode($e->getMessage(), true);

            if (!$errorBody) {
                $errorBody = [
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
            }

            Cache::forget($cacheKey);

            Log::error('Ruas Jalan API Error - ' . $statusCode . ': ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getRuasJalanById(Request $request, $id) {
        $baseUrl = env('API_URL');
        $endPoint = '/ruasjalan';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'ruas_jalan_data_' . $id;
        $cacheTime = 60 * 60 * 24;

        try {
            $data = Cache::remember($cacheKey, $cacheTime, function () use ($apiUrl, $request) {
                $token = $request->bearerToken();

                $response = Http::withoutVerifying()
                    ->withToken($token)
                    ->get($apiUrl);

                if ($response->failed()) {
                    throw new \Exception($response->body(), $response->status());
                }

                return $response->json();
            });

            return response()->json($data, 200);
        } catch (\Exception $e) {
            $statusCode = $e->getCode();
            if ($statusCode < 100 || $statusCode > 599) {
                $statusCode = 500;
            }

            $errorBody = json_decode($e->getMessage(), true);

            if (!$errorBody) {
                $errorBody = [
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
            }

            Cache::forget($cacheKey);

            Log::error('Ruas Jalan By Id API Error - ' . $statusCode . ': ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function addNewRuasJalan(Request $request) {
        $baseUrl = env('API_URL');
        $endPoint = 'ruasjalan';
        $apiUrl = $baseUrl . $endPoint;

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

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->asForm() 
                ->post($apiUrl, [
                    'paths' => $request->paths,
                    'desa_id' => $request->desa_id,
                    'kode_ruas' => $request->kode_ruas,
                    'nama_ruas' => $request->nama_ruas,
                    'panjang' => $request->panjang,
                    'lebar' => $request->lebar,
                    'eksisting_id' => $request->eksisting_id,
                    'kondisi_id' => $request->kondisi_id,
                    'jenisjalan_id' => $request->jenisjalan_id,
                    'keterangan' => $request->keterangan,
                ]);
            
            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            Cache::forget('all_ruas_jalan_data');

            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            $statusCode = $e->getCode();
            if ($statusCode < 100 || $statusCode > 599) {
                $statusCode = 500;
            }

            $errorBody = json_decode($e->getMessage(), true);

            if (!$errorBody) {
                $errorBody = [
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
            }

            Log::error('Add Ruas Jalan API Error - ' . $statusCode . ': ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function editRuasJalanById(Request $request, $id) {
        $baseUrl = env('API_URL');
        $endPoint = 'ruasjalan';
        $apiUrl = $baseUrl . $endPoint;

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

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->asForm() 
                ->put($apiUrl, [
                    'paths' => $request->paths,
                    'desa_id' => $request->desa_id,
                    'kode_ruas' => $request->kode_ruas,
                    'nama_ruas' => $request->nama_ruas,
                    'panjang' => $request->panjang,
                    'lebar' => $request->lebar,
                    'eksisting_id' => $request->eksisting_id,
                    'kondisi_id' => $request->kondisi_id,
                    'jenisjalan_id' => $request->jenisjalan_id,
                    'keterangan' => $request->keterangan,
                ]);
            
            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            Cache::forget('ruas_jalan_data_' . $id);

            return response()->json($response->json(), $response->status());
        } catch (\Exception $e) {
            $statusCode = $e->getCode();
            if ($statusCode < 100 || $statusCode > 599) {
                $statusCode = 500;
            }

            $errorBody = json_decode($e->getMessage(), true);

            if (!$errorBody) {
                $errorBody = [
                    'status' => 'error',
                    'message' => $e->getMessage()
                ];
            }

            Log::error('Edit Ruas Jalan API Error - ' . $statusCode . ': ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }
}
