import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { graduationApi } from '@/api/yearbook.api';

// ─────────────────────────────────────────────────────────────────────────────
// TAB CONFIG — all 8 tabs from spec
// ─────────────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'photos',      label: 'Photos',       icon: 'fa-images' },
  { key: 'videos',      label: 'Videos',       icon: 'fa-film' },
  { key: 'program',     label: 'Program',      icon: 'fa-file-pdf' },
  { key: 'archive',     label: 'Archive',      icon: 'fa-box-archive' },
  { key: 'toga',        label: 'Toga Gallery', icon: 'fa-user-graduate' },
  { key: 'invitation',  label: 'Invitation',   icon: 'fa-envelope-open-text' },
  { key: 'song',        label: 'Grad Song',    icon: 'fa-music' },
  { key: 'mass',        label: 'Baccalaureate',icon: 'fa-church' },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO / ARCHIVE ALBUM CARD
// ─────────────────────────────────────────────────────────────────────────────
function AlbumCard({ album }) {
  const cover = album.photos?.[0]?.file_path;
  return (
    <Link to={`/graduation/archive/${album.id}`} className="no-underline block">
      <div
        className="rounded-3xl overflow-hidden bg-white transition-all duration-300"
        style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(29,43,75,0.13)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,43,75,0.07)'; }}
      >
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
            <p className="text-xs flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
              <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
              {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIDEO CARD (ceremony / baccalaureate)
// ─────────────────────────────────────────────────────────────────────────────
function VideoCard({ album, badge }) {
  const [playing, setPlaying] = useState(false);
  return (
    <div className="rounded-3xl overflow-hidden bg-white"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      <div className="relative" style={{ background: '#0a0f1e' }}>
        {playing
          ? <video src={album.media_url} controls autoPlay className="w-full" style={{ maxHeight: '280px' }} />
          : <div className="flex items-center justify-center cursor-pointer relative"
              style={{ height: '220px', background: 'linear-gradient(135deg,#0d1b35,#1d2b4b)' }}
              onClick={() => setPlaying(true)}>
              {badge && (
                <div className="absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ background: 'rgba(253,184,19,0.95)', color: '#1d2b4b' }}>
                  {badge}
                </div>
              )}
              <div className="w-16 h-16 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ background: '#fdb813' }}>
                <i className="fas fa-play text-xl" style={{ color: '#1d2b4b', marginLeft: '3px' }} />
              </div>
            </div>
        }
      </div>
      <div style={{ padding: '20px 22px' }}>
        <h3 className="font-extrabold text-base mb-1" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        {album.description && <p className="text-xs mb-2 line-clamp-2" style={{ color: '#64748b' }}>{album.description}</p>}
        {album.event_date && (
          <p className="text-xs flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        {/* Link to speech transcript if available */}
        <Link to={`/graduation/speeches?video=${album.id}`}
          className="inline-flex items-center gap-2 text-xs font-bold no-underline mt-3 px-3 py-1.5 rounded-xl transition-all"
          style={{ background: 'rgba(63,81,181,0.08)', color: '#3f51b5' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(63,81,181,0.16)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(63,81,181,0.08)'}>
          <i className="fas fa-file-lines" /> View Transcript
        </Link>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROGRAM CARD
// ─────────────────────────────────────────────────────────────────────────────
function ProgramCard({ album }) {
  return (
    <div className="rounded-3xl bg-white p-6 flex gap-5 items-start transition-all"
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
            className="inline-flex items-center gap-2 text-sm font-bold text-white no-underline px-4 py-2 rounded-xl transition-all"
            style={{ background: '#1d2b4b' }}
            onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
            onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}>
            <i className="fas fa-eye" /> View Program
          </a>
          <a href={album.media_url} download
            className="inline-flex items-center gap-2 text-sm font-bold no-underline px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(253,184,19,0.15)', color: '#1d2b4b' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(253,184,19,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(253,184,19,0.15)'}>
            <i className="fas fa-download" /> Download
          </a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVITATION CARD
// ─────────────────────────────────────────────────────────────────────────────
function InvitationCard({ album }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-white transition-all duration-300"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(29,43,75,0.12)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,43,75,0.07)'; }}>
      {/* Preview image or decorative placeholder */}
      <div className="relative overflow-hidden flex items-center justify-center"
        style={{ height: '260px', background: 'linear-gradient(135deg,#1d2b4b 0%,#2a3d66 60%,#fdb813 200%)' }}>
        {album.media_url && album.media_url.match(/\.(jpg|jpeg|png|webp)$/i)
          ? <img src={album.media_url} alt={album.title} className="w-full h-full object-cover" />
          : <>
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-3">
                <i className="fas fa-envelope-open-text text-5xl" style={{ color: 'rgba(253,184,19,0.6)' }} />
                <span className="text-white/40 text-xs font-bold uppercase tracking-widest">Digital Invitation</span>
              </div>
            </>
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
        <div className="flex gap-3 flex-wrap">
          <a href={album.media_url} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm font-bold text-white no-underline px-4 py-2 rounded-xl transition-all"
            style={{ background: '#1d2b4b' }}
            onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
            onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}>
            <i className="fas fa-eye" /> View Invitation
          </a>
          <a href={album.media_url} download
            className="inline-flex items-center gap-2 text-sm font-bold no-underline px-4 py-2 rounded-xl transition-all"
            style={{ background: 'rgba(253,184,19,0.15)', color: '#1d2b4b' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(253,184,19,0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(253,184,19,0.15)'}>
            <i className="fas fa-download" /> Save
          </a>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GRADUATION SONG CARD — audio player
// ─────────────────────────────────────────────────────────────────────────────
function SongCard({ album }) {
  const audioRef = useRef(null);
  const [playing, setPlaying]   = useState(false);
  const [current, setCurrent]   = useState(0);
  const [duration, setDuration] = useState(0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  const fmt = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="rounded-3xl bg-white overflow-hidden"
      style={{ boxShadow: '0 4px 20px rgba(29,43,75,0.07)', border: '1px solid rgba(0,0,0,0.04)' }}>
      {/* Waveform banner */}
      <div className="relative flex items-center justify-center px-8"
        style={{ height: '140px', background: 'linear-gradient(135deg,#1d2b4b,#2a3d66)', overflow: 'hidden' }}>
        {/* Decorative sound waves */}
        {[...Array(20)].map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: '3px',
              height: `${20 + Math.sin(i * 0.8) * 40 + (playing ? Math.random() * 20 : 0)}px`,
              background: playing ? '#fdb813' : 'rgba(253,184,19,0.3)',
              left: `${4 + i * 4.8}%`,
              transition: 'height 0.3s ease, background 0.3s ease',
              borderRadius: '3px',
            }}
          />
        ))}
        <button onClick={toggle}
          className="relative z-10 flex items-center justify-center rounded-full border-none cursor-pointer transition-all"
          style={{ width: '60px', height: '60px', background: '#fdb813', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
          <i className={`fas ${playing ? 'fa-pause' : 'fa-play'} text-lg`} style={{ color: '#1d2b4b', marginLeft: playing ? 0 : '3px' }} />
        </button>
      </div>

      <div style={{ padding: '20px 22px' }}>
        <h3 className="font-extrabold text-base mb-1" style={{ color: '#1d2b4b' }}>{album.title}</h3>
        {album.description && <p className="text-xs mb-3" style={{ color: '#64748b' }}>{album.description}</p>}

        {/* Progress bar */}
        <div className="relative rounded-full cursor-pointer mb-2" style={{ height: '6px', background: '#e2e8f0' }}
          onClick={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = (e.clientX - rect.left) / rect.width;
            if (audioRef.current) { audioRef.current.currentTime = ratio * duration; }
          }}>
          <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#fdb813' }} />
        </div>
        <div className="flex justify-between text-xs" style={{ color: '#94a3b8' }}>
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>

        {album.event_date && (
          <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#94a3b8' }}>
            <i className="fas fa-calendar" style={{ color: '#fdb813' }} />
            {new Date(album.event_date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>

      <audio ref={audioRef} src={album.media_url}
        onTimeUpdate={() => setCurrent(audioRef.current?.currentTime ?? 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={() => setPlaying(false)} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BACCALAUREATE MASS CARD — video + details
// ─────────────────────────────────────────────────────────────────────────────
function MassCard({ album }) {
  return <VideoCard album={album} badge="Baccalaureate Mass" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ tab }) {
  const cfg = {
    photos:     { icon: 'fa-images',              text: 'No graduation photos yet.' },
    videos:     { icon: 'fa-film',                text: 'No graduation videos yet.' },
    program:    { icon: 'fa-file-pdf',            text: 'No graduation program uploaded yet.' },
    archive:    { icon: 'fa-box-archive',         text: 'No archived records yet.' },
    toga:       { icon: 'fa-user-graduate',       text: 'No toga gallery photos yet.' },
    invitation: { icon: 'fa-envelope-open-text',  text: 'No invitations uploaded yet.' },
    song:       { icon: 'fa-music',               text: 'No graduation songs uploaded yet.' },
    mass:       { icon: 'fa-church',              text: 'No Baccalaureate Mass videos yet.' },
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

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function GraduationPage() {
  const [activeTab, setActiveTab] = useState('photos');
  const [data,      setData]      = useState([]);
  const [loading,   setLoading]   = useState(true);

  // Map frontend tab keys → backend category values
  const categoryMap = {
    photos:     'photos',
    videos:     'videos',
    program:    'program',
    archive:    'archive',
    toga:       'toga',
    invitation: 'invitation',
    song:       'song',
    mass:       'mass',
  };

  useEffect(() => {
    setLoading(true);
    graduationApi.list(categoryMap[activeTab] ?? activeTab)
      .then(({ data }) => setData(data.data ?? data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [activeTab]);

  // Split tabs: primary row (4) + secondary row (4)
  const primaryTabs   = TABS.slice(0, 4);
  const secondaryTabs = TABS.slice(4);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <header className="text-white text-center"
        style={{ background: 'linear-gradient(135deg, #1d2b4b 0%, #2a3d66 100%)', padding: '80px 8% 150px', borderRadius: '0 0 60px 60px' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-3 opacity-60">Class Milestones</p>
        <h1 className="font-extrabold mb-4" style={{ fontSize: '3rem', letterSpacing: '-2px' }}>
          Graduation <span style={{ color: '#fdb813' }}>Hub</span>
        </h1>
        <p className="font-light mx-auto opacity-80" style={{ fontSize: '1rem', maxWidth: '540px' }}>
          Photos, videos, programs, ceremonies, and memories from your graduation — all in one place.
        </p>

        {/* Quick link to Speeches */}
        <Link to="/graduation/speeches"
          className="inline-flex items-center gap-2 mt-6 text-sm font-bold no-underline px-5 py-2.5 rounded-2xl transition-all"
          style={{ background: 'rgba(253,184,19,0.15)', color: '#fdb813', border: '1px solid rgba(253,184,19,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(253,184,19,0.25)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(253,184,19,0.15)'}>
          <i className="fas fa-microphone-lines" /> Guest Speeches & Transcripts
        </Link>
      </header>

      {/* ── Tabs ─────────────────────────────────────────────────────────── */}
      <div className="mx-auto px-5" style={{ maxWidth: '1000px', width: '100%', marginTop: '-55px' }}>
        {/* Primary row */}
        <div className="bg-white flex gap-2 p-2 rounded-2xl mb-2"
          style={{ boxShadow: '0 18px 36px rgba(29,43,75,0.1)' }}>
          {primaryTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 font-bold text-sm border-none cursor-pointer transition-all rounded-xl py-3"
              style={{
                background: activeTab === tab.key ? '#1d2b4b' : 'transparent',
                color:      activeTab === tab.key ? 'white'   : '#94a3b8',
              }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.key ? '#fdb813' : 'inherit', fontSize: '13px' }} />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        {/* Secondary row */}
        <div className="bg-white flex gap-2 p-2 rounded-2xl"
          style={{ boxShadow: '0 8px 24px rgba(29,43,75,0.07)' }}>
          {secondaryTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 font-bold text-sm border-none cursor-pointer transition-all rounded-xl py-2.5"
              style={{
                background: activeTab === tab.key ? '#1d2b4b' : 'transparent',
                color:      activeTab === tab.key ? 'white'   : '#94a3b8',
              }}>
              <i className={`fas ${tab.icon}`} style={{ color: activeTab === tab.key ? '#fdb813' : 'inherit', fontSize: '13px' }} />
              <span className="hidden sm:inline text-xs">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 20px 100px', width: '100%' }}>
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <i className="fas fa-spinner fa-spin text-3xl" style={{ color: '#3f51b5' }} />
          </div>
        ) : data.length === 0 ? (
          <EmptyState tab={activeTab} />
        ) : (
          <>
            {/* Photos, Archive, Toga → album grid */}
            {['photos', 'archive', 'toga'].includes(activeTab) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {data.map(album => <AlbumCard key={album.id} album={album} />)}
              </div>
            )}

            {/* Videos → video grid */}
            {activeTab === 'videos' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {data.map(album => <VideoCard key={album.id} album={album} />)}
              </div>
            )}

            {/* Program → list */}
            {activeTab === 'program' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {data.map(album => <ProgramCard key={album.id} album={album} />)}
              </div>
            )}

            {/* Invitation → 3-col grid */}
            {activeTab === 'invitation' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
                {data.map(album => <InvitationCard key={album.id} album={album} />)}
              </div>
            )}

            {/* Graduation Song → audio grid */}
            {activeTab === 'song' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {data.map(album => <SongCard key={album.id} album={album} />)}
              </div>
            )}

            {/* Baccalaureate Mass → video grid */}
            {activeTab === 'mass' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {data.map(album => <MassCard key={album.id} album={album} />)}
              </div>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}