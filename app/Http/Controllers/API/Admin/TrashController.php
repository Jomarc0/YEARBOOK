<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Concerns\AuditsAdminActions;
use App\Models\Album;
use App\Models\Announcement;
use App\Models\AuditLog;
use App\Models\Batch;
use App\Models\Faculty;
use App\Models\GraduationAlbum;
use App\Models\Photo;
use App\Models\PostMedia;
use App\Models\Section;
use App\Models\Student;
use App\Models\TaggedPhoto;
use App\Models\VoiceNote;
use App\Models\Yearbook;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

class TrashController extends Controller
{
    use AuditsAdminActions;

    // ── Type registry ─────────────────────────────────────────────────────────

    private function registry(): array
    {
        return [
            'yearbook' => [
                'model'        => Yearbook::class,
                'label'        => 'Yearbooks',
                'icon'         => '📚',
                'title_col'    => 'title',
                'subtitle_col' => 'academic_year',
                'cloudinary'   => null,
            ],
            'faculty' => [
                'model'        => Faculty::class,
                'label'        => 'Faculty',
                'icon'         => '👨‍🏫',
                'title_col'    => 'name',
                'subtitle_col' => 'department',
                'cloudinary'   => fn ($m) => (
                    $m->image && ! str_starts_with($m->image, 'http') ? $m->image : null
                ),
            ],
            'graduation_album' => [
                'model'        => GraduationAlbum::class,
                'label'        => 'Graduation Albums',
                'icon'         => '🎓',
                'title_col'    => 'title',
                'subtitle_col' => 'category',
                'cloudinary'   => fn ($m) => $m->cloudinary_public_id ?? null,
            ],
            'album' => [
                'model'        => Album::class,
                'label'        => 'Albums',
                'icon'         => '🖼️',
                'title_col'    => 'title',
                'subtitle_col' => 'category',
                'cloudinary'   => null,
            ],
            'photo' => [
                'model'        => Photo::class,
                'label'        => 'Photos',
                'icon'         => '📷',
                'title_col'    => 'caption',
                'subtitle_col' => 'status',
                'cloudinary'   => null,
            ],
            'post_media' => [
                'model'        => PostMedia::class,
                'label'        => 'Post Media',
                'icon'         => '🎬',
                'title_col'    => 'resource_type',
                'subtitle_col' => 'status',
                'cloudinary'   => null,
            ],
            'voice_note' => [
                'model'        => VoiceNote::class,
                'label'        => 'Voice Notes',
                'icon'         => '🎙️',
                'title_col'    => 'title',
                'subtitle_col' => 'status',
                'cloudinary'   => null,
            ],
            'tagged_photo' => [
                'model'        => TaggedPhoto::class,
                'label'        => 'Tagged Photos',
                'icon'         => '🏷️',
                'title_col'    => 'caption',
                'subtitle_col' => 'status',
                'cloudinary'   => null,
            ],
            'batch' => [
                'model'        => Batch::class,
                'label'        => 'Batches',
                'icon'         => '🎓',
                'title_col'    => 'name',
                'subtitle_col' => 'graduation_year',
                'cloudinary'   => null,
            ],
            'section' => [
                'model'        => Section::class,
                'label'        => 'Sections',
                'icon'         => '📋',
                'title_col'    => 'name',
                'subtitle_col' => 'course',
                'cloudinary'   => null,
            ],
            'student' => [
                'model'        => Student::class,
                'label'        => 'Students',
                'icon'         => '🧑‍🎓',
                'title_col'    => 'first_name',
                'subtitle_col' => 'last_name',
                'cloudinary'   => fn ($m) => $m->photo_public_id ?? null,
            ],
            'user' => [
                'model'        => User::class,
                'label'        => 'Users',
                'icon'         => '👤',
                'title_col'    => 'first_name',
                'subtitle_col' => 'email',
                'cloudinary'   => fn ($m) => $m->profile_picture ?? null,
            ],
            'announcement' => [
                'model'        => Announcement::class,
                'label'        => 'Announcements',
                'icon'         => 'announcement',
                'title_col'    => 'title',
                'subtitle_col' => 'type',
                'cloudinary'   => null,
            ],
        ];
    }

