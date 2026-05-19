import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { sectionsApi } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function SectionsPage() {
  const { id }              = useParams();
  const [sections, setSections] = useState([]);
  const [section,  setSection]  = useState(null);
  const [students, setStudents] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (id) {
      sectionsApi.show(id).then(({ data }) => {
        setSection(data.section);
        setStudents(data.students?.data ?? []);
      }).finally(() => setLoading(false));
    } else {
      sectionsApi.list().then(({ data }) => setSections(data)).finally(() => setLoading(false));
    }
  }, [id]);

  // Section Detail View
  if (id) return (
    <div className="min-h-screen flex flex-col" style={{ background:'#f8fafc' }}>
      <Navbar />

      <header className="bg-white border-b flex justify-between items-end" style={{ padding:'40px 8%', borderColor:'#e2e8f0' }}>
        <div>
          <div className="text-xs font-extrabold uppercase tracking-widest mb-2" style={{ color:'#94a3b8' }}>
            <Link to="/sections" className="no-underline font-extrabold" style={{ color:'var(--nu-blue-bright)' }}>Sections</Link> / {section?.name}
          </div>
          <h1 className="font-extrabold" style={{ fontSize:'2.2rem', color:'var(--nu-blue)' }}>
            {section?.name} Masterlist
          </h1>
        </div>
        <div className="font-semibold text-sm" style={{ background:'#f1f5f9', padding:'10px 20px', borderRadius:'50px', color:'#475569' }}>
          <i className="fas fa-graduation-cap mr-2" /> {students.length} Registered Students
        </div>
      </header>

      <main style={{ padding:'40px 8%', maxWidth:'1400px', margin:'0 auto', width:'100%' }}>
        <div className="overflow-hidden" style={{ background:'white', borderRadius:'15px', boxShadow:'0 4px 6px rgba(0,0,0,0.1)', border:'1px solid #e2e8f0' }}>
          <table className="w-full" style={{ borderCollapse:'collapse', textAlign:'left' }}>
            <thead style={{ background:'#f8fafc', borderBottom:'2px solid #e2e8f0' }}>
              <tr>
                <th className="text-xs uppercase font-bold" style={{ padding:'18px 25px', color:'#64748b' }}>Student Information</th>
                <th className="text-xs uppercase font-bold" style={{ padding:'18px 25px', color:'#64748b' }}>Email Address</th>
                <th className="text-xs uppercase font-bold" style={{ padding:'18px 25px', color:'#64748b' }}>Status</th>
                <th className="text-xs uppercase font-bold text-right" style={{ padding:'18px 25px', color:'#64748b' }}>Profile</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-24" style={{ color:'#94a3b8' }}>
                  <i className="fas fa-folder-open text-5xl mb-4 block opacity-30" />
                  No students enrolled in this section yet.
                </td></tr>
              ) : students.map(s => (
                <tr key={s.id} style={{ borderBottom:'1px solid #f1f5f9', transition:'0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='#fcfcfd'}
                  onMouseLeave={e=>e.currentTarget.style.background='white'}>
                  <td style={{ padding:'15px 25px' }}>
                    <div className="flex items-center gap-4">
                      <img src={s.profile_picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&background=1d2b4b&color=fff`}
                        className="object-cover" style={{ width:'45px',height:'45px',borderRadius:'12px',background:'#e2e8f0' }} />
                      <div>
                        <span className="block font-bold text-sm" style={{ color:'var(--nu-blue)' }}>{s.name}</span>
                        <span className="text-xs" style={{ color:'#94a3b8' }}>{s.student_id}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'15px 25px', color:'#64748b', fontSize:'0.9rem' }}>{s.email}</td>
                  <td style={{ padding:'15px 25px' }}>
                    <span className="text-xs font-bold" style={{ padding:'5px 12px',borderRadius:'20px',background:'#ecfdf5',color:'#059669' }}>Verified</span>
                  </td>
                  <td style={{ padding:'15px 25px', textAlign:'right' }}>
                    <Link to={`/profile/${s.id}`} className="font-semibold no-underline transition-all text-sm"
                      style={{ padding:'8px 16px',borderRadius:'8px',border:'1px solid #e2e8f0',background:'white',color:'var(--nu-blue)' }}
                      onMouseEnter={e=>{e.currentTarget.style.background='var(--nu-blue)';e.currentTarget.style.color='white';e.currentTarget.style.borderColor='var(--nu-blue)';}}
                      onMouseLeave={e=>{e.currentTarget.style.background='white';e.currentTarget.style.color='var(--nu-blue)';e.currentTarget.style.borderColor='#e2e8f0';}}>
                      View Full Profile
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );

  // Sections List View
  return (
    <div className="min-h-screen flex flex-col" style={{ background:'#f8fafc' }}>
      <Navbar />

      <header className="text-white text-center"
        style={{ background:'linear-gradient(135deg, #1d2b4b 0%, #3f51b5 100%)', padding:'80px 8% 100px', borderRadius:'0 0 60px 60px' }}>
        <h1 className="font-extrabold mb-4" style={{ fontSize:'3rem', letterSpacing:'-2px' }}>
          Student <span style={{ color:'var(--nu-yellow)' }}>Sections</span>
        </h1>
        <p className="font-light" style={{ opacity:0.8, fontSize:'1rem' }}>Browse all academic sections and their members.</p>
      </header>

      <main style={{ padding:'60px 8% 80px' }}>
        {loading ? (
          <p className="text-center py-20" style={{ color:'#94a3b8' }}>Loading...</p>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'25px' }}>
            {sections.map(sec => (
              <Link key={sec.id} to={`/sections/${sec.id}`} className="no-underline block bg-white transition-all"
                style={{ borderRadius:'20px', padding:'35px', boxShadow:'0 4px 20px rgba(0,0,0,0.03)', border:'1px solid #e2e8f0', color:'inherit' }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-8px)';e.currentTarget.style.boxShadow='0 20px 40px rgba(29,43,75,0.1)';e.currentTarget.style.borderColor='var(--nu-blue-bright)';}}
                onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.03)';e.currentTarget.style.borderColor='#e2e8f0';}}>
                <div className="flex items-center justify-center w-12 h-12 rounded-xl mb-4"
                  style={{ background:'#eef2ff', color:'var(--nu-blue-bright)' }}>
                  <i className="fas fa-layer-group" />
                </div>
                <h3 className="font-extrabold text-xl mb-2" style={{ color:'var(--nu-blue)' }}>{sec.name}</h3>
                <p className="font-semibold" style={{ color:'var(--nu-blue-bright)' }}>
                  {sec.users_count} students
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}