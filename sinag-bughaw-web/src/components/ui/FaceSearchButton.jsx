import { useRef } from 'react';

export default function FaceSearchButton({
  onFile,
  loading = false,
  className = '',
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
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        title="Search by face"
        className={`absolute right-3 top-1/2 z-[2] flex h-8 w-8 -translate-y-1/2 shrink-0 items-center justify-center rounded-lg border border-[#fdb813]/50 bg-[#fdb813]/10 text-[#fdb813] transition hover:border-[#fdb813] hover:bg-[#fdb813]/25 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-camera'} text-xs`} />
      </button>
    </>
  );
}
