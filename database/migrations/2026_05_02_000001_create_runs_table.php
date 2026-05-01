<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'postman_clone_storage';

    public function up(): void
    {
        Schema::connection($this->connection)->create('runs', function (Blueprint $table) {
            $table->id();
            $table->string('collection_id')->nullable();
            $table->string('request_id')->nullable();
            $table->string('request_name')->nullable();
            $table->string('environment_id')->nullable();
            $table->string('method', 10);
            $table->text('url_raw');
            $table->text('url_resolved');
            $table->json('request_payload_json');
            $table->integer('response_status')->nullable();
            $table->json('response_headers_json')->nullable();
            $table->longText('response_body')->nullable();
            $table->boolean('response_body_truncated')->default(false);
            $table->bigInteger('response_size_bytes')->nullable();
            $table->integer('timing_ms')->nullable();
            $table->string('error_kind')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index('created_at');
            $table->index(['collection_id', 'request_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('runs');
    }
};
