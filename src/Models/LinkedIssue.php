<?php

namespace HazemHammad\PostmanClone\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $collection_id
 * @property string $request_id
 * @property int $issue_number
 * @property string $issue_title
 * @property string $issue_state
 * @property string $issue_html_url
 * @property ?string $assignee_login
 * @property int $created_by_user_id
 * @property int $comment_count
 * @property ?string $thread_html
 * @property ?string $thread_etag
 * @property ?\Illuminate\Support\Carbon $thread_fetched_at
 * @property ?\Illuminate\Support\Carbon $last_synced_at
 * @property ?string $idempotency_key
 * @property ?\Illuminate\Support\Carbon $deleted_at
 * @property \Illuminate\Support\Carbon $created_at
 * @property \Illuminate\Support\Carbon $updated_at
 */
class LinkedIssue extends Model
{
    protected $connection = 'postman_clone_storage';

    protected $table = 'linked_issues';

    protected $guarded = [];

    protected $casts = [
        'issue_number' => 'int',
        'comment_count' => 'int',
        'created_by_user_id' => 'int',
        'thread_fetched_at' => 'datetime',
        'last_synced_at' => 'datetime',
        'deleted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function isOpen(): bool
    {
        return $this->issue_state === 'open';
    }

    public function isDeleted(): bool
    {
        return $this->issue_state === 'deleted';
    }
}
