<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consent;
use Illuminate\Http\Request;

class ConsentController extends Controller
{
    public function accept(Request $request)
    {
        $request->validate(['version' => 'required|string']);

        Consent::updateOrCreate(
            ['user_id' => $request->user()->id, 'type' => 'privacy_policy'],
            [
                'version'    => $request->version,
                'accepted'   => true,
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'accepted_at'=> now(),
            ]
        );

        $request->user()->update(['consent_accepted' => true]);

        return response()->json(['message' => 'Consent recorded.']);
    }

    public function status(Request $request)
    {
        $consent = Consent::where('user_id', $request->user()->id)
            ->where('type', 'privacy_policy')
            ->latest()
            ->first();

        return response()->json([
            'accepted' => $consent?->accepted ?? false,
            'version'  => $consent?->version,
            'date'     => $consent?->accepted_at,
        ]);
    }
}