<?php

namespace App\Http\Controllers\Sidapeg;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class RingkasanController extends Controller
{
    public function referensi()
    {
        return [
            'divisi' => DB::table('divisi')->orderBy('id')->get(['id','nama']),
            'pendidikan' => DB::table('pendidikan')->orderBy('id')->get(['id','nama']),
        ];
    }

    public function dashboard()
    {
        $gender = ['Laki-laki' => 0, 'Perempuan' => 0];
        $usia = ['<25' => 0, '25-34' => 0, '35-44' => 0, '45+' => 0];
        $pendidikan = DB::table('pendidikan')->orderBy('id')->pluck('nama')->mapWithKeys(fn ($nama) => [$nama => 0])->all();
        $rows = DB::table('pegawai')->join('pendidikan as e','e.id','=','pegawai.pendidikan_id')
            ->selectRaw('jenis_kelamin, e.nama as jenjang, TIMESTAMPDIFF(YEAR,tanggal_lahir,CURDATE()) as tahun')->get();
        foreach ($rows as $row) {
            $gender[$row->jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan']++;
            $pendidikan[$row->jenjang]++;
            $grup = match (true) {
                $row->tahun < 25 => '<25',
                $row->tahun < 35 => '25-34',
                $row->tahun < 45 => '35-44',
                default => '45+',
            };
            $usia[$grup]++;
        }
        return ['total' => $rows->count(), 'jenis_kelamin' => $gender, 'pendidikan' => $pendidikan, 'usia' => $usia];
    }
}
