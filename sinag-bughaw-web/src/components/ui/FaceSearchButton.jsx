import { useRef } from 'react';

export default function FaceSearchButton({
  onFile,
  loading = false,
  style: styleProp = {},
}) {
  const fileRef = useRef(null);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) onFile(file);
    e.target.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleChange} />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        title="Search by face"
        style={{
          position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
          width: 32, height: 32, borderRadius: 8,
          border: '1.5px solid rgba(253,184,19,0.5)',
          background: 'rgba(253,184,19,0.12)',
          color: '#fdb813', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, transition: 'all 0.18s', flexShrink: 0,
          opacity: loading ? 0.6 : 1,
          zIndex: 2,
          ...styleProp,
        }}
        onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = 'rgba(253,184,19,0.28)'; e.currentTarget.style.borderColor = '#fdb813'; }}}
        onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = 'rgba(253,184,19,0.12)'; e.currentTarget.style.borderColor = 'rgba(253,184,19,0.5)'; }}}
      >
        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-camera'}`} style={{ fontSize: 12 }} />
      </button>
    </>
  );
}