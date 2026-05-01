<?php

namespace HazemHammad\PostmanClone\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property ?string $collection_id
 * @property ?string $request_id
 * @property ?string $request_name
 * @property ?string $environment_id
 * @property string $method
 * @property string $url_raw
 * @property string $url_resolved
 * @property array<int|string, mixed> $request_payload_json
 * @property ?int $response_status
 * @property ?array<string, mixed> $response_headers_json
 * @property ?string $response_body
 * @property bool $response_body_truncated
 * @property ?int $response_size_bytes
 * @property ?int $timing_ms
 * @property ?string $error_kind
 * @property ?string $error_message
 * @property ?\Illuminate\Support\Carbon $created_at
 */
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
