<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                foreach ([
                    'first_name' => ['string', null],
                    'last_name' => ['string', null],
                    'name' => ['string', null],
                    'role' => ['string', 'student'],
                    'student_record_id' => ['unsignedBigInteger', null],
                    'section_id' => ['unsignedBigInteger', null],
                    'batch_id' => ['unsignedBigInteger', null],
                    'student_id' => ['string', null],
                    'course' => ['string', null],
                    'batch' => ['string', null],
                    'avatar' => ['string', null],
                    'profile_picture' => ['string', null],
                    'profile_picture_public_id' => ['string', null],
                    'profile_visibility' => ['string', 'public'],
                    'motto' => ['string', null],
                    'google_id' => ['string', null],
                    'fcm_token' => ['string', null],
                    'nickname' => ['string', null],
                    'hometown' => ['string', null],
                    'honors' => ['string', null],
                    'facebook_url' => ['string', null],
                    'instagram_url' => ['string', null],
                    'linkedin_url' => ['string', null],
                    'github_url' => ['string', null],
                ] as $column => [$type, $default]) {
                    if (! Schema::hasColumn('users', $column)) {
                        $definition = $table->{$type}($column)->nullable();
                        if ($default !== null) {
                            $definition->default($default);
                        }
                    }
                }

                foreach ([
                    'bio',
                    'google_token',
                    'organizations',
                    'achievements',
                    'ambition',
                    'future_plans',
                    'fondest_memory',
                    'most_likely_to',
                    'message_to_batchmates',
                    'message_to_parents',
                ] as $column) {
                    if (! Schema::hasColumn('users', $column)) {
                        $table->text($column)->nullable();
                    }
                }

                if (! Schema::hasColumn('users', 'graduation_year')) {
                    $table->integer('graduation_year')->nullable();
                }
                if (! Schema::hasColumn('users', 'profile_views')) {
                    $table->unsignedInteger('profile_views')->default(0);
                }
                if (! Schema::hasColumn('users', 'email_verified')) {
                    $table->boolean('email_verified')->default(false);
                }
                if (! Schema::hasColumn('users', 'consent_accepted')) {
                    $table->boolean('consent_accepted')->default(false);
                }
                if (! Schema::hasColumn('users', 'birthday')) {
                    $table->date('birthday')->nullable();
                }
                if (! Schema::hasColumn('users', 'suspended_at')) {
                    $table->timestamp('suspended_at')->nullable();
                }
                if (! Schema::hasColumn('users', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        if (Schema::hasTable('students')) {
            Schema::table('students', function (Blueprint $table) {
                foreach ([
                    'student_no',
                    'first_name',
                    'last_name',
                    'course',
                    'section',
                    'photo',
                    'motto',
                    'student_quote',
                ] as $column) {
                    if (! Schema::hasColumn('students', $column)) {
                        $table->string($column)->nullable();
                    }
                }

                foreach ([
                    'organizations',
                    'achievements',
                    'ambition',
                    'future_plans',
                    'fondest_memory',
                    'most_likely_to',
                    'message_to_batchmates',
                    'message_to_parents',
                ] as $column) {
                    if (! Schema::hasColumn('students', $column)) {
                        $table->text($column)->nullable();
                    }
                }

                if (! Schema::hasColumn('students', 'graduation_year')) {
                    $table->unsignedSmallInteger('graduation_year')->nullable();
                }
                if (! Schema::hasColumn('students', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable();
                }
            });
        }

        if (! Schema::hasTable('audit_logs')) {
            Schema::create('audit_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('admin_id')->nullable();
                $table->string('user_name')->default('system');
                $table->string('action');
                $table->text('details');
                $table->string('ip_address', 45)->nullable();
                $table->string('status')->default('Success');
                $table->timestamp('logged_at')->nullable();
                $table->text('note')->nullable();
                $table->string('reason')->nullable();
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('subject_id')->nullable();
                $table->string('subject_name')->nullable();
                $table->string('severity')->nullable()->default('info');
                $table->timestamps();
            });
        } else {
            Schema::table('audit_logs', function (Blueprint $table) {
                foreach ([
                    'user_name' => ['string', 'system'],
                    'action' => ['string', null],
                    'ip_address' => ['string', null],
                    'status' => ['string', 'Success'],
                    'reason' => ['string', null],
                    'subject_name' => ['string', null],
                    'severity' => ['string', 'info'],
                ] as $column => [$type, $default]) {
                    if (! Schema::hasColumn('audit_logs', $column)) {
                        $definition = $table->{$type}($column)->nullable();
                        if ($default !== null) {
                            $definition->default($default);
                        }
                    }
                }

                foreach (['details', 'note'] as $column) {
                    if (! Schema::hasColumn('audit_logs', $column)) {
                        $table->text($column)->nullable();
                    }
                }

                foreach (['admin_id', 'created_by', 'subject_id'] as $column) {
                    if (! Schema::hasColumn('audit_logs', $column)) {
                        $table->unsignedBigInteger($column)->nullable();
                    }
                }

                if (! Schema::hasColumn('audit_logs', 'logged_at')) {
                    $table->timestamp('logged_at')->nullable();
                }
            });
        }

        if (! Schema::hasTable('user_notifications')) {
            Schema::create('user_notifications', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('type');
                $table->string('title');
                $table->text('body');
                $table->json('data')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamps();

                $table->index(['user_id', 'is_read']);
            });
        }

        if (! Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->text('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable()->index();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('albums')) {
            Schema::create('albums', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('cover_image')->nullable();
                $table->date('event_date')->nullable();
                $table->string('type')->default('general');
                $table->string('category')->nullable();
                $table->text('media_url')->nullable();
                $table->string('cloudinary_public_id')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });
        } else {
            Schema::table('albums', function (Blueprint $table) {
                if (! Schema::hasColumn('albums', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable();
                }
                if (! Schema::hasColumn('albums', 'type')) {
                    $table->string('type')->default('general');
                }
                if (! Schema::hasColumn('albums', 'category')) {
                    $table->string('category')->nullable();
                }
                if (! Schema::hasColumn('albums', 'event_date')) {
                    $table->date('event_date')->nullable();
                }
                if (! Schema::hasColumn('albums', 'media_url')) {
                    $table->text('media_url')->nullable();
                }
                if (! Schema::hasColumn('albums', 'cloudinary_public_id')) {
                    $table->string('cloudinary_public_id')->nullable();
                }
                if (! Schema::hasColumn('albums', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        if (! Schema::hasTable('galleries')) {
            Schema::create('galleries', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('album_id');
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('caption')->nullable();
                $table->string('status')->default('pending');
                $table->string('visibility')->default('public');
                $table->json('ai_metadata')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->string('rejection_reason')->nullable();
                $table->timestamp('approved_at')->nullable();
                $table->unsignedBigInteger('approved_by')->nullable();
                $table->timestamp('rejected_at')->nullable();
                $table->unsignedBigInteger('rejected_by')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['album_id', 'status']);
                $table->index(['user_id', 'status']);
            });
        } else {
            Schema::table('galleries', function (Blueprint $table) {
                if (! Schema::hasColumn('galleries', 'album_id')) {
                    $table->unsignedBigInteger('album_id');
                }
                if (! Schema::hasColumn('galleries', 'user_id')) {
                    $table->unsignedBigInteger('user_id')->nullable();
                }
                if (! Schema::hasColumn('galleries', 'caption')) {
                    $table->string('caption')->nullable();
                }
                if (! Schema::hasColumn('galleries', 'status')) {
                    $table->string('status')->default('pending');
                }
                if (! Schema::hasColumn('galleries', 'visibility')) {
                    $table->string('visibility')->default('public');
                }
                if (! Schema::hasColumn('galleries', 'ai_metadata')) {
                    $table->json('ai_metadata')->nullable();
                }
                if (! Schema::hasColumn('galleries', 'sort_order')) {
                    $table->unsignedInteger('sort_order')->default(0);
                }
                if (! Schema::hasColumn('galleries', 'rejection_reason')) {
                    $table->string('rejection_reason')->nullable();
                }
                if (! Schema::hasColumn('galleries', 'approved_at')) {
                    $table->timestamp('approved_at')->nullable();
                }
                if (! Schema::hasColumn('galleries', 'approved_by')) {
                    $table->unsignedBigInteger('approved_by')->nullable();
                }
                if (! Schema::hasColumn('galleries', 'rejected_at')) {
                    $table->timestamp('rejected_at')->nullable();
                }
                if (! Schema::hasColumn('galleries', 'rejected_by')) {
                    $table->unsignedBigInteger('rejected_by')->nullable();
                }
                if (! Schema::hasColumn('galleries', 'deleted_at')) {
                    $table->softDeletes();
                }
            });
        }

        if (! Schema::hasTable('gallery_media')) {
            Schema::create('gallery_media', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('gallery_id');
                $table->string('file_path');
                $table->string('public_id')->nullable();
                $table->string('resource_type')->default('image');
                $table->unsignedBigInteger('bytes')->default(0);
                $table->unsignedInteger('width')->nullable();
                $table->unsignedInteger('height')->nullable();
                $table->unsignedInteger('sort_order')->default(0);
                $table->timestamps();

                $table->index(['gallery_id', 'sort_order']);
            });
        }

        if (! Schema::hasTable('yearbook_bookmarks')) {
            Schema::create('yearbook_bookmarks', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->unsignedBigInteger('batch_id');
                $table->unsignedInteger('page_index');
                $table->string('label', 120);
                $table->timestamps();

                $table->unique(['user_id', 'batch_id', 'page_index']);
                $table->index(['user_id', 'batch_id']);
            });
        }
    }

    public function down(): void
    {
        //
    }
};