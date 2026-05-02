<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'postman_clone_storage';

    public function up(): void
    {
        Schema::connection($this->connection)->create('linked_issues', function (Blueprint $table) {
            $table->id();
            $table->string('collection_id');
            $table->string('request_id');
            $table->integer('issue_number');
            $table->string('issue_title');
            $table->string('issue_state', 16);
            $table->string('issue_html_url');
            $table->string('assignee_login')->nullable();
            $table->unsignedBigInteger('created_by_user_id');
            $table->integer('comment_count')->default(0);
            $table->longText('thread_html')->nullable();
            $table->string('thread_etag')->nullable();
            $table->timestamp('thread_fetched_at')->nullable();
            $table->timestamp('last_synced_at')->nullable();
            $table->string('idempotency_key')->nullable();
            $table->timestamp('deleted_at')->nullable();
            $table->timestamps();

            $table->index(['collection_id', 'request_id']);
            $table->index('issue_number');
            $table->unique('idempotency_key');
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('linked_issues');
    }
};
