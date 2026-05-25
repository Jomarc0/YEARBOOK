import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { studentsApi } from '@/api/student.api';
import { useAuth } from '@/features/auth/hooks/useAuth';
import MessageModal from '@/components/feedback/MessageModal';
import ShareModal from '@/features/profile/components/ShareModal';
import PremiumBadge from '@/features/subscription/components/PremiumBadge';
import StudentPhotosSection from '../components/StudentPhotosSection';
import { imageUrl, avatarUrl as makeAvatar } from '@/utils/imageUrl';

const MOCK_ACHIEVEMENTS = [
  { title: 'Sinag-Bughaw Developer', subtitle: 'Capstone Project 2026'       },
  { title: 'Tech Innovator Award',   subtitle: 'NU Lipa Exhibit'             },
  { title: "Dean's Lister",          subtitle: '1st Semester A.Y. 2025-2026' },
];

const COURSE_SHORT = {
  'Bachelor of Science in Computer Science':       'BSCS',
  'Bachelor of Science in Information Technology': 'BSIT',
  'Bachelor of Science in Civil Engineering':      'BSCE',
  'Bachelor of Science in Mechanical Engineering': 'BSME',
  'Bachelor of Science in Nursing':                'BSN',
  'Bachelor of Science in Accountancy':            'BSA',
  'Bachelor of Science in Psychology':             'BSPsych',
  'Bachelor of Education':                         'BEd',
};

