<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class RegionController extends Controller
{
    public function getAllRegion(Request $request) {
        $baseUrl = env('API_URL');
        $endPoint = 'mregion';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'all_regions_data';
        $cacheTime = 60 * 60 * 24;

        try {
            $data = Cache::remember($cacheKey, $cacheTime, function () use ($apiUrl, $request) {
                $token = $request->bearerToken();

                $response = Http::withoutVerifying()
                    ->withToken($token)
                    ->get($apiUrl);

                if ($response->failed()) {
                    throw new \Exception('Failed to fetch data: ' . $response->status() . ' - ' . $response->body());
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

            Log::error('Region API Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getProvinceById(Request $request, $id) {
        $baseUrl = env('API_URL');
        $endPoint = 'provinsi';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'province_data_' . $id;
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

            Log::error('Provinsi By ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getKabupatenByProvinceId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $endPoint = 'kabupaten';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'kabupaten_data_' . $id;
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

            Log::error('Kabupaten By Provinsi ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getKecamatanByKabupatenId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $endPoint = 'kecamatan';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'kecamatan_data_' . $id;
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

            Log::error('Kecamatan By Kabupaten ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getVillageByKecamatanId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $endPoint = 'desa';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'desa_data_' . $id;
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

            Log::error('Village By Kecamatan ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getKecamatanByVillageId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $endPoint = 'kecamatanbydesaid';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'kecamatan_data_' . $id;
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

            Log::error('Kecamatan by Village ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getKabupatenByKecamatanId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $endPoint = 'kabupatenbykecamatanid';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'kabupaten_data_' . $id;
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

            Log::error('Kabupaten by Kecamatan ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }

    public function getProvinceByKabupatenId(Request $request, $id) {
        $baseUrl = env('API_URL');
        $endPoint = 'provinsibykabupatenid';
        $apiUrl = $baseUrl . $endPoint;

        $cacheKey = 'province_data_' . $id;
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

            Log::error('Province by Kabupaten ID Error (' . $statusCode . '): ' . $e->getMessage());

            return response()->json($errorBody, $statusCode);
        }
    }
}
