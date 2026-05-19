import { useEffect, useRef, useState } from 'react';

/**
 * VoiceRecorder — in-browser audio recorder component.
 * Usage:
 *   <VoiceRecorder onSave={(blob, durationSec) => { ... }} />
 *
 * Props:
 *   onSave(blob, duration) — called when user clicks "Use Recording"
 *   maxSeconds            — recording limit in seconds (default 300 = 5 min)
 */
export default function VoiceRecorder({ onSave, maxSeconds = 300 }) {
  const [status,   setStatus]   = useState('idle');   // idle | recording | paused | done
  const [seconds,  setSeconds]  = useState(0);
  const [audioUrl, setAudioUrl] = useState(null);
  const [volume,   setVolume]   = useState(0);        // 0–100 visualizer level

  const mediaRef    = useRef(null);
  const chunksRef   = useRef([]);
  const timerRef    = useRef(null);
  const analyserRef = useRef(null);
  const rafRef      = useRef(null);
  const blobRef     = useRef(null);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Volume visualization loop
  const startViz = (stream) => {
    const ctx     = new AudioContext();
    const src     = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    src.connect(analyser);
    analyserRef.current = analyser;

    const buf = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      analyser.getByteFrequencyData(buf);
      const avg = buf.reduce((a, b) => a + b, 0) / buf.length;
      setVolume(Math.min(100, Math.round(avg * 1.5)));
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  };

  const stopViz = () => {
    cancelAnimationFrame(rafRef.current);
    setVolume(0);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const rec = new MediaRecorder(stream);
      mediaRef.current = rec;

      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        blobRef.current = blob;
        setAudioUrl(URL.createObjectURL(blob));
        setStatus('done');
        stopViz();
        stream.getTracks().forEach(t => t.stop());
      };

      rec.start(250);
      setStatus('recording');
      setSeconds(0);
      startViz(stream);

      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s + 1 >= maxSeconds) { stopRecording(); return s + 1; }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      alert('Microphone access denied. Please allow microphone access and try again.');
    }
  };

  const pauseRecording = () => {
    if (mediaRef.current?.state === 'recording') {
      mediaRef.current.pause();
      setStatus('paused');
      clearInterval(timerRef.current);
      stopViz();
    }
  };

  const resumeRecording = () => {
    if (mediaRef.current?.state === 'paused') {
      mediaRef.current.resume();
      setStatus('recording');
      startViz(mediaRef.current.stream);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    mediaRef.current?.stop();
  };

  const reset = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setStatus('idle');
    setSeconds(0);
    blobRef.current = null;
  };

  const handleSave = () => {
    if (blobRef.current && onSave) onSave(blobRef.current, seconds);
  };

  useEffect(() => () => { clearInterval(timerRef.current); cancelAnimationFrame(rafRef.current); }, []);

  const isRec  = status === 'recording';
  const isPaused = status === 'paused';
  const isDone = status === 'done';

  // Build volume bars (8 bars)
  const bars = Array.from({ length: 8 }, (_, i) => {
    const threshold = (i / 8) * 100;
    return volume >= threshold;
  });

  return (
    <div className="bg-white" style={{ borderRadius: '20px', padding: '28px', border: '1px solid #e2e8f0', boxShadow: '0 8px 25px rgba(0,0,0,0.04)' }}>
      <style>{`@keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }`}</style>

      {/* Timer + Viz */}
      <div className="text-center mb-6">
        <p className="font-extrabold" style={{ fontSize: '2.5rem', letterSpacing: '-2px', color: 'var(--nu-blue)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
          {fmtTime(seconds)}
        </p>
        <p className="text-xs font-semibold mt-1" style={{ color: '#94a3b8' }}>
          {isRec ? 'Recording...' : isPaused ? 'Paused' : isDone ? 'Recording complete' : `Max ${fmtTime(maxSeconds)}`}
        </p>

        {/* Volume bars */}
        <div className="flex items-end justify-center gap-1 mt-4" style={{ height: '28px' }}>
          {bars.map((active, i) => (
            <div key={i} style={{
              width: '6px',
              borderRadius: '3px',
              transition: 'all 0.1s',
              background: active && isRec ? 'var(--nu-blue-bright)' : '#e2e8f0',
              height: `${40 + i * 8}%`,
            }} />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {status === 'idle' && (
          <button onClick={startRecording}
            className="flex items-center gap-2 font-bold border-none cursor-pointer transition-all"
            style={{ padding: '14px 28px', borderRadius: '50px', background: '#dc2626', color: 'white', fontSize: '0.9rem', boxShadow: '0 8px 20px rgba(220,38,38,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; }}>
            <i className="fas fa-microphone" /> Start Recording
          </button>
        )}

        {(isRec || isPaused) && (
          <>
            <button onClick={isRec ? pauseRecording : resumeRecording}
              className="flex items-center justify-center border-none cursor-pointer transition-all"
              style={{ width: '48px', height: '48px', borderRadius: '50%', background: '#f1f5f9', color: 'var(--nu-blue)', fontSize: '1rem' }}
              onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
              onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
              <i className={`fas fa-${isRec ? 'pause' : 'play'}`} />
            </button>

            <button onClick={stopRecording}
              className="flex items-center gap-2 font-bold border-none cursor-pointer transition-all"
              style={{ padding: '14px 28px', borderRadius: '50px', background: 'var(--nu-blue)', color: 'white', fontSize: '0.9rem', animation: isRec ? 'pulse 2s infinite' : 'none' }}>
              <i className="fas fa-stop" /> Stop
            </button>
          </>
        )}

        {isDone && (
          <button onClick={reset}
            className="flex items-center gap-2 font-bold border-none cursor-pointer transition-all"
            style={{ padding: '12px 22px', borderRadius: '50px', background: '#f1f5f9', color: '#64748b', fontSize: '0.85rem' }}
            onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}>
            <i className="fas fa-redo" /> Re-record
          </button>
        )}
      </div>

      {/* Playback + Save */}
      {isDone && audioUrl && (
        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#94a3b8' }}>Preview your recording:</p>
          <audio controls src={audioUrl} className="w-full mb-4" style={{ borderRadius: '8px' }} />
          <button onClick={handleSave}
            className="w-full font-bold text-white border-none cursor-pointer transition-all flex items-center justify-center gap-2"
            style={{ padding: '14px', borderRadius: '14px', background: 'var(--nu-blue)', fontSize: '0.95rem' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--nu-blue-bright)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--nu-blue)'}>
            <i className="fas fa-check-circle" /> Use This Recording
          </button>
        </div>
      )}
    </div>
  );
}