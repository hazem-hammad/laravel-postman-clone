<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'postman_clone_storage';

    public function up(): void
    {
        Schema::connection($this->connection)->create('users', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('github_id')->unique();
            $table->string('github_login');
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('avatar_url');
            $table->text('encrypted_access_token');
            $table->boolean('has_repo_access')->default(false);
            $table->timestamp('last_repo_check_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::connection($this->connection)->dropIfExists('users');
    }
};
