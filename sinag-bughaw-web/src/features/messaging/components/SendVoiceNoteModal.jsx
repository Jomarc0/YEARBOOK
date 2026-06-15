import { useState } from 'react';
import VoiceRecorder from '@/features/messaging/components/VoiceRecorder';
import { voiceNotesApi } from '@/api/messaging.api';

/**
 * SendVoiceNoteModal
 * Drop this anywhere you want a "Send Voice Memory" button
 * currently used on StudentProfileView.jsx
 *
 * Props:
 * recipient { id, name } of the student being viewed
 * onClose() called when modal should close
 */
export default function SendVoiceNoteModal({ recipient, onClose }) {
  const [title,     setTitle]     = useState('');
  const [step,      setStep]      = useState('record'); // 'record' | 'sending' | 'done' | 'error'
  const [errorMsg,  setErrorMsg]  = useState('');

  const handleSave = async (blob, durationSec) => {
    if (!title.trim()) {
      alert('Please enter a title for your voice memory.');
      return;
    }

    setStep('sending');

    try {
      const formData = new FormData();
      formData.append('audio',            blob, 'recording.webm');
      formData.append('recipient_id',     recipient.id);
      formData.append('title',            title.trim());
      formData.append('duration_seconds', Math.round(durationSec));

      await voiceNotesApi.send(formData);
      setStep('done');
    } catch (err) {
      setErrorMsg(err?.response?.data?.message ?? 'Upload failed. Please try again.');
      setStep('error');
    }
  };

  return (
    // Faux overlay uses min-height so iframe sizes correctly
    <div style={{
      minHeight: '520px',
      background: 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: '#fff', borderRadius: '24px', width: '100%', maxWidth: '480px',
        padding: '32px', fontFamily: "'Plus Jakarta Sans', sans-serif",
        boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <h2 style={{ color: '#1d2b4b', fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
              Send Voice Memory
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0 0' }}>
              To: <span style={{ color: '#1d2b4b', fontWeight: 600 }}>{recipient.name}</span>
              {' '}· Requires admin approval
            </p>
          </div>
          <button onClick={onClose} style={{
            background: '#f1f5f9', border: 'none', borderRadius: '10px',
            width: '36px', height: '36px', cursor: 'pointer', color: '#64748b', fontSize: '1rem',
          }}>✕</button>
        </div>

        {/* Record step */}
        {step === 'record' && (
          <>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`A memory for ${recipient.name}...`}
              style={{
                width: '100%', padding: '13px 16px', border: '2px solid #e2e8f0',
                borderRadius: '12px', fontSize: '0.9rem', fontFamily: 'inherit',
                marginBottom: '16px', boxSizing: 'border-box', outline: 'none', transition: '0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#3f51b5'}
              onBlur={e  => e.target.style.borderColor = '#e2e8f0'}
            />
            <VoiceRecorder onSave={handleSave} maxSeconds={120} />
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', textAlign: 'center', marginTop: '12px' }}>
              Max 2 minutes · Reviewed by admin before delivery
            </p>
          </>
        )}

        {/* Sending step */}
        {step === 'sending' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#3f51b5', marginBottom: '16px', display: 'block' }} />
            <p style={{ color: '#1d2b4b', fontWeight: 700, fontSize: '1rem', margin: 0 }}>Uploading your memory…</p>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '8px' }}>This may take a few seconds</p>
          </div>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <i className="fas fa-check" style={{ fontSize: '1.8rem', color: '#10b981' }} />
            </div>
            <h3 style={{ color: '#1d2b4b', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 8px' }}>
              Voice memory sent!
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 24px', lineHeight: 1.6 }}>
              Your message is now in the admin review queue.<br />
              <strong>{recipient.name}</strong> will be notified once it's approved.
            </p>
            <button onClick={onClose} style={{
              background: '#1d2b4b', color: '#fff', border: 'none', borderRadius: '12px',
              padding: '12px 32px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
            }}>
              Done
            </button>
          </div>
        )}

        {/* Error step */}
        {step === 'error' && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'rgba(239,68,68,0.1)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <i className="fas fa-times" style={{ fontSize: '1.8rem', color: '#ef4444' }} />
            </div>
            <h3 style={{ color: '#1d2b4b', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 8px' }}>
              Something went wrong
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0 0 24px' }}>{errorMsg}</p>
            <button onClick={() => setStep('record')} style={{
              background: '#1d2b4b', color: '#fff', border: 'none', borderRadius: '12px',
              padding: '12px 32px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem',
            }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}