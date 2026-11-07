<?php

use App\Http\Controllers\Sidapeg\AuthController;
use App\Http\Controllers\Sidapeg\PegawaiController;
use App\Http\Controllers\Sidapeg\RingkasanController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/api/referensi', [RingkasanController::class, 'referensi']);
    Route::get('/api/dashboard', [RingkasanController::class, 'dashboard']);
    Route::apiResource('api/pegawai', PegawaiController::class)->parameters(['pegawai' => 'pegawai']);
});