    // GET /api/admin/trash/counts
    public function counts(): JsonResponse
    {
        $result = [];

        foreach ($this->registry() as $type => $cfg) {
            $model         = $cfg['model'];
            $result[$type] = [
                'label' => $cfg['label'],
                'icon'  => $cfg['icon'],
                'count' => $model::onlyTrashed()->count(),
            ];
        }

        $result['_total'] = array_sum(array_column($result, 'count'));

        return response()->json($result);
    }

    // GET /api/admin/trash
    public function index(Request $request): JsonResponse
    {
        $type    = $request->get('type');
        $search  = $request->get('search', '');
        $perPage = (int) $request->get('per_page', 15);

        if ($type && array_key_exists($type, $this->registry())) {
            return response()->json($this->queryType($type, $search, $perPage));
        }

        $all = [];
        foreach ($this->registry() as $slug => $_) {
            $result = $this->queryType($slug, $search, $perPage);
            if ($result['total'] > 0) {
                $all[$slug] = $result;
            }
        }

        return response()->json($all);
    }

    // POST /api/admin/trash/{type}/{id}/restore
    public function restore(string $type, int $id): JsonResponse
    {
        $cfg  = $this->resolveType($type);
        $item = $cfg['model']::onlyTrashed()->findOrFail($id);
        $item->restore();

        $this->audit(
            AuditLog::ACTION_TRASH_RESTORED,
            "Restored {$cfg['label']} #{$id} from trash.",
            AuditLog::STATUS_SUCCESS,
            null,
            $id,
            "{$type}#{$id}",
        );

        return response()->json(['message' => "{$cfg['label']} #{$id} restored successfully."]);
    }

    // DELETE /api/admin/trash/{type}/{id}
    public function forceDelete(string $type, int $id): JsonResponse
    {
        $cfg  = $this->resolveType($type);
        $item = $cfg['model']::onlyTrashed()->findOrFail($id);

        if ($cfg['cloudinary']) {
            $publicId = ($cfg['cloudinary'])($item);
            if ($publicId) {
                $this->purgeCloudinary($publicId, $type);
            }
        }

        $item->forceDelete();

        $this->audit(
            AuditLog::ACTION_TRASH_PURGED,
            "Permanently deleted {$cfg['label']} #{$id} (force-deleted from trash). Cloudinary assets purged if applicable.",
            AuditLog::STATUS_CRITICAL,
            null,
            $id,
            "{$type}#{$id}",
        );

        return response()->json(['message' => "{$cfg['label']} #{$id} permanently deleted."]);
    }

