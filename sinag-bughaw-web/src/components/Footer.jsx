export default function Footer() {
  return (
    <footer className="text-white mt-auto" style={{ background: '#0e1628', borderRadius: '80px 80px 0 0', padding: '80px 8% 40px' }}>
      <div className="grid gap-10" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
        <div>
          <h3 className="text-2xl font-extrabold mb-5" style={{ color: 'var(--nu-yellow)' }}>NU Lipa</h3>
          <p className="text-sm leading-relaxed" style={{ color: '#8892b0' }}>
            Celebrating academic excellence and cherished memories. The official digital yearbook platform of National University Lipa.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 pl-5 border-l-4" style={{ borderColor: 'var(--nu-yellow)' }}>Quick Links</h4>
          <ul className="list-none space-y-3">
            {['Student Directory','Faculty','Gallery','Sections'].map(l => (
              <li key={l} className="text-sm cursor-pointer transition-all" style={{ color: '#8892b0' }}>{l}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 pl-5 border-l-4" style={{ borderColor: 'var(--nu-yellow)' }}>Contact</h4>
          <p className="text-sm" style={{ color: '#8892b0' }}>Lipa City, Batangas<br/>National University Lipa</p>
        </div>
      </div>
      <div className="border-t mt-10 pt-8 text-center text-xs" style={{ borderColor: 'rgba(255,255,255,0.05)', color: '#55607a' }}>
        &copy; 2026 National University Lipa. Sinag-Bughaw Project.
      </div>
    </footer>
  );
}