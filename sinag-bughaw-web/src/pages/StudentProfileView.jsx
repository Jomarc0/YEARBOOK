import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { studentsApi } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import MessageModal from '../components/MessageModal';
import ShareModal from '../components/ShareModal';

const MOCK_ACHIEVEMENTS = [
  { title: 'Sinag-Bughaw Developer', subtitle: 'Capstone Project 2026' },
  { title: 'Tech Innovator Award',   subtitle: 'NU Lipa Exhibit'        },
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
  return name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() || '').slice(0, 2).join('');
}

export default function StudentProfileView() {
  const { id }           = useParams();
  const { user: authUser } = useAuth();
  const navigate         = useNavigate();

  const [student,  setStudent]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [showMsg,  setShowMsg]  = useState(false);
  const [showShare,setShowShare]= useState(false);

  useEffect(() => {
    if (!id) return;
    // If user is viewing their own profile, redirect to the owner profile page
    if (parseInt(id) === authUser?.id) {
      navigate('/profile', { replace: true });
      return;
    }
    setLoading(true);
    studentsApi.show(id)
      .then(({ data }) => setStudent(data))
      .catch(()        => setStudent(null))
      .finally(()      => setLoading(false));
  }, [id, authUser]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#f1f4f9]">
      <i className="fas fa-spinner fa-spin text-3xl text-[#3f51b5]" />
    </div>
  );

  if (!student) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f1f4f9] gap-4">
      <i className="fas fa-user-slash text-5xl text-slate-300" />
      <h2 className="text-xl font-black text-[#1d2b4b]">Student not found.</h2>
      <button
        onClick={() => navigate('/directory')}
        className="text-sm text-[#3f51b5] font-bold hover:underline bg-transparent border-none cursor-pointer"
      >
        ← Back to Directory
      </button>
    </div>
  );

  const batchYear    = student.section?.batch_year || new Date().getFullYear();
  const courseShort  = COURSE_SHORT[student.course] || student.course || 'Student';
  const avatarUrl    = student.profile_picture
    ? `http://127.0.0.1:8000/storage/${student.profile_picture}`
    : null;

  return (
    <div className="min-h-screen bg-[#f1f4f9]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        .card { background:#fff; border-radius:16px; padding:24px; box-shadow:0 1px 4px rgba(0,0,0,0.07); }
        .pill { display:inline-flex;align-items:center;gap:6px;background:#eef0fb;color:#3f51b5;font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px;letter-spacing:.4px; }
        .action-btn {
          display:inline-flex;align-items:center;gap:8px;
          background:#1d2b4b;color:#fff;font-weight:700;font-size:13px;
          padding:10px 22px;border-radius:10px;border:none;cursor:pointer;transition:background .2s;
        }
        .action-btn:hover { background:#162038; }
        .icon-btn {
          width:38px;height:38px;border-radius:10px;border:1.5px solid #e2e8f0;
          background:#fff;display:inline-flex;align-items:center;justify-content:center;
          cursor:pointer;color:#64748b;transition:all .2s;
        }
        .icon-btn:hover { background:#f1f4f9;color:#1d2b4b; }
      `}</style>

      <Navbar />

      {/* ── BANNER ── */}
      <div
        className="w-full h-52 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1d2b4b 0%,#3f51b5 60%,#5c6bc0 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-8 w-48 h-48 rounded-full bg-white/5" />
        <div className="absolute top-8 right-1/4 w-24 h-24 rounded-full bg-[#fdb813]/10" />
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-5 left-6 flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm bg-transparent border-none cursor-pointer transition"
        >
          <i className="fas fa-arrow-left" /> Back
        </button>
        {/* Batch badge */}
        <div className="absolute top-5 right-6 bg-white/10 backdrop-blur text-white text-[11px] font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-white/20">
          <i className="fas fa-graduation-cap text-[#fdb813]" /> Batch {batchYear}
        </div>
      </div>

      {/* ── MAIN ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-20 pb-16 relative">

        {/* ── Profile Card ── */}
        <div className="card mb-5 flex flex-col sm:flex-row gap-6 items-start" style={{ animation: 'fadeInUp .4s ease' }}>

          {/* Avatar */}
          <div className="relative shrink-0 mt-[-50px]">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={student.name}
                className="w-36 h-36 rounded-full object-cover border-[5px] border-white shadow-xl"
              />
            ) : (
              <div className="w-36 h-36 rounded-full border-[5px] border-white shadow-xl bg-[#1d2b4b] flex items-center justify-center">
                <span className="text-4xl font-black text-[#fdb813] tracking-tight">
                  {getInitials(student.name)}
                </span>
              </div>
            )}
            {/* Online dot */}
            <div className="absolute top-3 left-3 w-4 h-4 bg-green-400 border-4 border-white rounded-full shadow" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 pt-2">
            {/* Name + course pill */}
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-[#1d2b4b] capitalize leading-tight m-0">
                {student.name}
              </h1>
              <span className="pill">{courseShort}</span>
            </div>

            <p className="text-[#3f51b5] font-semibold text-sm mb-3">
              {student.course || 'Pioneer Student'} &bull; Batch {batchYear}
            </p>

            {/* Bio / quote — read only */}
            {student.bio ? (
              <blockquote className="border-l-4 border-[#fdb813] pl-4 text-slate-500 text-sm italic mb-4 my-0">
                "{student.bio}"
              </blockquote>
            ) : (
              <p className="text-slate-400 text-sm italic mb-4">No yearbook quote yet.</p>
            )}

            {/* Location + school */}
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-5">
              <span><i className="fas fa-map-marker-alt text-red-400 mr-1" /> Lipa City, Batangas</span>
              <span><i className="fas fa-university text-slate-400 mr-1" /> NU Lipa</span>
            </div>

            {/* ── Action Buttons (visitor) ── */}
            <div className="flex items-center gap-2 flex-wrap">
              <button className="action-btn" onClick={() => setShowMsg(true)}>
                <i className="fas fa-paper-plane text-xs" /> Message
              </button>
              <button className="icon-btn" onClick={() => setShowShare(true)} title="Share Profile">
                <i className="fas fa-share-alt text-sm" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Bottom Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5" style={{ animation: 'fadeInUp .55s ease' }}>

          {/* Achievements */}
          <div className="card">
            <h4 className="flex items-center gap-2 font-black text-[#1d2b4b] text-sm mb-5">
              <i className="fas fa-medal text-[#fdb813]" /> Achievements
            </h4>
            <ul className="space-y-4 list-none p-0 m-0">
              {MOCK_ACHIEVEMENTS.map(({ title, subtitle }) => (
                <li key={title} className="flex items-start gap-2.5">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#fdb813] shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#1d2b4b] m-0">{title}</p>
                    <p className="text-[11px] text-slate-400 m-0">{subtitle}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Academic Info — partial visibility for other students */}
          <div className="card">
            <h4 className="flex items-center gap-2 font-black text-[#1d2b4b] text-sm mb-5">
              <i className="fas fa-graduation-cap text-[#fdb813]" /> Academic Info
            </h4>
            <div className="space-y-3">
              {[
                ['Course',      student.course    || 'N/A'],
                ['Year Level',  student.year_level ? `${student.year_level}th Year` : '4th Year'],
                ['Status',      'Enrolled'],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between items-center text-xs pb-3 border-b border-slate-50 last:border-0 last:pb-0"
                >
                  <span className="text-slate-400">{label}</span>
                  <span className={`font-bold ${label === 'Status' ? 'text-green-500' : 'text-[#1d2b4b]'}`}>
                    {value}
                  </span>
                </div>
              ))}
              {/* Student ID intentionally hidden for privacy */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Student ID</span>
                <span className="font-bold text-slate-300 tracking-widest">••••••</span>
              </div>
            </div>
          </div>

          {/* Tagged Photos */}
          <div className="card">
            <h4 className="flex items-center gap-2 font-black text-[#1d2b4b] text-sm mb-5">
              <i className="fas fa-images text-[#fdb813]" /> Tagged Photos
            </h4>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="aspect-square rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-200 text-lg"
                >
                  <i className="fas fa-image text-base" />
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 text-center m-0">
              No tagged photos yet.
            </p>
          </div>

        </div>
      </div>

      {/* ── Modals ── */}
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
    </div>
  );
}