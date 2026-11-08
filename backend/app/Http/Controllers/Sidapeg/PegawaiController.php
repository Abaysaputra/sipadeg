<?php

namespace App\Http\Controllers\Sidapeg;

use App\Http\Controllers\Controller;
use App\Models\Pegawai;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $fields = $this->validatedFields($request);

        // Semua pembuatan pegawai mengunci baris penghitung yang sama.
        // Nomor dan pegawai disimpan bersama; kegagalan membatalkan keduanya.
        $pegawai = DB::transaction(function () use ($fields) {
            $counter = DB::table('nomor_pegawai_counters')
                ->where('kunci', 'pegawai')->lockForUpdate()->first();

            abort_unless($counter, 503, 'Penghitung nomor belum disiapkan. Jalankan SQL pembaruan.');
            $number = (int) $counter->last_number;

            do {
                if ($number >= 999999999999999999) {
                    throw ValidationException::withMessages([
                        'nomor_pegawai' => 'Kapasitas nomor pegawai telah habis.',
                    ]);
                }
                $number++;
                $code = 'PG'.str_pad((string) $number, 3, '0', STR_PAD_LEFT);
            } while (Pegawai::where('nomor_pegawai', $code)->exists());

            $pegawai = Pegawai::create([...$fields, 'nomor_pegawai' => $code]);
            DB::table('nomor_pegawai_counters')->where('kunci', 'pegawai')
                ->update(['last_number' => $number]);

            return $pegawai;
        }, 5);

        return response()->json($this->show($pegawai), 201);
    }

    public function update(Request $request, Pegawai $pegawai)
    {
        $pegawai->fill($this->validatedFields($request))->save();
        return $this->show($pegawai);
    }

    private function validatedFields(Request $request): array
    {
        $presence = $request->isMethod('patch') ? ['sometimes', 'required'] : ['required'];
        $fields = $request->validate([
            'nomor_pegawai' => ['prohibited'],
            'nama' => [...$presence,'string','max:100'],
            'jenis_kelamin' => [...$presence,Rule::in(['L','P'])],
            'tanggal_lahir' => [...$presence,'date_format:Y-m-d','before_or_equal:today'],
            'divisi_id' => [...$presence,'integer','exists:divisi,id'],
            'pendidikan_id' => [...$presence,'integer','exists:pendidikan,id'],
        ], [
            'nomor_pegawai.prohibited' => 'Nomor pegawai dibuat otomatis dan tidak dapat diubah. Hapus kolom nomor_pegawai dari request.',
        ]);
        // Nilai kosong juga tidak boleh ikut fill(), meskipun lolos prohibited.
        unset($fields['nomor_pegawai']);
        return $fields;
    }

    public function destroy(Request $request, Pegawai $pegawai)
    {
        $request->validate(['konfirmasi' => 'required|accepted']);
        $pegawai->delete();
        return response()->noContent();
    }
}
