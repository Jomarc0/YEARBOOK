import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { galleryApi } from '../services/api';

export default function GalleryShowPage() {
  const { id }                  = useParams();
  const [album,    setAlbum]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    galleryApi.show(id)
      .then(({ data }) => setAlbum(data))
      .catch(()        => setAlbum(null))
      .finally(()      => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <i className="fas fa-spinner fa-spin text-3xl text-[#3f51b5]" />
    </div>
  );

  if (!album) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-black text-[#1d2b4b]">Album not found.</h2>
      <Link to="/gallery" className="text-[#3f51b5] font-semibold no-underline hover:underline">
        ← Back to Gallery
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <style>{`@keyframes fadeIn { from{opacity:0} to{opacity:1} }`}</style>

      <Navbar />

      {/* HEADER */}
      <header className="bg-gradient-to-br from-[#1d2b4b] to-[#2a3d66] px-[8%] py-20 text-white rounded-b-[60px]">
        <Link
          to="/gallery"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm no-underline mb-6 transition"
        >
          <i className="fas fa-arrow-left" /> Back to Gallery
        </Link>

        <h1 className="text-4xl font-black tracking-tight mb-4">{album.title}</h1>

        <div className="flex items-center gap-6 text-white/70 text-sm">
          {album.event_date && (
            <span className="flex items-center gap-2">
              <i className="fas fa-calendar text-[#fdb813]" />
              {new Date(album.event_date).toLocaleDateString('en-PH', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            </span>
          )}
          <span className="flex items-center gap-2">
            <i className="fas fa-images text-[#fdb813]" />
            {album.photos?.length || 0} photos
          </span>
        </div>

        {album.description && (
          <p className="text-white/70 mt-4 max-w-xl leading-relaxed text-sm">
            {album.description}
          </p>
        )}
      </header>

      {/* PHOTOS MASONRY */}
      <main className="px-[8%] py-16 flex-1">
        {album.photos?.length > 0 ? (
          <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-5">
            {album.photos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setLightbox(photo)}
                className="mb-5 break-inside-avoid rounded-2xl overflow-hidden cursor-zoom-in shadow-sm hover:shadow-xl hover:scale-[1.02] transition-all duration-400 group"
              >
                <img
                  src={`http://127.0.0.1:8000/storage/${photo.file_path}`}
                  alt={photo.caption || 'Photo'}
                  className="w-full block"
                />
                {photo.caption && (
                  <div className="bg-white px-4 py-3 text-xs text-slate-500 font-medium">
                    {photo.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-400">
            <i className="fas fa-images text-6xl mb-5 block opacity-10" />
            <h3 className="text-xl font-black text-[#1d2b4b] mb-2">No Photos Yet</h3>
            <p className="text-sm">This album is empty.</p>
          </div>
        )}
      </main>

      {/* LIGHTBOX */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/92 z-[9999] flex items-center justify-center cursor-zoom-out"
          style={{ animation: 'fadeIn 0.3s ease' }}
        >
          <img
            src={`http://127.0.0.1:8000/storage/${lightbox.file_path}`}
            alt={lightbox.caption}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {lightbox.caption && (
            <p className="absolute bottom-8 text-white font-semibold text-sm">
              {lightbox.caption}
            </p>
          )}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 bg-white/15 hover:bg-white/25 text-white border-none w-11 h-11 rounded-full text-lg cursor-pointer flex items-center justify-center transition"
          >
            <i className="fas fa-times" />
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}