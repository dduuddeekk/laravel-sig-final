<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RegionController extends Controller
{
    public function getAllRegion(Request $request) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/mregion';

        try {
            $token = $request->bearerToken();

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get($apiUrl);

            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            return response()->json($response->json(), 200);
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

            Log::error('Region API Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getProvinceById(Request $request, $id) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/provinsi/' . $id;

        try {
            $token = $request->bearerToken();

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get($apiUrl);

            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            return response()->json($response->json(), 200);
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

            Log::error('Provinsi By ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getKabupatenByProvinceId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/kabupaten/' . $id;

        try {
            $token = $request->bearerToken();

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get($apiUrl);

            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            return response()->json($response->json(), 200);
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

            Log::error('Kabupaten By Provinsi ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getKecamatanByKabupatenId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/kecamatan/' . $id;

        try {
            $token = $request->bearerToken();

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get($apiUrl);

            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            return response()->json($response->json(), 200);
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

            Log::error('Kecamatan By Kabupaten ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getVillageByKecamatanId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/desa/' . $id;

        try {
            $token = $request->bearerToken();

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get($apiUrl);

            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            return response()->json($response->json(), 200);
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

            Log::error('Village By Kecamatan ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getKecamatanByVillageId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/kecamatanbydesaid/' . $id;

        try {
            $token = $request->bearerToken();

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get($apiUrl);

            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            return response()->json($response->json(), 200);
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

            Log::error('Kecamatan by Village ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getKabupatenByKecamatanId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/kabupatenbykecamatanid/' . $id;

        try {
            $token = $request->bearerToken();

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get($apiUrl);

            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            return response()->json($response->json(), 200);
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

            Log::error('Kabupaten by Kecamatan ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getProvinceByKabupatenId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $apiUrl = rtrim($baseUrl, '/') . '/provinsibykabupatenid/' . $id;

        try {
            $token = $request->bearerToken();

            $response = Http::withoutVerifying()
                ->withToken($token)
                ->get($apiUrl);

            if ($response->failed()) {
                throw new \Exception($response->body(), $response->status());
            }

            return response()->json($response->json(), 200);
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

            Log::error('Province by Kabupaten ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }
}