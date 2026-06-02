<?php

namespace App\Http\Controllers\API\Admin;

use App\Http\Controllers\Controller;
use App\Models\Yearbook;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ArchivesController extends Controller
{
    // GET /api/admin/archives/stats
    public function stats(): JsonResponse
    {
        return response()->json([
            'total'      => Yearbook::count(),
            'published'  => Yearbook::where('status', 'published')->count(),
            'drafts'     => Yearbook::where('status', 'draft')->count(),
            'pdfs_ready' => Yearbook::whereNotNull('pdf_path')->where('status', 'published')->count(),
        ]);
    }

    // GET /api/admin/archives
    public function index(Request $request): JsonResponse
    {
        $query = Yearbook::with('batch:id,name,graduation_year')
            ->orderByDesc('created_at');

        if ($search = $request->get('search')) {
            $query->where(fn ($q) =>
                $q->where('title',         'like', "%{$search}%")
                  ->orWhere('academic_year','like', "%{$search}%")
                  ->orWhere('description',  'like', "%{$search}%")
                  ->orWhereHas('batch', fn ($b) => $b->where('name', 'like', "%{$search}%"))
            );
        }

        if ($status = $request->get('status')) {
            $query->where('status', $status);
        }

        return response()->json(
            $query->paginate($request->get('per_page', 12))
        );
    }

    // POST /api/admin/archives/{yearbook}/publish
    public function publish(Yearbook $yearbook): JsonResponse
    {
        $yearbook->update(['status' => 'published', 'is_active' => true]);
        return response()->json(['message' => 'Yearbook published.']);
    }

    // POST /api/admin/archives/{yearbook}/unpublish
    public function unpublish(Yearbook $yearbook): JsonResponse
    {
        $yearbook->update(['status' => 'draft', 'is_active' => false]);
        return response()->json(['message' => 'Yearbook unpublished.']);
    }

    // POST /api/admin/archives/{yearbook}/generate-pdf
    public function generatePdf(Yearbook $yearbook): JsonResponse
    {
        $yearbook->update(['status' => 'generating']);

        // Dispatch your existing PDF generation job here:
        // GenerateYearbookPdfJob::dispatch($yearbook);

        return response()->json(['message' => 'PDF generation queued.']);
    }

    // DELETE /api/admin/archives/{yearbook}
    public function destroy(Yearbook $yearbook): JsonResponse
    {
        // Remove PDF from storage if it exists
        if ($yearbook->pdf_path && Storage::exists($yearbook->pdf_path)) {
            Storage::delete($yearbook->pdf_path);
        }

        $yearbook->delete();

        return response()->json(['message' => 'Yearbook deleted.']);
    }
}