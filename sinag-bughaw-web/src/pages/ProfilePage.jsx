import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { studentsApi, yearbookApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import PremiumBadge from '../components/PremiumBadge';

export default function ProfilePage() {
  const { id }             = useParams();
  const { user: authUser } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bio,     setBio]     = useState('');
  const [editing, setEditing] = useState(false);
  const [toast,   setToast]   = useState(false);
  const fileRef = useRef();
  const isOwn   = authUser?.id === parseInt(id);

  useEffect(() => {
    studentsApi.show(id)
      .then(({ data }) => { setStudent(data); setBio(data.bio ?? ''); })
      .finally(() => setLoading(false));
  }, [id]);

  const saveBio = async () => {
    await studentsApi.updateBio(bio);
    setStudent(prev => ({ ...prev, bio }));
    setEditing(false);
    showToast();
  };

  const showToast = () => {
    setToast(true);
    setTimeout(() => setToast(false), 3000);
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    const { data } = await studentsApi.updatePhoto(formData);
    setStudent(prev => ({ ...prev, profile_picture: data.profile_picture }));
    showToast();
  };

  const downloadPdf = async () => {
    const { data } = await yearbookApi.exportStudentPdf(id);
    const url = URL.createObjectURL(new Blob([data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = `profile-${student?.student_id}.pdf`;
    a.click();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: '#94a3b8' }}>
      <div>
        <div className="w-10 h-10 rounded-full border-4 mx-auto mb-3"
          style={{ borderColor: 'rgba(63,81,181,0.2)', borderTopColor: '#3f51b5', animation: 'spin 0.8s linear infinite' }} />
        <p className="text-sm text-center">Loading profile...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );

  if (!student) return (
    <div className="min-h-screen flex items-center justify-center" style={{ color: '#94a3b8' }}>
      Student not found.
    </div>
  );

  const avatar = student.profile_picture
    || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1d2b4b&color=fff&size=400`;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-gray,#f2f4f7)', color: '#333' }}>
      <style>{`
        @keyframes spin        { to { transform: rotate(360deg); } }
        @keyframes slideIn     { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes fadeInScale { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
      `}</style>

      <Navbar />

      {/* Toast */}
      {toast && (
        <div className="fixed right-8 font-semibold flex items-center gap-2"
          style={{ top: '100px', background: '#2ecc71', color: 'white', padding: '15px 25px', borderRadius: '12px', zIndex: 2000, boxShadow: '0 10px 30px rgba(46,204,113,0.3)', animation: 'slideIn 0.4s ease forwards' }}>
          <i className="fas fa-check-circle" /> Profile updated!
        </div>
      )}

      {/* Banner */}
      <div className="w-full" style={{ height: '300px', background: "linear-gradient(rgba(29,43,75,0.4), rgba(29,43,75,0.8)), url('https://images.unsplash.com/photo-1541339907198-e08756ebafe1?auto=format&fit=crop&w=1200') center/cover" }} />

      <div style={{ maxWidth: '1100px', margin: '-100px auto 50px', padding: '0 20px', position: 'relative' }}>

        {/* Main Card */}
        <div className="bg-white flex gap-10 items-start"
          style={{ borderRadius: '24px', padding: '40px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', animation: 'fadeInScale 0.6s ease forwards' }}>

          {/* Photo */}
          <div className="relative flex-shrink-0">
            {/* Online dot */}
            <div className="w-4 h-4 rounded-full absolute z-10"
              style={{ background: '#2ecc71', border: '4px solid white', top: '14px', left: '14px', boxShadow: '0 0 10px rgba(46,204,113,0.4)' }} />

            <img src={avatar} alt={student.name}
              className="object-cover cursor-pointer transition-all"
              style={{ width: '200px', height: '200px', borderRadius: '50%', border: '7px solid white', boxShadow: '0 10px 25px rgba(0,0,0,0.15)' }}
              onClick={() => isOwn && fileRef.current.click()} />

            {isOwn && (
              <>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handlePhotoUpload} />
                <div
                  className="absolute flex items-center justify-center cursor-pointer transition-all"
                  style={{ bottom: '15px', right: '15px', background: 'var(--nu-blue-bright)', color: 'white', width: '42px', height: '42px', borderRadius: '50%', border: '4px solid white', zIndex: 6 }}
                  onClick={() => fileRef.current.click()}
                  title="Change photo"
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--nu-blue)'; e.currentTarget.style.transform = 'rotate(15deg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--nu-blue-bright)'; e.currentTarget.style.transform = 'none'; }}>
                  <i className="fas fa-camera text-sm" />
                </div>
              </>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            {/* Name row */}
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="font-extrabold capitalize" style={{ fontSize: '2.2rem', color: 'var(--nu-blue)' }}>
                {student.name}
              </h1>
              {/* Premium badge — shows under name if user is premium */}
              {student.is_premium && <PremiumBadge size="md" />}
            </div>

            <p className="font-bold text-base mb-5" style={{ color: 'var(--nu-blue-bright)', letterSpacing: '0.5px' }}>
              {student.course ?? 'BS Computer Science'} • Batch 2026
            </p>

            {/* Bio / yearbook quote */}
            <div className="mb-6">
              {editing ? (
                <div>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    placeholder="Write your yearbook legacy..."
                    className="w-full rounded-xl resize-none outline-none"
                    style={{ padding: '12px', border: '2px solid var(--nu-blue-bright)', fontFamily: 'inherit', fontSize: '0.9rem', color: '#444' }}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={saveBio}
                      className="text-white border-none cursor-pointer font-semibold text-xs rounded-lg"
                      style={{ background: 'var(--nu-blue-bright)', padding: '8px 18px' }}>
                      Save Changes
                    </button>
                    <button onClick={() => setEditing(false)}
                      className="border-none cursor-pointer font-semibold text-xs rounded-lg"
                      style={{ background: '#eee', color: '#666', padding: '8px 18px' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p
                  className="italic cursor-pointer transition-all"
                  style={{ color: '#555', fontSize: '0.95rem', lineHeight: 1.7 }}
                  onClick={() => isOwn && setEditing(true)}
                  title={isOwn ? 'Click to edit your quote' : ''}
                >
                  "{student.bio || (isOwn ? 'Click here to add your yearbook quote...' : 'No quote added.')}"
                  {isOwn && <i className="fas fa-pencil-alt ml-2 text-xs" style={{ color: '#ccc' }} />}
                </p>
              )}
            </div>

            <div className="flex items-center gap-6 mb-5 text-sm font-medium" style={{ color: '#777' }}>
              <span><i className="fas fa-map-marker-alt mr-2" style={{ color: '#e74c3c' }} />Lipa City, Batangas</span>
              <span><i className="fas fa-university mr-2" style={{ color: 'var(--nu-blue-bright)' }} />NU Lipa</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              {!isOwn && (
                <Link to={`/messages/${student.id}`}
                  className="flex items-center gap-2 font-bold no-underline transition-all"
                  style={{ background: 'var(--nu-blue)', color: 'white', padding: '12px 30px', borderRadius: '12px', fontSize: '0.9rem', boxShadow: '0 8px 20px rgba(29,43,75,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--nu-blue-bright)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--nu-blue)'; e.currentTarget.style.transform = 'none'; }}>
                  <i className="fas fa-paper-plane" /> Message
                </Link>
              )}

              {/* Own profile: Settings button */}
              {isOwn && (
                <Link to="/settings"
                  className="flex items-center gap-2 font-bold no-underline transition-all"
                  style={{ background: 'var(--nu-blue)', color: 'white', padding: '12px 30px', borderRadius: '12px', fontSize: '0.9rem', boxShadow: '0 8px 20px rgba(29,43,75,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--nu-blue-bright)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--nu-blue)'; e.currentTarget.style.transform = 'none'; }}>
                  <i className="fas fa-cog" /> Edit Settings
                </Link>
              )}

              {/* Own profile: upgrade to premium if not yet */}
              {isOwn && !authUser?.is_premium && (
                <Link to="/premium"
                  className="flex items-center gap-2 font-bold no-underline transition-all"
                  style={{ background: 'linear-gradient(135deg, #fdb813, #f97316)', color: '#1d2b4b', padding: '12px 24px', borderRadius: '12px', fontSize: '0.9rem' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.filter = 'brightness(0.95)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.filter = 'none'; }}>
                  <i className="fas fa-star" /> Go Premium
                </Link>
              )}

              <button onClick={downloadPdf}
                className="border cursor-pointer transition-all"
                style={{ width: '45px', height: '45px', borderRadius: '12px', color: '#666', background: 'white', borderColor: '#ddd', fontSize: '1rem' }}
                title="Download PDF"
                onMouseEnter={e => { e.currentTarget.style.background = '#f9f9f9'; e.currentTarget.style.color = 'var(--nu-blue)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#666'; }}>
                <i className="fas fa-download" />
              </button>

              <button
                className="border cursor-pointer transition-all"
                style={{ width: '45px', height: '45px', borderRadius: '12px', color: '#666', background: 'white', borderColor: '#ddd' }}
                title="Share profile"
                onMouseEnter={e => { e.currentTarget.style.background = '#f9f9f9'; e.currentTarget.style.color = 'var(--nu-blue)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#666'; }}>
                <i className="fas fa-share-alt" />
              </button>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid gap-8 mt-8" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>

          {/* Achievements */}
          <div className="bg-white rounded-[20px] p-8 transition-all"
            style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.03)'; }}>
            <h4 className="flex items-center gap-3 font-bold mb-6" style={{ color: 'var(--nu-blue)' }}>
              <i className="fas fa-award" style={{ color: 'var(--nu-yellow)' }} /> Achievements
            </h4>
            <ul className="list-none space-y-5">
              {[
                { t: 'Sinag-Bughaw Developer', s: 'Capstone Project 2026' },
                { t: 'Tech Innovator Award',   s: 'NU Lipa Exhibit' },
                { t: "Dean's Lister",          s: '1st Semester A.Y. 2025-2026' },
              ].map(a => (
                <li key={a.t} className="relative pl-5">
                  <span className="absolute left-0 top-2 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--nu-blue-bright)' }} />
                  <b className="block text-sm mb-0.5" style={{ color: '#111' }}>{a.t}</b>
                  <span className="text-xs font-medium" style={{ color: '#888' }}>{a.s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Academic Info */}
          <div className="bg-white rounded-[20px] p-8 transition-all"
            style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <h4 className="flex items-center gap-3 font-bold mb-6" style={{ color: 'var(--nu-blue)' }}>
              <i className="fas fa-graduation-cap" style={{ color: 'var(--nu-yellow)' }} /> Academic Info
            </h4>
            {[
              { label: 'Student ID', value: student.student_id ?? 'N/A' },
              { label: 'Course',     value: student.course ?? 'BSCS'    },
              { label: 'Year Level', value: '4th Year'                  },
              { label: 'Status',     value: 'Enrolled', green: true     },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-sm pb-3 mb-3 border-b border-[#f5f5f5] last:border-0">
                <span style={{ color: '#888', fontWeight: 500 }}>{row.label}</span>
                <span className="font-bold" style={{ color: row.green ? '#2ecc71' : 'var(--nu-blue)' }}>
                  {row.value}
                </span>
              </div>
            ))}

            {/* Premium status row */}
            <div className="flex justify-between text-sm pt-1">
              <span style={{ color: '#888', fontWeight: 500 }}>Membership</span>
              {student.is_premium
                ? <PremiumBadge size="sm" />
                : <span className="text-xs font-bold" style={{ color: '#94a3b8' }}>Free Plan</span>}
            </div>
          </div>

          {/* Tagged Photos */}
          <div className="bg-white rounded-[20px] p-8 transition-all"
            style={{ boxShadow: '0 10px 25px rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-5px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <h4 className="flex items-center gap-3 font-bold mb-6" style={{ color: 'var(--nu-blue)' }}>
              <i className="fas fa-images" style={{ color: 'var(--nu-yellow)' }} /> Tagged Photos
            </h4>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map(n => (
                <div key={n}
                  className="flex items-center justify-center cursor-pointer transition-all aspect-square rounded-xl border-2 border-dashed"
                  style={{ background: '#f8f9fa', borderColor: '#e0e0e0', color: '#bbb' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--nu-blue-bright)'; e.currentTarget.style.background = '#f0f2ff'; e.currentTarget.style.color = 'var(--nu-blue-bright)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.background = '#f8f9fa'; e.currentTarget.style.color = '#bbb'; }}>
                  <i className="fas fa-plus" />
                </div>
              ))}
            </div>
            <p className="text-center text-xs mt-3" style={{ color: '#bbb' }}>
              Photos where you are tagged will appear here.
            </p>
          </div>
        </div>
      </div>

      <footer className="text-white text-center mt-16" style={{ background: '#0e1628', padding: '40px 8%' }}>
        <p className="text-xs tracking-widest" style={{ color: '#55607a' }}>
          &copy; 2026 NATIONAL UNIVERSITY LIPA • SINAG-BUGHAW PROJECT
        </p>
      </footer>
    </div>
  );
}