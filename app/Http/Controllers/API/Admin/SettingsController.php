<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin;
use App\Models\AuditLog;
use App\Models\Batch;
use App\Models\Setting;
use App\Models\User;
use App\Support\PlatformSettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class SettingsController extends Controller
{
  // GET /api/admin/settings
  public function index(): JsonResponse
  {
    return response()->json([
      'data' => PlatformSettings::all(),
    ]);
  }

  // POST /api/admin/settings
  public function save(Request $request): JsonResponse
  {
    $payload = $request->only(PlatformSettings::ALLOWED_KEYS);

    foreach (['contact_email', 'graduation_date'] as $nullableKey) {
      if (array_key_exists($nullableKey, $payload) && $payload[$nullableKey] === '') {
        $payload[$nullableKey] = null;
      }
    }

    if ($payload === []) {
      return response()->json(['message' => 'No settings provided.'], 422);
    }

    $validator = Validator::make($payload, PlatformSettings::validationRulesForKeys(array_keys($payload)));

    if ($validator->fails()) {
      throw new ValidationException($validator);
    }

    $changed = [];

    foreach ($payload as $key => $value) {
      $normalized = $this->normalizeValue($key, $value);
      $previous   = (string) Setting::getValue($key, PlatformSettings::DEFAULTS[$key] ?? '');

      if ($previous !== $normalized) {
        $changed[] = $key;
        Setting::putValue($key, $normalized);
      }
    }

    if ($changed !== []) {
      $this->logAction(
        'settings_update',
        'Admin updated system settings.',
        'Changed keys: ' . implode(', ', $changed)
      );
    }

    return response()->json([
      'message' => 'Settings saved successfully.',
      'changed' => $changed,
    ]);
  }

  // DELETE /api/admin/settings/clear-audit-logs
  public function clearAuditLogs(): JsonResponse
  {
    AuditLog::query()->truncate();

    $this->logAction('settings_clear_audit', 'Admin cleared all audit logs.');

    return response()->json(['message' => 'Audit logs cleared.']);
  }

  // POST /api/admin/settings/reset
  public function reset(): JsonResponse
  {
    foreach (PlatformSettings::DEFAULTS as $key => $value) {
      Setting::putValue($key, $value);
    }

    $this->logAction('settings_reset', 'Admin reset all settings to defaults.');

    return response()->json([
      'message' => 'Settings reset to defaults.',
      'data'    => PlatformSettings::DEFAULTS,
    ]);
  }

  // POST /api/admin/settings/archive-batch
  public function archiveBatch(Request $request): JsonResponse
  {
    $request->validate([
      'batch_id' => 'sometimes|integer|exists:batches,id',
    ]);

    $batchName = null;

    try {
      DB::transaction(function () use ($request, &$batchName) {
        $batch = $this->resolveBatchForArchive($request);

        if (! $batch) {
          throw new \RuntimeException(
            'No batch found. Set Graduation Batch in settings or provide batch_id.'
          );
        }

        if ($batch->is_archived) {
          throw new \RuntimeException('This batch is already archived.');
        }

        $batchName = $batch->name;
        $batch->update(['is_archived' => true]);

        $sectionIds = $batch->sections()->pluck('id');

        User::query()
          ->with('studentRecord:id,batch_id,section_id')
          ->where('role', User::ROLE_STUDENT)
          ->where(function ($query) use ($batch, $sectionIds) {
            $query->where('batch_id', $batch->id)
              ->orWhereHas('studentRecord', fn ($student) => $student->where('batch_id', $batch->id));

            if ($sectionIds->isNotEmpty()) {
              $query->orWhereIn('section_id', $sectionIds)
                ->orWhereHas('studentRecord', fn ($student) => $student->whereIn('section_id', $sectionIds));
            }
          })
          ->chunkById(100, function ($users) use ($batch) {
            foreach ($users as $user) {
              $user->forceFill([
                'role'       => User::ROLE_ALUMNI,
                'batch_id'   => $user->batch_id ?: ($user->studentRecord?->batch_id ?: $batch->id),
                'section_id' => $user->section_id ?: $user->studentRecord?->section_id,
              ])->save();
            }
          });

        foreach (PlatformSettings::GRADUATION_KEYS as $key) {
          Setting::putValue($key, (string) (PlatformSettings::DEFAULTS[$key] ?? ''));
        }
      });
    } catch (\RuntimeException $exception) {
      return response()->json(['message' => $exception->getMessage()], 422);
    }

    $this->logAction(
      'batch_archive',
      "Admin archived batch \"{$batchName}\" and promoted students to alumni.",
      'Graduation settings cleared.'
    );

    return response()->json(['message' => 'Batch archived successfully.']);
  }

  private function resolveBatchForArchive(Request $request): ?Batch
  {
    if ($request->filled('batch_id')) {
      return Batch::query()->find($request->integer('batch_id'));
    }

    $identifier = trim((string) Setting::getValue(
      'graduation_batch',
      PlatformSettings::DEFAULTS['graduation_batch']
    ));

    if ($identifier === '') {
      return null;
    }

    if (ctype_digit($identifier)) {
      $byId = Batch::query()->find((int) $identifier);
      if ($byId) {
        return $byId;
      }
    }

    return Batch::query()
      ->where('name', $identifier)
      ->orWhere('graduation_year', $identifier)
      ->orWhere('course', $identifier)
      ->first();
  }

  private function normalizeValue(string $key, mixed $value): string
  {
    if (in_array($key, [
      'maintenance_mode',
      'publish_yearbook',
      'allow_student_posts',
      'allow_comments',
      'allow_reactions',
      'enable_premium_subscription',
      'premium_badge_display',
      'enable_flipbook_viewer',
      'enable_yearbook_pdf_download',
      'enable_student_directory_search',
      'auto_backup_database',
      'audit_logs_enabled',
    ], true)) {
      return ($value === '1' || $value === 1 || $value === true) ? '1' : '0';
    }

    if ($key === 'graduation_date' && $value !== null && $value !== '') {
      return date('Y-m-d', strtotime((string) $value));
    }

    return (string) $value;
  }

  private function logAction(string $action, string $details, ?string $note = null): void
  {
    if (! PlatformSettings::isAuditLoggingEnabled()) {
      return;
    }

    $admin = $this->resolveAdmin();

    AuditLog::query()->create([
      'admin_id'   => $admin?->id,
      'user_name'  => $admin?->username ?? 'admin',
      'action'     => $action,
      'details'    => $details,
      'note'       => $note,
      'ip_address' => request()->ip(),
      'status'     => 'Success',
      'logged_at'  => now(),
    ]);
  }

  private function resolveAdmin(): ?Admin
  {
    $user = auth('sanctum')->user();

    return $user instanceof Admin ? $user : null;
  }
}
