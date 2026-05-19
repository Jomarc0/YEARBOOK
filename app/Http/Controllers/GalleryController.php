<?php

namespace App\Http\Controllers;

use App\Contracts\FaceRecognition;
use App\Models\Album;
use App\Models\Setting;
use Illuminate\View\View;

class GalleryController extends Controller
{
    public function __construct(
        private readonly FaceRecognition $faceRecognition,
    ) {
    }

    public function index(): View
    {
        // Kunin ang bilang ng items per page mula sa system settings. Default sa 12 kung walang setting.
        $perPage = (int) Setting::getValue('gallery_items_per_page', '12');
        
        // Kunin ang lahat ng albums, kasama ang bilang ng photos sa bawat isa.
        // Naka-ayos ito mula sa pinakabagong event date at naka-paginate.
        $albums = Album::withCount('photos')->latest('event_date')->paginate(max(1, $perPage));

        // Ibalik ang view 'web.gallery' at ipasa ang albums.
        // Ang view file ay dapat nasa 'resources/views/web/gallery.blade.php'.
        return view('web.gallery', [
            'albums' => $albums,
            'faceSearchResults' => session('faceSearchResults'),
            'studentPhotos' => session('studentPhotos'),
            'faceRecognitionEnabled' => $this->faceRecognition->isEnabled() && Setting::getValue('face_recognition_enabled', '1') === '1',
        ]);
    }

    /**
     * Display a specific album and its photos.
     *
     * @param int $id The ID of the album to display.
     * @return View The 'web.gallery-show' view with the album and its photos.
     */
    public function show(int $id): View
    {
        // Hanapin ang album gamit ang ID, kasama ang lahat ng photos nito.
        // 'findOrFail' - Kung hindi makita ang album, awtomatikong mag-throw ng 404 error.
        $album = Album::with('photos')->findOrFail($id);

        // Ibalik ang view 'web.gallery-show' at ipasa ang album data.
        // Ang view file ay dapat nasa 'resources/views/web/gallery-show.blade.php'.
        return view('web.gallery-show', compact('album'));
    }
}
