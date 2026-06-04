import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { graduationApi } from '@/api/yearbook.api';
import { galleryApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import { imageUrl, avatarUrl } from '@/utils/imageUrl';

const TABS = [
  { key: 'photos',     label: 'Photos',        icon: 'fa-images' },
  { key: 'videos',     label: 'Videos',        icon: 'fa-film' },
  { key: 'program',    label: 'Program',       icon: 'fa-file-pdf' },
  { key: 'archive',    label: 'Archive',       icon: 'fa-box-archive' },
  { key: 'toga',       label: 'Toga Gallery',  icon: 'fa-user-graduate' },
  { key: 'invitation', label: 'Invitation',    icon: 'fa-envelope-open-text' },
  { key: 'song',       label: 'Grad Song',     icon: 'fa-music' },
  { key: 'mass',       label: 'Baccalaureate', icon: 'fa-church' },
];

const VALID_TABS = TABS.map(t => t.key);

// ─── Album Card ───────────────────────────────────────────────────────────────
function AlbumCard({ album }) {
  const cover = album.photos?.[0]?.file_path;
  return (
    <Link to={`/graduation/archive/${album.id}`} className="no-underline block">
      <div className="rounded-3xl overflow-hidden bg-white transition-all duration-300"
        style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(29,43,75,0.13)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,43,75,0.07)'; }}>
        <div className="relative overflow-hidden" style={{ height: '220px', background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)' }}>
          {cover
            ? <img src={cover} alt={album.title} className="w-full h-full object-cover opacity-90" />
            : <div className="w-full h-full flex items-center justify-center">
                <i className="fas fa-images text-5xl" style={{ color: 'rgba(253,184,19,0.4)' }} />
              </div>
          }
          <div className="absolute bottom-3 right-3 text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(253,184,19,0.95)', color: '#1d2b4b' }}>
            {album.photos_count ?? 0} photos
          </div>
        </div>
        <div style={{ padding: '20px 22px' }}>
          <h3 className="font-extrabold text-base mb-1 truncate" style={{ color: '#1d2b4b' }}>{album.title}</h3>
          {album.event_date && (
            <p className="text-xs flex items-center gap-1.5 m-0" style={{ color: '#94a3b8' }}>
              <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
              {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────
function VideoCard({ album, badge }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="rounded-3xl overflow-hidden bg-white"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div style={{ background: '#0a0f1e' }}>
        {playing
          ? <video src={album.media_url} controls autoPlay className="w-full" style={{ maxHeight: '280px' }} />
          : <div className="flex items-center justify-center cursor-pointer relative"
              style={{ height: '220px', background: 'linear-gradient(135deg,#0d1b35,#1d2b4b)' }}
              onClick={() => setPlaying(true)}>
              {badge && (
                <span className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(253,184,19,0.95)', color: '#1d2b4b' }}>{badge}</span>
              )}
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#fdb813' }}>
                <i className="fas fa-play text-xl" style={{ color: '#1d2b4b', marginLeft: '3px' }} />
              </div>
            </div>
        }
      </div>
      <div style={{ padding: '20px 22px' }}>
        <h3 className="font-extrabold text-base mb-1" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        {album.description && <p className="text-xs mb-2 line-clamp-2 m-0" style={{ color: '#64748b' }}>{album.description}</p>}
        {album.event_date && (
          <p className="text-xs flex items-center gap-1.5 m-0" style={{ color: '#94a3b8' }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <Link to="/graduation/speeches"
          className="inline-flex items-center gap-2 text-xs font-bold no-underline mt-3 px-3 py-1.5 rounded-xl"
          style={{ background: 'rgba(63,81,181,0.08)', color: '#3f51b5' }}>
          <i className="fas fa-file-lines" /> View Transcript
        </Link>
      </div>
    </div>
  );
}

// ─── Program Card ─────────────────────────────────────────────────────────────
function ProgramCard({ album }) {
  return (
    <div className="rounded-3xl bg-white p-6 flex gap-5 items-start"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(253,184,19,0.12)' }}>
        <i className="fas fa-file-pdf text-2xl" style={{ color: '#fdb813' }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-extrabold text-base mb-1" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        {album.description && <p className="text-sm mb-3" style={{ color: '#64748b' }}>{album.description}</p>}
        {album.event_date && (
          <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <div className="flex gap-3 flex-wrap">
          <a href={album.media_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-white no-underline px-4 py-2 rounded-xl"
            style={{ background: '#1d2b4b' }}>
            <i className="fas fa-eye" /> View Program
          </a>
          <a href={album.media_url} download
            className="inline-flex items-center gap-2 text-sm font-bold no-underline px-4 py-2 rounded-xl"
            style={{ background: 'rgba(253,184,19,0.15)', color: '#1d2b4b' }}>
            <i className="fas fa-download" /> Download
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Invitation Card ──────────────────────────────────────────────────────────
function InvitationCard({ album }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-white transition-all duration-300"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(29,43,75,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,43,75,0.07)'; }}>
      <div className="flex items-center justify-center"
        style={{ height: '240px', background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)', overflow: 'hidden' }}>
        {album.media_url?.match(/\.(jpg|jpeg|png|webp)$/i)
          ? <img src={album.media_url} alt={album.title} className="w-full h-full object-cover" />
          : <div className="flex flex-col items-center gap-3">
              <i className="fas fa-envelope-open-text text-5xl" style={{ color: 'rgba(253,184,19,0.6)' }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>Digital Invitation</span>
            </div>
        }
      </div>
      <div style={{ padding: '20px 22px' }}>
        <h3 className="font-extrabold text-base mb-1" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        {album.description && <p className="text-xs mb-3 line-clamp-2" style={{ color: '#64748b' }}>{album.description}</p>}
        {album.event_date && (
          <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        <div className="flex gap-3">
          <a href={album.media_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-white no-underline px-4 py-2 rounded-xl"
            style={{ background: '#1d2b4b' }}>
            <i className="fas fa-eye" /> View
          </a>
          <a href={album.media_url} download
            className="inline-flex items-center gap-2 text-sm font-bold no-underline px-4 py-2 rounded-xl"
            style={{ background: 'rgba(253,184,19,0.15)', color: '#1d2b4b' }}>
            <i className="fas fa-download" /> Save
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Song Card ────────────────────────────────────────────────────────────────
function SongCard({ album }) {
  const mediaRef               = useRef(null);
  const [playing,  setPlaying] = useState(false);
  const [current,  setCurrent] = useState(0);
  const [duration, setDur]     = useState(0);
  const isVideo = /\.(mp4|mov|webm|mkv)$/i.test(album.media_url ?? '');
  const fmt     = s => !s || isNaN(s) ? '0:00' : `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`;
  const toggle  = () => {
    if (!mediaRef.current) return;
    playing ? mediaRef.current.pause() : mediaRef.current.play();
    setPlaying(!playing);
  };
  return (
    <div className="rounded-3xl bg-white overflow-hidden"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      {isVideo ? (
        <div style={{ background: '#0a0f1e', position: 'relative' }}>
          <video ref={mediaRef} src={album.media_url}
            style={{ width: '100%', maxHeight: 220, display: 'block', background: '#000' }}
            onTimeUpdate={() => setCurrent(mediaRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setDur(mediaRef.current?.duration ?? 0)}
            onEnded={() => setPlaying(false)} />
          {!playing && (
            <div onClick={toggle}
              style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(0,0,0,0.35)' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#fdb813', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-play" style={{ color: '#1d2b4b', fontSize: 18, marginLeft: 3 }} />
              </div>
            </div>
          )}
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(29,43,75,0.8)', color: '#fdb813', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 8 }}>
            <i className="fas fa-film" style={{ marginRight: 4 }} />VIDEO
          </span>
        </div>
      ) : (
        <div className="relative flex items-center justify-center"
          style={{ height: '140px', background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)', overflow: 'hidden' }}>
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute" style={{ width: '3px', borderRadius: '3px', height: `${20 + Math.sin(i * 0.8) * 36}px`, background: playing ? '#fdb813' : 'rgba(253,184,19,0.25)', left: `${4 + i * 4.8}%`, transition: 'background 0.3s' }} />
          ))}
          <button onClick={toggle}
            className="relative z-10 flex items-center justify-center rounded-full border-none cursor-pointer"
            style={{ width: '56px', height: '56px', background: '#fdb813' }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
            <i className={`fas ${playing ? 'fa-pause' : 'fa-play'} text-lg`} style={{ color: '#1d2b4b', marginLeft: playing ? 0 : '3px' }} />
          </button>
          <span style={{ position: 'absolute', top: 10, left: 10, background: 'rgba(253,184,19,0.2)', color: '#fdb813', fontSize: 10, fontWeight: 800, padding: '3px 9px', borderRadius: 8 }}>
            <i className="fas fa-music" style={{ marginRight: 4 }} />AUDIO
          </span>
          <audio ref={mediaRef} src={album.media_url}
            onTimeUpdate={() => setCurrent(mediaRef.current?.currentTime ?? 0)}
            onLoadedMetadata={() => setDur(mediaRef.current?.duration ?? 0)}
            onEnded={() => setPlaying(false)} />
        </div>
      )}
      <div style={{ padding: '18px 20px' }}>
        <h3 className="font-extrabold text-base mb-2" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        <div className="rounded-full cursor-pointer mb-1.5" style={{ height: '6px', background: '#e2e8f0' }}
          onClick={e => {
            const r = e.currentTarget.getBoundingClientRect();
            if (mediaRef.current) mediaRef.current.currentTime = ((e.clientX - r.left) / r.width) * duration;
          }}>
          <div style={{ width: `${duration ? (current / duration) * 100 : 0}%`, height: '6px', background: '#fdb813', borderRadius: '9999px', transition: 'width 0.1s' }} />
        </div>
        <div className="flex justify-between text-xs" style={{ color: '#94a3b8' }}>
          <span>{fmt(current)}</span><span>{fmt(duration)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ tab }) {
  const cfg = {
    photos:     { icon: 'fa-images',             text: 'No graduation photos yet.' },
    videos:     { icon: 'fa-film',               text: 'No graduation videos yet.' },
    program:    { icon: 'fa-file-pdf',           text: 'No graduation program uploaded yet.' },
    archive:    { icon: 'fa-box-archive',        text: 'No archived records yet.' },
    toga:       { icon: 'fa-user-graduate',      text: 'No toga gallery photos yet.' },
    invitation: { icon: 'fa-envelope-open-text', text: 'No invitations uploaded yet.' },
    song:       { icon: 'fa-music',              text: 'No graduation songs uploaded yet.' },
    mass:       { icon: 'fa-church',             text: 'No Baccalaureate Mass videos yet.' },
  }[tab] ?? { icon: 'fa-graduation-cap', text: 'Nothing here yet.' };

  return (
    <div className="text-center py-24 bg-white rounded-3xl"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.05)' }}>
      <i className={`fas ${cfg.icon} text-6xl mb-5 block`} style={{ color: '#e2e8f0' }} />
      <h3 className="font-extrabold text-lg mb-2" style={{ color: '#1d2b4b' }}>Nothing Here Yet</h3>
      <p className="text-sm" style={{ color: '#94a3b8' }}>{cfg.text}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GraduationPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam     = searchParams.get('tab');
  const activeTab    = VALID_TABS.includes(tabParam) ? tabParam : 'photos';
  const setActiveTab = (key) => setSearchParams({ tab: key }, { replace: true });

  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [searching, setSearching] = useState(false);
  const [matches,   setMatches]   = useState([]);

  const loadData = (tab = activeTab) => {
    setLoading(true);
    graduationApi.list(tab)
      .then(({ data: res }) => setData(res.data ?? res ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData(activeTab);
    setMatches([]);
  }, [activeTab]);

  const handleFaceFile = async (file) => {
    setSearching(true);
    setMatches([]);
    try {
      const fd = new FormData();
      fd.append('face_image', file);
      const { data } = await galleryApi.faceSearch(fd);
      const found = data.photos ?? [];
      setMatches(found);
      if (!found.length) alert('No matching photos found.');
    } catch {
      alert('Face search failed.');
    } finally {
      setSearching(false);
    }
  };

  const primaryTabs   = TABS.slice(0, 4);
  const secondaryTabs = TABS.slice(4);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* Hero */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg,#1d2b4b 0%,#2a3d66 100%)', padding: '80px 8% 130px', borderRadius: '0 0 60px 60px' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">Class Milestones</p>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Graduation <span style={{ color: '#fdb813' }}>Hub</span>
        </h1>
        <p className="font-light mx-auto opacity-80 mb-6" style={{ fontSize: '1rem', maxWidth: '540px' }}>
          Photos, videos, programs, ceremonies, and memories — all in one place.
        </p>

        {/* Face search bar */}
        <div className="max-w-[600px] mx-auto mb-6">
          <div className="relative">
            <i className="fas fa-search absolute left-[18px] top-1/2 -translate-y-1/2 text-[#fdb813] text-[15px] z-[1] pointer-events-none" />
            <input
              type="text" readOnly
              onClick={() => document.querySelector('#grad-face-search-hidden')?.click()}
              placeholder={searching ? 'Searching…' : 'Click the camera icon to search by face…'}
              className="w-full h-[52px] pl-[50px] pr-14 border border-white/15 rounded-[14px] outline-none
                         bg-white/10 backdrop-blur-xl text-white text-sm font-medium cursor-pointer
                         focus:bg-white/[0.18] focus:border-[#fdb813]/60 transition-all placeholder-white/50 box-border"
            />
            <FaceSearchButton onFile={handleFaceFile} loading={searching} />
          </div>
          {matches.length > 0 && (
            <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2.5 text-left">
              {matches.map(m => (
                <Link key={m.user_id} to={`/profile/${m.user_id}`}
                  className="flex items-center gap-3 bg-white/[0.12] backdrop-blur-md border border-white/20
                             rounded-[14px] p-3 no-underline hover:border-[#fdb813] transition-colors">
                  <img src={imageUrl(m.profile_picture) || avatarUrl(m.name)} alt={m.name}
                    className="w-11 h-11 rounded-xl object-cover border-2 border-[#fdb813] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="m-0 font-bold text-[13px] text-white truncate">{m.name}</p>
                    <p className="m-0 text-[11px] text-white/60">
                      <i className="fas fa-brain text-[#fdb813] mr-1" />{m.similarity}% match
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link to="/graduation/speeches"
          className="inline-flex items-center gap-2 text-sm font-bold no-underline px-5 py-2.5 rounded-2xl transition-all"
          style={{ background: 'rgba(253,184,19,0.15)', color: '#fdb813', border: '1px solid rgba(253,184,19,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(253,184,19,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(253,184,19,0.15)'}>
          <i className="fas fa-microphone-lines" /> Guest Speeches &amp; Transcripts
        </Link>
      </header>

      {/* Tabs */}
      <div className="mx-auto px-5" style={{ maxWidth: '1000px', width: '100%', marginTop: '-55px' }}>
        <div className="bg-white flex gap-2 p-2 rounded-2xl mb-2"
          style={{ boxShadow: '0 18px 36px rgba(29,43,75,0.1)' }}>
          {primaryTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 font-bold text-sm border-none cursor-pointer transition-all rounded-xl py-3"
              style={{ background: activeTab === tab.key ? '#1d2b4b' : 'transparent', color: activeTab === tab.key ? 'white' : '#94a3b8' }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.key ? '#fdb813' : 'inherit', fontSize: '13px' }} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <div className="bg-white flex gap-2 p-2 rounded-2xl"
          style={{ boxShadow: '0 8px 24px rgba(29,43,75,0.07)' }}>
          {secondaryTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 font-bold text-sm border-none cursor-pointer transition-all rounded-xl py-2.5"
              style={{ background: activeTab === tab.key ? '#1d2b4b' : 'transparent', color: activeTab === tab.key ? 'white' : '#94a3b8' }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.key ? '#fdb813' : 'inherit', fontSize: '13px' }} />
              <span className="hidden sm:inline text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 20px 100px', width: '100%' }}>
        <h2 className="font-extrabold text-lg mb-6" style={{ color: '#1d2b4b' }}>
          {TABS.find(t => t.key === activeTab)?.label}
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <i className="fas fa-spinner fa-spin text-3xl" style={{ color: '#3f51b5' }} />
          </div>
        ) : data.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <>
            {['photos', 'archive', 'toga'].includes(activeTab) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '24px' }}>
                {data.map(a => <AlbumCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'videos' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '24px' }}>
                {data.map(a => <VideoCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'program' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.map(a => <ProgramCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'invitation' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '24px' }}>
                {data.map(a => <InvitationCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'song' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '24px' }}>
                {data.map(a => <SongCard key={a.id} album={a} />)}
              </div>
            )}
            {activeTab === 'mass' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '24px' }}>
                {data.map(a => <VideoCard key={a.id} album={a} badge="Baccalaureate Mass" />)}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}