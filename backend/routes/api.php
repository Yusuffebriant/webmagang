<?php

use App\Http\Controllers\Api\Admin\AuthController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\PendaftarController as AdminPendaftarController;
use App\Http\Controllers\Api\Public\CekStatusController;
use App\Http\Controllers\Api\Public\PendaftaranController;
use App\Http\Controllers\Api\Public\ProgramController;
use Illuminate\Support\Facades\Route;

Route::get('/ping', fn () => response()->json(['status' => 'ok', 'app' => config('app.name')]));

// Publik
Route::prefix('public')->group(function () {
    Route::get('program', [ProgramController::class, 'index']);
    Route::get('bidang', [ProgramController::class, 'bidang']);
    Route::post('pendaftaran', [PendaftaranController::class, 'store'])->middleware('throttle:10,1');
    Route::get('cek-status/{nomor}', [CekStatusController::class, 'show'])->middleware('throttle:20,1');
});

// Admin
Route::prefix('admin')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:5,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('pendaftar/export', [AdminPendaftarController::class, 'export']);
        Route::get('pendaftar', [AdminPendaftarController::class, 'index']);
        Route::get('pendaftar/{pendaftar}', [AdminPendaftarController::class, 'show']);
        Route::patch('pendaftar/{pendaftar}/status', [AdminPendaftarController::class, 'updateStatus']);
        Route::post('pendaftar/{pendaftar}/loa', [AdminPendaftarController::class, 'unggahLoa']);
    });
});