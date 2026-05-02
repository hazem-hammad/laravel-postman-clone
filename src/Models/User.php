<?php

namespace HazemHammad\PostmanClone\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

/**
 * @property int $id
 * @property int $github_id
 * @property string $github_login
 * @property ?string $name
 * @property ?string $email
 * @property string $avatar_url
 * @property string $encrypted_access_token
 * @property bool $has_repo_access
 * @property ?\Illuminate\Support\Carbon $last_repo_check_at
 * @property ?\Illuminate\Support\Carbon $last_seen_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class User extends Model
{
    protected $connection = 'postman_clone_storage';

    protected $table = 'users';

    protected $guarded = [];

    protected $casts = [
        'github_id' => 'int',
        'has_repo_access' => 'bool',
        'last_repo_check_at' => 'datetime',
        'last_seen_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getAccessToken(): string
    {
        return Crypt::decryptString($this->encrypted_access_token);
    }

    public function setAccessToken(string $token): void
    {
        $this->encrypted_access_token = Crypt::encryptString($token);
    }
}
