import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col font-['Inter']">

      {/* NAVBAR */}
      <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-[8%] py-5">
        <Link to="/" className="no-underline flex items-center gap-3">
          <img src="/images/NU_logo.png" alt="NU Lipa" className="h-10 object-contain" />
          <div className="leading-tight">
            <p className="text-white font-black text-xs uppercase tracking-widest m-0">Sinag-Bughaw</p>
            <p className="text-[#fdb813] font-semibold text-[9px] tracking-[2px] uppercase m-0">Digital Yearbook</p>
          </div>
        </Link>

        <ul className="hidden md:flex gap-5 list-none bg-white/20 backdrop-blur px-6 py-2 rounded-full m-0">
          {[['/', 'Home'], ['/directory', 'Directory'], ['/faculty', 'Faculty'], ['/gallery', 'Gallery'], ['/sections', 'Sections']].map(([to, label]) => (
            <li key={to}>
              <Link to={to} className="text-white text-sm font-medium no-underline hover:text-[#fdb813] transition-colors">
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <Link to="/login" className="text-white font-semibold text-sm no-underline hover:text-[#fdb813] transition">
            Login
          </Link>
          <Link to="/register" className="bg-[#fdb813] text-[#1d2b4b] font-bold text-sm px-6 py-2.5 rounded-lg no-underline hover:brightness-95 transition">
            Register
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section
        className="h-screen flex flex-col items-center justify-center text-center text-white px-6"
        style={{
          background: "linear-gradient(rgba(29,43,75,0.75), rgba(29,43,75,0.75)), url('/images/NU-building.jpg') center/cover no-repeat",
        }}
      >
        <p className="uppercase tracking-widest text-sm font-semibold mb-2 opacity-90">
          Excellence in Education
        </p>
        <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
          Your Legacy,<br />
          <span className="text-[#fdb813]">Digitally Preserved.</span>
        </h1>
        <p className="max-w-xl text-base md:text-lg opacity-85 leading-relaxed mb-10">
          Welcome to the official NU Lipa Digital Yearbook. Connect with alumni,
          celebrate achievements, and relive your university memories.
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            to="/directory"
            className="bg-[#fdb813] text-[#1d2b4b] font-bold px-8 py-4 rounded-xl no-underline flex items-center gap-2 hover:brightness-95 transition"
          >
            <i className="fas fa-search" /> Browse Directory
          </Link>
          <Link
            to="/register"
            className="border-2 border-white text-white font-semibold px-8 py-4 rounded-xl no-underline hover:bg-white/10 transition"
          >
            Join the Community
          </Link>
        </div>
      </section>

      {/* FLOATING STATS */}
      <section className="flex justify-center gap-6 flex-wrap px-[8%] -mt-16 relative z-10">
        {[
          { icon: 'user-graduate', value: '12,500+', label: 'Graduates' },
          { icon: 'book-open',     value: '35+',     label: 'Programs'  },
          { icon: 'images',        value: '50k+',    label: 'Photos'    },
        ].map(({ icon, value, label }) => (
          <div
            key={icon}
            className="bg-white rounded-2xl px-8 py-8 flex items-center gap-5 shadow-xl flex-1 min-w-[240px] max-w-xs"
          >
            <div className="w-14 h-14 rounded-xl bg-indigo-50 text-[#3f51b5] flex items-center justify-center text-2xl shrink-0">
              <i className={`fas fa-${icon}`} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-[#1d2b4b] m-0">{value}</h2>
              <p className="text-sm text-slate-400 m-0">{label}</p>
            </div>
          </div>
        ))}
      </section>

      {/* EXPLORE SECTION */}
      <section className="px-[8%] py-28 text-center">
        <h2 className="text-4xl font-black text-[#1d2b4b] mb-3">Explore the Yearbook</h2>
        <p className="text-slate-500 text-base mb-14">
          Discover the vibrant community of NU Lipa through our curated sections.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              img:   '/images/nustud.jpg',
              title: 'Student Directory',
              desc:  'Find classmates and connect with alumni from various batches.',
              to:    '/directory',
            },
            {
              img:   '/images/gallerynu.jpg',
              title: 'Photo Gallery',
              desc:  'Browse collections from university events and memorable moments.',
              to:    '/gallery',
            },
            {
              img:   '/images/nufaculty.jpg',
              title: 'Faculty & Staff',
              desc:  'Meet the mentors and staff who guided your academic journey.',
              to:    '/faculty',
            },
          ].map(({ img, title, desc, to }) => (
            <Link key={to} to={to} className="no-underline group">
              <div className="relative rounded-3xl overflow-hidden h-[480px]">
                <img
                  src={img}
                  alt={title}
                  className="w-full h-full object-cover brightness-75 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black/90 to-transparent text-white text-left">
                  <h3 className="text-2xl font-black mb-2">{title}</h3>
                  <p className="text-sm opacity-85 leading-relaxed">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="mx-[8%] mb-24 rounded-3xl bg-gradient-to-r from-[#1d2b4b] to-[#3f51b5] text-white text-center py-20 px-6">
        <h2 className="text-4xl font-black mb-4">Ready to Relive Your Memories?</h2>
        <p className="text-white/80 text-base mb-10 max-w-xl mx-auto">
          Join thousands of NU Lipa alumni who have already created their digital legacy.
        </p>
        <Link
          to="/register"
          className="bg-[#fdb813] text-[#1d2b4b] font-black px-10 py-4 rounded-xl no-underline text-base hover:brightness-95 transition inline-block"
        >
          Get Started — It's Free
        </Link>
      </section>

      <Footer />
    </div>
  );
}