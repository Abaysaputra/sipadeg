<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pegawai extends Model
{
    protected $table = 'pegawai';
    protected $fillable = ['nomor_pegawai','nama','jenis_kelamin','tanggal_lahir','divisi_id','pendidikan_id'];

    public static function daftar()
    {
        return static::query()
            ->join('divisi as d', 'd.id', '=', 'pegawai.divisi_id')
            ->join('pendidikan as e', 'e.id', '=', 'pegawai.pendidikan_id')
            ->select('pegawai.*', 'd.nama as divisi', 'e.nama as pendidikan')
            ->selectRaw('TIMESTAMPDIFF(YEAR, pegawai.tanggal_lahir, CURDATE()) as usia');
    }
}