function getInitials(name = '') {
  return name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

export default function StudentProfileView() {
  const { id }             = useParams();
  const { user: authUser } = useAuth();
  const navigate           = useNavigate();

  const [student,      setStudent]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [visibility,   setVisibility]   = useState(null);
  const [showMsg,      setShowMsg]      = useState(false);
  const [showShare,    setShowShare]    = useState(false);
  const [taggedPhotos, setTaggedPhotos] = useState([]);

  useEffect(() => {
    if (!id) return;
    if (parseInt(id) === authUser?.id) {
      navigate('/profile', { replace: true });
      return;
    }
    setLoading(true);
    studentsApi.show(id)
      .then(({ data }) => setStudent(data))
      .catch((err) => {
        const vis = err.response?.data?.visibility;
        if (vis) setVisibility(vis);
        setStudent(null);
      })
      .finally(() => setLoading(false));

    studentsApi.getTaggedPhotos(id)
      .then(({ data }) => setTaggedPhotos(data.photos ?? []))
      .catch(() => {});
  }, [id, authUser]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7fe' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid #e2e8f0', borderTopColor: '#3f51b5', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Loading profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!student) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f4f7fe', gap: 12 }}>
      <i
        className={`fas ${
          visibility === 'private'     ? 'fa-lock' :
          visibility === 'alumni_only' ? 'fa-user-shield' :
                                         'fa-user-slash'
        }`}
        style={{ fontSize: 48, color: '#e2e8f0' }}
      />
      <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1d2b4b', margin: 0 }}>
        {visibility === 'private'     && 'This profile is private.'}
        {visibility === 'alumni_only' && 'Log in to view this profile.'}
        {!visibility                  && 'Student not found.'}
      </h2>
      <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
        {visibility === 'private'     && 'The student has restricted access to their profile.'}
        {visibility === 'alumni_only' && 'This profile is visible to logged-in users only.'}
      </p>
      <button onClick={() => navigate('/directory')} style={{ background: 'none', border: 'none', color: '#3f51b5', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
        ← Back to Directory
      </button>
    </div>
  );

  const batchYear   = student.section?.batch_year || new Date().getFullYear();
  const courseShort = COURSE_SHORT[student.course] || student.course || 'Student';

  // ✅ Fixed: handles both Cloudinary URLs and local paths
  const avatar = imageUrl(student.profile_picture) || makeAvatar(student.name);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f7fe', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      <Navbar />

      {/* Modals */}
      <MessageModal
        isOpen={showMsg}
        onClose={() => setShowMsg(false)}
        student={student}
        authUser={authUser}
      />
      <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        student={student}
      />

      {/* Banner */}
      <div style={{
        height: 200,
        background: 'linear-gradient(135deg, #1d2b4b 0%, #3f51b5 60%, #5c6bc0 100%)',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', bottom: -60, left: -20, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'absolute', top: 30, right: '25%', width: 90, height: 90, borderRadius: '50%', background: 'rgba(253,184,19,0.08)' }} />
        <button onClick={() => navigate(-1)} style={{
          position: 'absolute', top: 20, left: 24,
          display: 'flex', alignItems: 'center', gap: 6,
          color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 13, fontWeight: 600,
        }}>
          <i className="fas fa-arrow-left" /> Back
        </button>
        <div style={{
          position: 'absolute', top: 20, right: 24,
          background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: 10, padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, color: '#fff',
        }}>
          <i className="fas fa-graduation-cap" style={{ color: '#fdb813' }} /> Batch {batchYear}
        </div>
      </div>

      <main style={{ flex: 1, maxWidth: 935, margin: '0 auto 40px', padding: '0 20px', width: '100%' }}>

        {/* Profile Card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '32px 40px',
          marginBottom: 20, border: '1px solid #f1f5f9',
          marginTop: -80, position: 'relative', zIndex: 10,
          animation: 'fadeIn 0.4s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40 }}>

            {/* Avatar */}
            <div style={{ position: 'relative', flexShrink: 0, marginTop: -60 }}>
              <div style={{
                width: 130, height: 130, borderRadius: '50%',
                background: 'linear-gradient(45deg, #fdb813, #3f51b5)', padding: 3,
              }}>
                {avatar ? (
                  <img src={avatar} alt={student.name} style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    objectFit: 'cover', border: '3px solid #fff', display: 'block',
                  }}
                    onError={e => { e.target.src = makeAvatar(student.name); }}
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', borderRadius: '50%',
                    background: '#1d2b4b', border: '3px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: '#fdb813' }}>{getInitials(student.name)}</span>
                  </div>
                )}
              </div>
              <div style={{
                position: 'absolute', bottom: 10, right: 8,
                width: 16, height: 16, borderRadius: '50%',
                background: '#10b981', border: '3px solid #fff',
              }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, paddingTop: 8 }}>

              {/* Name row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1d2b4b', margin: 0 }}>{student.name}</h1>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: '#eef0fb', color: '#3f51b5',
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                }}>{courseShort}</span>
                {student.is_premium && <PremiumBadge size="sm" />}
              </div>

              <p style={{ fontSize: 13, color: '#3f51b5', fontWeight: 500, margin: '0 0 12px' }}>
                {student.course || 'Pioneer Student'} · Batch {batchYear}
              </p>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 28, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
                {[
                  { label: 'Course',  value: courseShort         },
                  { label: 'Batch',   value: batchYear           },
                  { label: 'Photos',  value: taggedPhotos.length },
                  { label: 'Status',  value: 'Enrolled'          },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1d2b4b', lineHeight: 1 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Bio */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#1d2b4b', marginBottom: 3 }}>{student.name?.split(' ')[0]}</div>
                <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{student.course ?? 'Pioneer Student'} · National University Lipa</div>

                {student.bio ? (
                  <p style={{ fontSize: 13, color: '#475569', fontStyle: 'italic', lineHeight: 1.7, margin: '0 0 8px' }}>
                    "{student.bio}"
                  </p>
                ) : (
                  <p style={{ fontSize: 13, color: '#cbd5e1', fontStyle: 'italic', margin: '0 0 8px' }}>No yearbook quote yet.</p>
                )}

                {student.motto && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    background: '#fffbeb', border: '1px solid #fde68a',
                    borderRadius: 8, padding: '5px 12px', marginBottom: 8,
                  }}>
                    <i className="fas fa-quote-left" style={{ fontSize: 10, color: '#fdb813' }} />
                    <span style={{ fontSize: 12, color: '#92400e', fontStyle: 'italic' }}>{student.motto}</span>
                  </div>
                )}
              </div>

              {/* Location */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="fas fa-map-marker-alt" style={{ color: '#ef4444', fontSize: 11 }} /> Lipa City, Batangas
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="fas fa-university" style={{ color: '#3f51b5', fontSize: 11 }} /> NU Lipa
                </span>
              </div>

              {/* ✅ Fixed: Message button now properly opens modal */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  onClick={() => setShowMsg(true)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: '#1d2b4b', color: '#fff', border: 'none',
                    padding: '10px 22px', borderRadius: 10,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#3f51b5'}
                  onMouseLeave={e => e.currentTarget.style.background = '#1d2b4b'}
                >
                  <i className="fas fa-paper-plane" style={{ fontSize: 11 }} /> Message
                </button>
                <button
                  onClick={() => setShowShare(true)}
                  style={{
                    width: 38, height: 38, borderRadius: 10,
                    border: '1.5px solid #e2e8f0',
                    background: '#fff', color: '#64748b',
                    cursor: 'pointer', fontSize: 14,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                  title="Share Profile"
                >
                  <i className="fas fa-share-alt" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, animation: 'fadeIn 0.5s ease' }}>

          {/* Tagged Photos */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9' }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1d2b4b', marginBottom: 16, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-images" style={{ color: '#fdb813' }} /> Tagged Photos
            </h4>
            <StudentPhotosSection userId={parseInt(id)} compact />
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Academic Info */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1d2b4b', marginBottom: 16, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-graduation-cap" style={{ color: '#fdb813' }} /> Academic Info
              </h4>
              {[
                { label: 'Course',     value: student.course || 'N/A' },
                { label: 'Year Level', value: student.year_level ? `${student.year_level}th Year` : '4th Year' },
                { label: 'Status',     value: 'Enrolled', green: true },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '9px 0', borderBottom: '1px solid #f8fafc', fontSize: 13,
                }}>
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>{row.label}</span>
                  <span style={{ fontWeight: 600, color: row.green ? '#10b981' : '#1d2b4b' }}>{row.value}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', fontSize: 13 }}>
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>Student ID</span>
                <span style={{ fontWeight: 600, color: '#cbd5e1', letterSpacing: 2 }}>••••••</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 9, fontSize: 13 }}>
                <span style={{ color: '#94a3b8', fontWeight: 500 }}>Membership</span>
                {student.is_premium ? <PremiumBadge size="sm" /> : <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>Free Plan</span>}
              </div>
            </div>

            {/* Achievements */}
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid #f1f5f9', flex: 1 }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1d2b4b', marginBottom: 16, marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-award" style={{ color: '#fdb813' }} /> Achievements
              </h4>
              {MOCK_ACHIEVEMENTS.map(a => (
                <div key={a.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fdb813', marginTop: 5, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#1d2b4b', lineHeight: 1.3 }}>{a.title}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{a.subtitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}