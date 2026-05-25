export default function Footer() {
  return (
    <footer style={{ background: '#0e1628', padding: '40px 40px 24px', marginTop: 'auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 40, maxWidth: 1400, margin: '0 auto' }}>
        <div>
          <h3 style={{ color: '#fdb813', fontSize: 16, fontWeight: 700, marginBottom: 10, marginTop: 0 }}>NU Lipa</h3>
          <p style={{ color: '#8892b0', fontSize: 12, lineHeight: 1.7, margin: 0 }}>
            Celebrating academic excellence and cherished memories. The official digital yearbook platform of National University Lipa.
          </p>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 12, marginTop: 0, paddingLeft: 12, borderLeft: '3px solid #fdb813' }}>Quick Links</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {['Student Directory', 'Faculty', 'Gallery', 'Sections'].map(l => (
              <li key={l} style={{ color: '#8892b0', fontSize: 12, cursor: 'pointer' }}>{l}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 style={{ color: '#fff', fontSize: 13, fontWeight: 600, marginBottom: 12, marginTop: 0, paddingLeft: 12, borderLeft: '3px solid #fdb813' }}>Contact</h4>
          <p style={{ color: '#8892b0', fontSize: 12, lineHeight: 1.7, margin: 0 }}>Lipa City, Batangas<br />National University Lipa</p>
        </div>
      </div>
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: 28, paddingTop: 20, textAlign: 'center', fontSize: 11, color: '#55607a', maxWidth: 1400, margin: '28px auto 0' }}>
        &copy; 2026 National University Lipa. Sinag-Bughaw Project.
      </div>
    </footer>
  );
}