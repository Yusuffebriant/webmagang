<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;

class PengaturanSertifikat extends Model
{
    protected $table = 'pengaturan_sertifikat';
    protected $guarded = ['id'];

    /**
     * Nilai bawaan template (mengikuti sertifikat contoh). Admin bisa mengubah semuanya.
     * Placeholder yang tersedia:
     *  - kalimat_isi   : {nama} {instansi} {bidang} {periode} {periode_mulai} {periode_selesai}
     *  - format_nomor  : {urut} {tahun}
     */
    public const BAWAAN = [
        'instansi_nama'     => "BADAN KEPEGAWAIAN DAN PENGEMBANGAN SUMBER\nDAYA MANUSIA KOTA YOGYAKARTA",
        'instansi_alamat'   => 'Alamat : Komplek Balaikota Timoho Jl. Kenari No.56, Muja Muju, Umbulharjo, Kota Yogyakarta, Daerah Istimewa Yogyakarta 55165.',
        'instansi_kontak'   => 'E-mail : bkpsdm@jogjakota.go.id | Phone : (0274) 556919, IIP : 083856412187',
        'judul'             => 'SERTIFIKAT',
        'kalimat_pembuka'   => 'Sertifikat ini diberikan kepada :',
        'kalimat_isi'       => 'atas partisipasinya sebagai mahasiswa PKL atau magang di Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Kota Yogyakarta pada bidang {bidang} periode {periode} dan menyelesaikan penugasan dengan baik.',
        'kota'              => 'Yogyakarta',
        'jabatan_pejabat'   => "An. Kepala,\nKepala Sub Bagian Umum Kepegawaian,",
        'nama_pejabat'      => 'Makmun, S.M.',
        'nip_pejabat'       => '196811241994031003',
        'format_nomor'      => '{urut}/BKPSDM/SERT/{tahun}',
        'ttd_pejabat'       => '', // path file gambar tanda tangan (disk local); kosong = tanpa gambar
        'peserta_bisa_unduh' => '0', // 1 = peserta boleh unduh sendiri di Cek Status setelah periode selesai
    ];

    /** Semua pengaturan: nilai tersimpan menimpa nilai bawaan. */
    protected static ?array $memo = null;

    public static function semua(): array
    {
        if (static::$memo !== null) {
            return static::$memo;
        }

        $data = self::BAWAAN;

        if (Schema::hasTable('pengaturan_sertifikat')) {
            foreach (static::query()->pluck('nilai', 'kunci') as $k => $v) {
                if (array_key_exists($k, $data)) {
                    $data[$k] = (string) $v;
                }
            }
        }

        return static::$memo = $data;
    }

    public static function simpan(array $nilai): array
    {
        foreach (array_intersect_key($nilai, self::BAWAAN) as $k => $v) {
            static::updateOrCreate(['kunci' => $k], ['nilai' => (string) ($v ?? '')]);
        }

        static::$memo = null;

        return static::semua();
    }

    public static function pesertaBisaUnduh(): bool
    {
        return static::semua()['peserta_bisa_unduh'] === '1';
    }

    /** Pengaturan untuk dikirim ke browser: ttd_pejabat berisi data URL gambar (atau kosong). */
    public static function untukKlien(): array
    {
        $data = static::semua();
        $path = (string) ($data['ttd_pejabat'] ?? '');
        $data['ttd_pejabat'] = '';

        if ($path !== '' && Storage::disk('local')->exists($path)) {
            $mime = str_ends_with($path, '.png') ? 'image/png' : 'image/jpeg';
            $data['ttd_pejabat'] = 'data:'.$mime.';base64,'.base64_encode(Storage::disk('local')->get($path));
        }

        return $data;
    }

    public static function simpanTtd(UploadedFile $file): void
    {
        $lama = (string) (static::semua()['ttd_pejabat'] ?? '');
        $ext = strtolower($file->extension()) === 'png' ? 'png' : 'jpg';
        $path = $file->storeAs('sertifikat', 'ttd-'.time().'.'.$ext, 'local');

        static::updateOrCreate(['kunci' => 'ttd_pejabat'], ['nilai' => $path]);
        static::$memo = null;

        if ($lama !== '' && $lama !== $path) {
            Storage::disk('local')->delete($lama);
        }
    }

    public static function hapusTtd(): void
    {
        $lama = (string) (static::semua()['ttd_pejabat'] ?? '');
        if ($lama !== '') {
            Storage::disk('local')->delete($lama);
        }

        static::updateOrCreate(['kunci' => 'ttd_pejabat'], ['nilai' => '']);
        static::$memo = null;
    }
}