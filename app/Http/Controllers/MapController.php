<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class MapController extends Controller
{
    public function getExistingJalan(Request $request) {
        $baseUrl = env('API_URL');
        $endPoint = 'meksisting';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'master_eksisting_data';
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

            Log::error('Jalan API Error - ' . $statusCode . ': ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getJenisJalan(Request $request) {
        $baseUrl = env('API_URL');
        $endPoint = 'mjenisjalan';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'master_jenis_jalan_data';
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

            Log::error('Jenis Jalan API Error - ' . $statusCode . ': ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getKondisiJalan(Request $request) {
        $baseUrl = env('API_URL');
        $endPoint = 'mkondisi';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'master_kondisi_jalan_data';
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

            Log::error('Kondisi Jalan API Error - ' . $statusCode . ': ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }
}
