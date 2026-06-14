import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAlumniList, useYearbookDeepLink } from '../hooks/useAlumniTracker';
import { faceApi } from '@/api/gallery.api';
import FaceSearchButton from '@/components/ui/FaceSearchButton';
import { imageUrl, avatarUrl } from '@/utils/imageUrl';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const GOLD = '#fdb813';
const NAVY = '#1d2b4b';

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function alumniMatchIds(alumni) {
  return [
    alumni?.id,
    alumni?.user_id,
    alumni?.account_user_id,
    alumni?.student_id,
    alumni?.student?.id,
    alumni?.student?.user_id,
  ].map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
}

function faceMatchIds(match) {
  return [
    match?.account_user_id,
    match?.user_id,
    match?.student_user_id,
    match?.student_record_id,
    match?.student_id,
    match?.id,
  ].map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0);
}

function usableFaceMatches(matches = []) {
  const normalized = matches
    .map((match) => ({ ...match, match_ids: faceMatchIds(match) }))
    .filter((match) => match.match_ids.length);

  return Array.from(new Map(normalized.map((match) => [match.match_ids[0], match])).values());
}

// ─────────────────────────────────────────────────────────────────────────────
// Alumni Card
// ─────────────────────────────────────────────────────────────────────────────

function AlumniCard({ alumni }) {
  const { yearbookUrl, loading: linkLoading } = useYearbookDeepLink(alumni.id);
  const pic = imageUrl(alumni.profile_picture) || avatarUrl(alumni.name);

  return (
    <div
      style={{
        background: '#fff', borderRadius: 24, overflow: 'hidden',
        border: '1px solid #f1f5f9',
        boxShadow: '0 4px 20px rgba(29,43,75,0.06)',
        transition: 'all 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
        display: 'flex', flexDirection: 'column',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-8px)'; e.currentTarget.style.boxShadow = '0 20px 45px rgba(29,43,75,0.13)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(29,43,75,0.06)'; }}
    >
      {/* Top accent bar */}
      <div style={{ height: 6, background: `linear-gradient(90deg, ${NAVY}, ${GOLD})` }} />

      <div style={{ padding: 24, flex: 1 }}>

        {/* Avatar + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={pic}
              alt={alumni.name}
              style={{ width: 60, height: 60, borderRadius: 18, objectFit: 'cover', border: `2px solid ${GOLD}` }}
            />
            {alumni.is_verified && (
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 20, height: 20, borderRadius: '50%',
                background: '#3f51b5', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <i className="fas fa-check" style={{ color: '#fff', fontSize: 8 }} />
              </div>
            )}
          </div>
          <div style={{ minWidth: 0 }}>
            <h4 style={{
              margin: 0, fontSize: '0.95rem', fontWeight: 800, color: NAVY,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {alumni.name}
            </h4>
            <p style={{ margin: '3px 0 0', fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
              {alumni.section ?? '—'}
            </p>
          </div>
        </div>

        {/* Batch badge */}
        {alumni.batch_year && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(253,184,19,0.12)',
            border: '1px solid rgba(253,184,19,0.3)',
            borderRadius: 20, padding: '4px 11px', marginBottom: 14,
          }}>
            <i className="fas fa-graduation-cap" style={{ color: GOLD, fontSize: 10 }} />
            <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#92590e' }}>
              Batch {alumni.batch_year}
            </span>
          </div>
        )}

        {/* Career info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alumni.career?.job_title && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(29,43,75,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className="fas fa-briefcase" style={{ color: NAVY, fontSize: 11 }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: '0.72rem', fontWeight: 700, color: NAVY, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {alumni.career.job_title}
                </p>
                {alumni.career.company && (
                  <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>
                    {alumni.career.company}
                  </p>
                )}
              </div>
            </div>
          )}

          {alumni.career?.location && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'rgba(29,43,75,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <i className="fas fa-location-dot" style={{ color: NAVY, fontSize: 11 }} />
              </div>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>
                {alumni.career.location}
              </p>
            </div>
          )}

          {alumni.career?.field && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(63,81,181,0.08)',
              borderRadius: 8, padding: '4px 10px', alignSelf: 'flex-start',
            }}>
              <i className="fas fa-tag" style={{ color: '#3f51b5', fontSize: 9 }} />
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#3f51b5' }}>
                {alumni.career.field}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderTop: '1px solid #f8fafc' }}>

        {/* View Profile */}
        <Link
          to={`/students/${alumni.student_id ?? alumni.id}`}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            background: NAVY, color: '#fff',
            borderRadius: 12, padding: '9px 0',
            fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
          onMouseLeave={e => e.currentTarget.style.background = NAVY}
        >
          <i className="fas fa-user" style={{ color: GOLD, fontSize: 10 }} />
          View Profile
        </Link>

        {/* Deep-link → Yearbook */}
        {yearbookUrl ? (
          <Link
            to={yearbookUrl}
            title="View this alumni's page in the yearbook"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              background: 'rgba(253,184,19,0.12)',
              border: '1.5px solid rgba(253,184,19,0.3)',
              borderRadius: 12, padding: '9px 14px',
              fontSize: '0.72rem', fontWeight: 700,
              color: '#92590e', textDecoration: 'none',
              transition: 'all 0.2s', whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = NAVY; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,184,19,0.12)'; e.currentTarget.style.color = '#92590e'; }}
          >
            <i className="fas fa-book-open" style={{ fontSize: 10 }} />
            Yearbook
          </Link>
        ) : (
          !linkLoading && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px', fontSize: '0.65rem', color: '#cbd5e1' }}>
              <i className="fas fa-book" style={{ fontSize: 10 }} />
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Filter Bar
// ─────────────────────────────────────────────────────────────────────────────

function FilterBar({ filters, onFilter, batches = [], onFaceFile, faceSearching = false }) {
  const FIELDS = ['Engineering', 'Business', 'Education', 'Health Sciences', 'Technology', 'Arts', 'Law', 'Other'];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: '1 1 220px' }}>
        <i className="fas fa-search" style={{
          position: 'absolute', left: 14, top: '50%',
          transform: 'translateY(-50%)',
          color: '#cbd5e1', fontSize: 13, pointerEvents: 'none',
        }} />
        <input
          type="text"
          placeholder="Search alumni…"
          value={filters.q ?? ''}
          onChange={e => onFilter('q', e.target.value)}
          style={{
            width: '100%', height: 44,
            padding: '0 52px 0 42px',
            border: '1.5px solid #e2e8f0', borderRadius: 12,
            fontSize: '0.82rem', color: NAVY,
            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#3f51b5'}
          onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
        />
        <FaceSearchButton onFile={onFaceFile} loading={faceSearching} />
      </div>

      {/* Batch */}
      {batches.length > 0 && (
        <select
          value={filters.batch_id ?? ''}
          onChange={e => onFilter('batch_id', e.target.value || undefined)}
          style={{ height: 44, padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.82rem', color: NAVY, outline: 'none', fontFamily: 'inherit', background: '#fff', cursor: 'pointer' }}
        >
          <option value="">All Batches</option>
          {batches.map(b => <option key={b.id} value={b.id}>Batch {b.year}</option>)}
        </select>
      )}

      {/* Career field */}
      <select
        value={filters.field ?? ''}
        onChange={e => onFilter('field', e.target.value || undefined)}
        style={{ height: 44, padding: '0 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontSize: '0.82rem', color: NAVY, outline: 'none', fontFamily: 'inherit', background: '#fff', cursor: 'pointer' }}
      >
        <option value="">All Fields</option>
        {FIELDS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

export default function AlumniTrackerPage() {
  const [searchParams]   = useSearchParams();
  const batchFromYearbook = searchParams.get('batch_id');
  const highlightAlumniId = searchParams.get('highlight');

  const { list, loading, error, meta, filters, applyFilter, clearFilters } =
    useAlumniList({ batch_id: batchFromYearbook ?? undefined });

  const [batches, setBatches] = useState([]);
  const [faceSearching, setFaceSearching] = useState(false);
  const [faceMatches, setFaceMatches] = useState([]);
  const [matchedIds, setMatchedIds] = useState(new Set());

  const clearFace = () => {
    setFaceMatches([]);
    setMatchedIds(new Set());
  };

  const handleFilter = (key, value) => {
    clearFace();
    applyFilter(key, value);
  };

  const handleClearFilters = () => {
    clearFace();
    clearFilters();
  };

  const handleFaceFile = async (file) => {
    setFaceSearching(true);
    setFaceMatches([]);
    setMatchedIds(new Set());
    try {
      const formData = new FormData();
      formData.append('face_image', file);
      const { data } = await faceApi.search(formData);
      const matches = usableFaceMatches(data?.matches ?? data?.data?.matches ?? []);
      if (!matches.length) {
        alert('No matching alumni found. Use a clear front-facing photo.');
        return;
      }
      setFaceMatches(matches);
      setMatchedIds(new Set(matches.flatMap((match) => match.match_ids)));
    } catch (requestError) {
      alert(requestError?.response?.data?.message || 'Face search failed. Please try again.');
    } finally {
      setFaceSearching(false);
    }
  };

  const visibleAlumni = useMemo(() => {
    const query = normalizeText(filters.q);
    const field = normalizeText(filters.field);

    return list.filter((alumni) => {
      const searchable = [
        alumni?.name,
        alumni?.full_name,
        alumni?.email,
        alumni?.section,
        alumni?.course,
        alumni?.batch_year,
        alumni?.career?.job_title,
        alumni?.career?.company,
        alumni?.career?.location,
        alumni?.career?.field,
      ].map(normalizeText).join(' ');
      const textMatch = !query || searchable.includes(query);
      const fieldMatch = !field || normalizeText(alumni?.career?.field).includes(field);
      const faceMatch = matchedIds.size === 0 || alumniMatchIds(alumni).some((id) => matchedIds.has(id));
      return textMatch && fieldMatch && faceMatch;
    });
  }, [filters.field, filters.q, list, matchedIds]);

  useEffect(() => {
    import('@/api/yearbook.api').then(({ yearbookApi }) => {
      yearbookApi.batches?.()
        .then(({ data }) => setBatches(data?.data ?? []))
        .catch(() => {});
    }).catch(() => {});
  }, []);

  // Scroll to highlighted alumni
  useEffect(() => {
    if (highlightAlumniId && !loading) {
      const el = document.getElementById('highlighted-alumni');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightAlumniId, loading]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .alumni-card-anim { animation: fadeInUp 0.4s ease both; }
      `}</style>

      <Navbar />

      {/* Hero */}
      <header style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #2a3d66 100%)`,
        minHeight: 140,
        padding: '32px 8%', textAlign: 'center', color: '#fff',
        borderRadius: '0 0 28px 28px', position: 'relative', overflow: 'hidden',
      }}>
        {[180, 120].map((size, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', top: i === 0 ? -80 : -36,
            right: i === 0 ? '8%' : '20%',
            width: size, height: size, borderRadius: '50%',
            border: `1px solid rgba(253,184,19,${i === 0 ? 0.07 : 0.04})`,
            pointerEvents: 'none',
          }} />
        ))}

        <p style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(253,184,19,0.6)', marginBottom: 8 }}>
          National University Lipa
        </p>

        <div style={{ width: 42, height: 42, border: `1.5px solid ${GOLD}`, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, margin: '0 auto 10px' }}>
          <i className="fas fa-users-line" style={{ fontSize: 16 }} />
        </div>

        <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 8px' }}>
          Alumni <span style={{ color: GOLD }}>Tracker</span>
        </h1>

        <p style={{ fontSize: '0.84rem', fontWeight: 300, color: 'rgba(255,255,255,0.65)', maxWidth: 520, margin: '0 auto 14px', lineHeight: 1.55 }}>
          See where your batchmates are now — careers, locations, and their
          chapter in the <strong style={{ fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>NU Lipa Yearbook</strong>.
        </p>

        {/* Stats */}
        <div style={{
          display: 'inline-flex', gap: 20,
          background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 14, padding: '9px 18px',
        }}>
          {[
            { icon: 'fa-user-graduate', label: 'Alumni',         value: meta.total || '—' },
            { icon: 'fa-link',          label: 'Yearbook Links', value: 'Connected'       },
          ].map(({ icon, label, value }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <i className={`fas ${icon}`} style={{ color: GOLD, fontSize: 12, display: 'block', marginBottom: 3 }} />
              <div style={{ fontSize: '1rem', fontWeight: 800 }}>{value}</div>
              <div style={{ fontSize: '0.58rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Back to Yearbook deep-link */}
        {batchFromYearbook && (
          <div style={{ marginTop: 12 }}>
            <Link
              to={`/yearbook/${batchFromYearbook}/view`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'rgba(253,184,19,0.15)', border: '1.5px solid rgba(253,184,19,0.4)',
                borderRadius: 50, padding: '9px 22px',
                fontSize: '0.78rem', fontWeight: 700, color: GOLD, textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = NAVY; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(253,184,19,0.15)'; e.currentTarget.style.color = GOLD; }}
            >
              <i className="fas fa-arrow-left" />
              Back to Batch {batchFromYearbook} Yearbook
            </Link>
          </div>
        )}
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: '40px 8% 80px' }}>

        <div style={{ marginBottom: 32 }}>
          <FilterBar
            filters={filters}
            onFilter={handleFilter}
            batches={batches}
            onFaceFile={handleFaceFile}
            faceSearching={faceSearching}
          />
        </div>

        {faceMatches.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 12, flexWrap: 'wrap', marginBottom: 18,
            background: 'rgba(253,184,19,0.1)', border: '1px solid rgba(253,184,19,0.32)',
            borderRadius: 16, padding: '12px 16px', color: '#92590e',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, fontWeight: 800 }}>
              <i className="fas fa-camera" style={{ color: GOLD }} />
              {faceMatches.length} face match{faceMatches.length > 1 ? 'es' : ''} found - showing matched alumni only
            </div>
            <button
              type="button"
              onClick={clearFace}
              style={{ border: '1px solid rgba(253,184,19,0.45)', background: 'transparent', borderRadius: 9, color: '#92590e', fontSize: 12, fontWeight: 800, padding: '6px 10px', cursor: 'pointer' }}
            >
              <i className="fas fa-times" /> Clear Face
            </button>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: NAVY }}>
            {loading ? 'Loading…' : `${visibleAlumni.length} Alumni`}
          </h2>
          {(Object.values(filters).some(Boolean) || faceMatches.length > 0) && (
            <button
              onClick={handleClearFilters}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '7px 14px', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', cursor: 'pointer' }}
            >
              <i className="fas fa-times" /> Clear Filters
            </button>
          )}
        </div>

        {loading && (
          <LoadingSkeleton variant="card" count={6} />
        )}

        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 24, boxShadow: '0 2px 16px rgba(29,43,75,0.06)' }}>
            <i className="fas fa-circle-exclamation" style={{ fontSize: 40, color: '#ef4444', display: 'block', marginBottom: 12 }} />
            <p style={{ color: '#64748b', fontWeight: 600 }}>{error}</p>
          </div>
        )}

        {!loading && !error && visibleAlumni.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: '#fff', borderRadius: 24, boxShadow: '0 2px 16px rgba(29,43,75,0.06)' }}>
            <i className="fas fa-users-slash" style={{ fontSize: 48, color: '#e2e8f0', display: 'block', marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, fontWeight: 800, color: NAVY, margin: '0 0 8px' }}>No Alumni Found</h3>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px' }}>{faceMatches.length ? 'No alumni matched this face in the current list.' : 'Try adjusting your filters.'}</p>
            <button onClick={handleClearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: NAVY, color: '#fff', border: 'none', padding: '10px 22px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
              <i className="fas fa-rotate-left" /> Clear Filters
            </button>
          </div>
        )}

        {!loading && visibleAlumni.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
            {visibleAlumni.map((alumni, i) => (
              <div
                key={alumni.id}
                className="alumni-card-anim"
                style={{ animationDelay: `${i * 40}ms` }}
                id={alumni.id === Number(highlightAlumniId) ? 'highlighted-alumni' : undefined}
              >
                <AlumniCard alumni={alumni} />
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && meta.last_page > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40 }}>
            {Array.from({ length: meta.last_page }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => handleFilter('page', page)}
                style={{
                  width: 38, height: 38, borderRadius: 10,
                  border: 'none', cursor: 'pointer',
                  fontSize: '0.8rem', fontWeight: 700,
                  background: page === meta.current_page ? NAVY : '#fff',
                  color:      page === meta.current_page ? '#fff' : '#64748b',
                  boxShadow: '0 2px 8px rgba(29,43,75,0.07)',
                  transition: 'all 0.15s',
                }}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

