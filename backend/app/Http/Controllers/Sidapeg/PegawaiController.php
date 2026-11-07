<?php

namespace App\Http\Controllers\Sidapeg;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class PegawaiController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'q' => 'nullable|string|max:100',
            'divisi_id' => 'nullable|integer',
            'pendidikan_id' => 'nullable|integer',
            'jenis_kelamin' => ['nullable', Rule::in(['L','P'])],
        ]);
        $query = Pegawai::daftar();
        if (isset($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(fn ($q) => $q->where('pegawai.nama','like',$term)
                ->orWhere('pegawai.nomor_pegawai','like',$term));
        }
        foreach (['divisi_id','pendidikan_id','jenis_kelamin'] as $field) {
            if (isset($filters[$field])) {
                $query->where('pegawai.'.$field, $filters[$field]);
            }
        }
        return $query->orderBy('pegawai.nomor_pegawai')->get();
    }

    public function show(Pegawai $pegawai)
    {
        return Pegawai::daftar()->whereKey($pegawai->id)->firstOrFail();
    }

    public function store(Request $request)
    {
        return response()->json($this->simpan($request, new Pegawai()), 201);
    }

    public function update(Request $request, Pegawai $pegawai)
    {
        return $this->simpan($request, $pegawai);
    }

    private function simpan(Request $request, Pegawai $pegawai)
    {
        $unique = Rule::unique('pegawai','nomor_pegawai');
        if ($pegawai->exists) {
            $unique->ignore($pegawai);
        }
        $presence = $request->isMethod('patch')
            ? ['sometimes', 'required']
            : ['required'];

        $fields = $request->validate([
            'nomor_pegawai' => [
                ...$presence,
                'string',
                'max:20',
                $unique,
            ],
            'nama' => [
                ...$presence,
                'string',
                'max:100',
            ],
            'jenis_kelamin' => [
                ...$presence,
                Rule::in(['L', 'P']),
            ],
            'tanggal_lahir' => [
                ...$presence,
                'date_format:Y-m-d',
                'before_or_equal:today',
            ],
            'divisi_id' => [
                ...$presence,
                'integer',
                'exists:divisi,id',
            ],
            'pendidikan_id' => [
                ...$presence,
                'integer',
                'exists:pendidikan,id',
            ],
        ]);
        try {
            $pegawai->fill($fields)->save();
        } catch (UniqueConstraintViolationException $e) {
            throw ValidationException::withMessages(['nomor_pegawai' => 'Nomor pegawai sudah digunakan.']);
        }
        return $this->show($pegawai);
    }

    public function destroy(Request $request, Pegawai $pegawai)
    {
        $request->validate(['konfirmasi' => 'required|accepted']);
        $pegawai->delete();
        return response()->noContent();
    }
}
