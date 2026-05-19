<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLog extends Model
{
    protected $fillable = [
        'admin_id',
        'user_name',
        'action',
        'details',
        'ip_address',
        'status',
        'logged_at',
    ];

    protected $casts = [
        'logged_at' => 'datetime',
    ];

    public static function record(
        Request $request,
        string $action,
        string $details,
        string $status = 'Success'
    ): self {
        return self::create([
            'admin_id' => $request->session()->get('admin_id'),
            'user_name' => $request->session()->get('admin_username')
                ?? optional($request->user())->email
                ?? 'system',
            'action' => $action,
            'details' => $details,
            'ip_address' => $request->ip() ?? '127.0.0.1',
            'status' => $status,
            'logged_at' => now(),
        ]);
    }
}
