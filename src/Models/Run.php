<?php

namespace HazemHammad\PostmanClone\Models;

use Illuminate\Database\Eloquent\Model;

class Run extends Model
{
    protected $connection = 'postman_clone_storage';

    protected $table = 'runs';

    public $timestamps = false;

    protected $guarded = [];

    protected $casts = [
        'request_payload_json' => 'array',
        'response_headers_json' => 'array',
        'response_body_truncated' => 'bool',
        'response_status' => 'int',
        'response_size_bytes' => 'int',
        'timing_ms' => 'int',
        'created_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $run): void {
            if (! $run->created_at) {
                $run->created_at = now();
            }
        });
    }
}
