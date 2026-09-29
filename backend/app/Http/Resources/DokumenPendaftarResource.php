<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DokumenPendaftarResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'jenis_dokumen'  => $this->jenis_dokumen,
            'url'            => asset('storage/' . $this->file),
        ];
    }
}