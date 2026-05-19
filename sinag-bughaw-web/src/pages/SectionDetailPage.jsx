import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { sectionsApi } from '../services/api';

export default function SectionDetailPage() {
  const { id }                  = useParams();
  const [section, setSection]   = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    sectionsApi.show(id)
      .then(({ data }) => setSection(data))
      .catch(()        => setSection(null))
      .finally(()      => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <i className="fas fa-spinner fa-spin text-3xl text-[#3f51b5]" />
    </div>
  );

  if (!section) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <h2 className="text-xl font-black text-[#1d2b4b]">Section not found.</h2>
      <Link to="/sections" className="text-[#3f51b5] font-semibold no-underline hover:underline">
        ← Back to Sections
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <style>{`
        @keyframes fadeInUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        .stu-chip { animation: fadeInUp 0.5s ease forwards; }
        .stu-chip:hover { transform: translateY(-6px); box-shadow: 0 15px 35px rgba(29,43,75,0.1); }
      `}</style>

      <Navbar />

      {/* HEADER */}
      <header className="bg-gradient-to-br from-[#1d2b4b] to-[#3f51b5] px-[8%] py-20 text-white rounded-b-[60px]">
        <Link
          to="/sections"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm no-underline mb-6 transition"
        >
          <i className="fas fa-arrow-left" /> Back to Sections
        </Link>
        <h1 className="text-4xl font-black tracking-tight mb-3">{section.name}</h1>
        <p className="text-white/70 text-sm m-0">
          {section.course} · {section.students?.length || 0} students
        </p>
      </header>

      {/* STUDENTS */}
      <main className="px-[8%] py-16 flex-1">
        <h2 className="text-xl font-black text-[#1d2b4b] mb-8">
          Students in this Section
        </h2>

        {section.students?.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {section.students.map((student, i) => (
              <Link
                key={student.id}
                to={`/profile/${student.id}`}
                className="no-underline"
              >
                <div
                  className="stu-chip bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all duration-400 cursor-pointer"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* Photo */}
                  <div className="h-48 overflow-hidden bg-indigo-50">
                    <img
                      src={
                        student.profile_picture
                          ? `http://127.0.0.1:8000/storage/${student.profile_picture}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1d2b4b&color=fff&size=200`
                      }
                      alt={student.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h4 className="text-sm font-black text-[#1d2b4b] m-0 leading-tight truncate">
                      {student.name}
                    </h4>
                    <p className="text-[10px] text-slate-400 m-0 mt-1">
                      {student.student_id || 'N/A'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-slate-400">
            <i className="fas fa-users text-6xl mb-5 block opacity-10" />
            <h3 className="text-xl font-black text-[#1d2b4b] mb-2">
              No Students Yet
            </h3>
            <p className="text-sm">This section has no students assigned.</p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}