    // POST /api/admin/trash/bulk-restore
    public function bulkRestore(Request $request): JsonResponse
    {
        $request->validate([
            'type'  => 'required|string',
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $cfg      = $this->resolveType($request->type);
        $model    = $cfg['model'];
        $restored = $model::onlyTrashed()->whereIn('id', $request->ids)->restore();

        $this->audit(
            AuditLog::ACTION_BULK_RESTORED,
            "Bulk restored {$restored} {$cfg['label']} from trash. IDs: " . implode(', ', $request->ids),
            AuditLog::STATUS_SUCCESS,
        );

        return response()->json([
            'message'  => "{$restored} {$cfg['label']} restored.",
            'restored' => $restored,
        ]);
    }

    // DELETE /api/admin/trash/bulk-force
    public function bulkForce(Request $request): JsonResponse
    {
        $request->validate([
            'type'  => 'required|string',
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $cfg   = $this->resolveType($request->type);
        $model = $cfg['model'];
        $items = $model::onlyTrashed()->whereIn('id', $request->ids)->get();

        foreach ($items as $item) {
            if ($cfg['cloudinary']) {
                $publicId = ($cfg['cloudinary'])($item);
                if ($publicId) {
                    $this->purgeCloudinary($publicId, $request->type);
                }
            }
            $item->forceDelete();
        }

        $this->audit(
            AuditLog::ACTION_BULK_PURGED,
            "Bulk force-deleted " . count($items) . " {$cfg['label']} permanently. IDs: " . implode(', ', $request->ids),
            AuditLog::STATUS_CRITICAL,
        );

        return response()->json([
            'message' => count($items) . " {$cfg['label']} permanently deleted.",
            'deleted' => count($items),
        ]);
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private function resolveType(string $type): array
    {
        $registry = $this->registry();

        abort_unless(
            array_key_exists($type, $registry),
            422,
            "Unknown trash type: {$type}"
        );

        return $registry[$type];
    }

    private function queryType(string $type, ?string $search = '', int $perPage = 15): array
    {
        $cfg         = $this->registry()[$type];
        $model       = $cfg['model'];
        $titleCol    = $cfg['title_col'];
        $subtitleCol = $cfg['subtitle_col'];

        $query = $model::onlyTrashed()->orderByDesc('deleted_at');

        if ($search) {
            $query->where(function ($q) use ($titleCol, $subtitleCol, $search) {
                $q->where($titleCol, 'like', "%{$search}%");
                if ($subtitleCol) {
                    $q->orWhere($subtitleCol, 'like', "%{$search}%");
                }
            });
        }

        $paginated = $query->paginate($perPage);

        $items = $paginated->getCollection()->map(function ($m) use ($cfg, $type) {
            $titleCol    = $cfg['title_col'];
            $subtitleCol = $cfg['subtitle_col'];

            $title = $type === 'student'
                ? trim("{$m->first_name} {$m->last_name}")
                : ($m->{$titleCol} ?? "#{$m->id}");

            return [
                'id'          => $m->id,
                'type'        => $type,
                'label'       => $cfg['label'],
                'icon'        => $cfg['icon'],
                'title'       => $title ?: "#{$m->id}",
                'subtitle'    => $subtitleCol ? ($m->{$subtitleCol} ?? null) : null,
                'deleted_at'  => $m->deleted_at?->toISOString(),
                'deleted_ago' => $m->deleted_at?->diffForHumans(),
                'thumbnail'   => $this->resolveThumbnail($m, $type),
            ];
        });

        return [
            'type'         => $type,
            'label'        => $cfg['label'],
            'icon'         => $cfg['icon'],
            'total'        => $paginated->total(),
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'data'         => $items->values(),
        ];
    }

    private function resolveThumbnail(mixed $model, string $type): ?string
    {
        return match ($type) {
            'yearbook'         => $model->cover_image    ?? null,
            'faculty'          => $this->resolveCloudinaryUrl($model->image ?? null),
            'graduation_album' => $model->media_url       ?? null,
            'album'            => $model->cover_image     ?? null,
            'photo'            => $this->maybeUrl($model->file_path ?? null),
            'post_media'       => $this->maybeUrl($model->file_path ?? null),
            'student'          => $model->photo           ?? null,
            default            => null,
        };
    }

    private function maybeUrl(?string $path): ?string
    {
        if (! $path) return null;
        return str_starts_with($path, 'http') ? $path : asset('storage/' . $path);
    }

    private function resolveCloudinaryUrl(?string $image): ?string
    {
        if (! $image) return null;
        if (str_starts_with($image, 'http')) return $image;

        try {
            $cloudinary = new \Cloudinary\Cloudinary();
            return (string) $cloudinary->image($image)->toUrl();
        } catch (Throwable) {
            return null;
        }
    }

    private function purgeCloudinary(string $publicId, string $type): void
    {
        try {
            $resourceType = in_array($type, ['graduation_album', 'post_media', 'voice_note'])
                ? 'video'
                : 'image';

            $cloudinary = new \Cloudinary\Cloudinary();
            $cloudinary->uploadApi()->destroy($publicId, ['resource_type' => $resourceType]);
        } catch (Throwable $e) {
            Log::warning("[TrashController] Cloudinary purge failed for {$publicId}: {$e->getMessage()}");
        }
    }
}
