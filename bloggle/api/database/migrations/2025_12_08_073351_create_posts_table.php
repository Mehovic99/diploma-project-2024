<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->nullOnDelete();
            $table->string('type')->default('user_post');
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('body_md')->nullable();
            $table->text('body_html')->nullable();
            $table->string('link_url')->nullable();
            $table->foreignId('news_source_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('published');
            $table->integer('score')->default(0);
            $table->unsignedInteger('comments_count')->default(0);
            $table->unsignedInteger('votes_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
