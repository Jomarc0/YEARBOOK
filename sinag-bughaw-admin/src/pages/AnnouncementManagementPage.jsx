import { useEffect, useState, useCallback } from 'react';
import { announcementsApi } from '@/api/yearbook.api';

// ── Constants ──────────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  event:       { bg: '#eef2ff', color: '#3f51b5', icon: 'fa-calendar',    label: 'Event'       },
  reminder:    { bg: '#fffbeb', color: '#d97706', icon: 'fa-bell',        label: 'Reminder'    },
  urgent:      { bg: '#fef2f2', color: '#dc2626', icon: 'fa-exclamation', label: 'Urgent'      },
  information: { bg: '#ecfdf5', color: '#059669', icon: 'fa-info-circle', label: 'Information' },
};

const EMPTY_FORM = {
  title:        '',
  body:         '',
  type:         'information',
  send_email:   true,
  send_push:    true,
  action_url:   '',
  action_label: '',
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function TypeButton({ value, active, onClick }) {
  const cfg = TYPE_CONFIG[value];
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      style={{
        padding: '9px 14px',
        borderRadius: '12px',
        border: `2px solid ${active ? cfg.color : 'transparent'}`,
        background: active ? cfg.bg : 'rgba(0,0,0,0.03)',
        color: active ? cfg.color : '#94a3b8',
        fontWeight: 700,
        fontSize: '12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        transition: 'all .2s',
      }}
    >
      <i className={`fas ${cfg.icon}`} style={{ fontSize: '13px' }} />
      {cfg.label}
    </button>
  );
}

function Toggle({ checked, onChange, label, icon }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', padding: '8px 0' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#475569', fontWeight: 600 }}>
        <i className={`fas ${icon}`} style={{ color: '#94a3b8', fontSize: '15px', width: '18px', textAlign: 'center' }} />
        {label}
      </span>
      <div style={{ position: 'relative', width: '42px', height: '24px' }}>
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }} />
        <div style={{
          width: '42px', height: '24px', borderRadius: '12px',
          background: checked ? '#1d2b4b' : '#e2e8f0',
          transition: 'background .2s',
        }} />
        <div style={{
          position: 'absolute', top: '3px',
          left: checked ? '21px' : '3px',
          width: '18px', height: '18px',
          background: '#fff', borderRadius: '50%',
          transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.15)',
        }} />
      </div>
    </label>
  );
}

function AnnouncementRow({ ann, onDelete }) {
  const cfg = TYPE_CONFIG[ann.type] ?? TYPE_CONFIG.information;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '14px',
      padding: '14px 16px', background: '#fff',
      borderRadius: '14px', border: '1px solid rgba(0,0,0,0.04)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: cfg.bg, color: cfg.color, fontSize: '14px',
      }}>
        <i className={`fas ${cfg.icon}`} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700, fontSize: '13px', color: '#1e293b', marginBottom: '3px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {ann.title}
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span>
            <i className="fas fa-calendar" style={{ marginRight: '4px' }} />
            {new Date(ann.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span style={{
            background: cfg.bg, color: cfg.color,
            fontWeight: 700, fontSize: '10px', padding: '2px 8px', borderRadius: '20px',
          }}>
            {cfg.label}
          </span>
          {ann.send_push && (
            <span style={{ color: '#3f51b5' }}>
              <i className="fas fa-bell" style={{ marginRight: '3px' }} />Push
            </span>
          )}
        </div>
      </div>

      <button
        onClick={() => onDelete(ann.id)}
        style={{
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: '#ef4444', padding: '4px 6px', borderRadius: '8px', fontSize: '13px',
          flexShrink: 0, opacity: .7, transition: 'opacity .2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = 1}
        onMouseLeave={e => e.currentTarget.style.opacity = .7}
        title="Delete"
      >
        <i className="fas fa-trash" />
      </button>
    </div>
  );
}

function StatCard({ icon, value, label, color = '#1d2b4b' }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '16px', padding: '18px',
      textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
      border: '1px solid rgba(0,0,0,0.04)',
    }}>
      <i className={`fas ${icon}`} style={{ fontSize: '20px', color, marginBottom: '8px', display: 'block' }} />
      <div style={{ fontSize: '24px', fontWeight: 900, color: '#1e293b' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AnnouncementManagementPage({ showToast }) {
  const [form,           setForm]           = useState(EMPTY_FORM);
  const [items,          setItems]          = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [submitting,     setSubmitting]     = useState(false);
  const [filterType,     setFilterType]     = useState('all');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [recipientCount, setRecipientCount] = useState(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAnnouncements = useCallback(() => {
    setLoading(true);
    announcementsApi.list()
      .then(({ data }) => setItems(data.data ?? data))
      .catch(() => showToast?.('Failed to load announcements.', 'error'))
      .finally(() => setLoading(false));
  }, [showToast]);

  const fetchRecipientCount = useCallback(() => {
    announcementsApi.recipientCount?.()
      .then(({ data }) => setRecipientCount(data.count ?? data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAnnouncements();
    fetchRecipientCount();
  }, [fetchAnnouncements, fetchRecipientCount]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const filtered = items.filter(a => {
    const matchType  = filterType === 'all' || a.type === filterType;
    const matchQuery = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchQuery;
  });

  const stats = {
    total:    items.length,
    events:   items.filter(a => a.type === 'event').length,
    urgent:   items.filter(a => a.type === 'urgent').length,
    pushSent: items.filter(a => a.send_push).length,
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const setField = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.title.trim()) return showToast?.('Title is required.', 'error');
    if (!form.body.trim())  return showToast?.('Message body is required.', 'error');

    setSubmitting(true);
    try {
      await announcementsApi.create({
        title:        form.title.trim(),
        body:         form.body.trim(),
        type:         form.type,
        send_push:    form.send_push,
        send_email:   form.send_email,
        action_url:   form.action_url.trim()   || null,
        action_label: form.action_label.trim() || null,
      });
      showToast?.('Announcement published! Emails are being sent.', 'success');
      setForm(EMPTY_FORM);
      fetchAnnouncements();
    } catch (e) {
      showToast?.(e?.response?.data?.message ?? 'Failed to publish announcement.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await announcementsApi.delete(id);
      setItems(prev => prev.filter(a => a.id !== id));
      showToast?.('Announcement deleted.', 'success');
    } catch {
      showToast?.('Failed to delete announcement.', 'error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
        .ann-fade  { animation: fadeIn .3s ease forwards; }
        .ann-input { width:100%; background:rgba(0,0,0,0.025); border:1.5px solid #e2e8f0; border-radius:12px; padding:11px 14px; font-size:14px; color:#1e293b; font-family:inherit; transition:border-color .2s; outline:none; }
        .ann-input:focus { border-color:#3f51b5; }
      `}</style>

      {/* ── Top Bar ── */}
      <header style={{
        background: 'linear-gradient(135deg, #1d2b4b 0%, #2e3f7a 100%)',
        padding: '22px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '12px',
            background: 'rgba(253,184,19,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <i className="fas fa-bullhorn" style={{ color: '#fdb813', fontSize: '18px' }} />
          </div>
          <div>
            <h1 style={{ color: '#fff', fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
              Announcement Management
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', margin: 0 }}>
              Sinag-Bughaw · NU Lipa Admin
            </p>
          </div>
        </div>
        {recipientCount > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.08)', borderRadius: '12px', padding: '8px 16px',
            color: 'rgba(255,255,255,0.8)', fontSize: '13px', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <i className="fas fa-users" style={{ color: '#fdb813' }} />
            {recipientCount.toLocaleString()} enrolled students
          </div>
        )}
      </header>

      <div style={{ padding: '28px 32px', maxWidth: '1280px', margin: '0 auto' }}>

        {/* ── Stats Row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
          <StatCard icon="fa-bullhorn"    value={stats.total}    label="Total"     color="#3f51b5" />
          <StatCard icon="fa-calendar"    value={stats.events}   label="Events"    color="#3f51b5" />
          <StatCard icon="fa-exclamation" value={stats.urgent}   label="Urgent"    color="#dc2626" />
          <StatCard icon="fa-bell"        value={stats.pushSent} label="Push Sent" color="#059669" />
        </div>

        {/* ── Main Grid ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: '24px', alignItems: 'flex-start' }}>

          {/* ── LEFT — Compose ── */}
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '28px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
          }}>
            <h2 style={{
              fontSize: '15px', fontWeight: 800, color: '#1d2b4b', marginBottom: '22px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <i className="fas fa-pen-to-square" style={{ color: '#3f51b5' }} />
              Compose Announcement
            </h2>

            {/* Title */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Title *
              </label>
              <input
                className="ann-input"
                placeholder="e.g. Graduation Photo Submission Deadline"
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                maxLength={255}
              />
            </div>

            {/* Type */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Type *
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {Object.keys(TYPE_CONFIG).map(t => (
                  <TypeButton key={t} value={t} active={form.type === t} onClick={v => setField('type', v)} />
                ))}
              </div>
            </div>

            {/* Body */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                Message *
              </label>
              <textarea
                className="ann-input"
                placeholder="Write the full announcement message here…"
                value={form.body}
                onChange={e => setField('body', e.target.value)}
                rows={5}
                style={{ resize: 'vertical', lineHeight: 1.7 }}
              />
            </div>

            {/* Optional link */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  Action URL <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <input
                  className="ann-input"
                  placeholder="https://…"
                  value={form.action_url}
                  onChange={e => setField('action_url', e.target.value)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                  Button Label <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span>
                </label>
                <input
                  className="ann-input"
                  placeholder="Learn More"
                  value={form.action_label}
                  onChange={e => setField('action_label', e.target.value)}
                />
              </div>
            </div>

            {/* Delivery toggles */}
            <div style={{
              background: '#f8fafc', borderRadius: '14px', padding: '16px 18px', marginBottom: '24px',
              border: '1px solid #e2e8f0',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                Delivery Channels
              </p>
              <Toggle
                checked={form.send_email}
                onChange={v => setField('send_email', v)}
                label="Send email to all students"
                icon="fa-envelope"
              />
              <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
              <Toggle
                checked={form.send_push}
                onChange={v => setField('send_push', v)}
                label="Send push notification"
                icon="fa-bell"
              />
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                width: '100%', padding: '14px', borderRadius: '14px', border: 'none',
                background: submitting
                  ? '#94a3b8'
                  : 'linear-gradient(135deg, #1d2b4b, #3f51b5)',
                color: '#fff', fontWeight: 800, fontSize: '14px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                letterSpacing: '.3px', transition: 'opacity .2s',
              }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: '16px', height: '16px', borderRadius: '50%',
                    border: '2px solid rgba(255,255,255,.3)',
                    borderTopColor: '#fff', animation: 'spin 0.7s linear infinite',
                  }} />
                  Sending…
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" />
                  Publish &amp; Send Announcement
                </>
              )}
            </button>
          </div>

          {/* ── RIGHT — List ── */}
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '24px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.04)',
          }}>
            <h2 style={{
              fontSize: '15px', fontWeight: 800, color: '#1d2b4b', margin: '0 0 18px',
              display: 'flex', alignItems: 'center', gap: '10px',
            }}>
              <i className="fas fa-list" style={{ color: '#3f51b5' }} />
              All Announcements
              <span style={{
                marginLeft: 'auto', background: '#eef2ff', color: '#3f51b5',
                fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
              }}>
                {items.length}
              </span>
            </h2>

            {/* Search */}
            <div style={{ position: 'relative', marginBottom: '12px' }}>
              <i className="fas fa-search" style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                color: '#94a3b8', fontSize: '13px', pointerEvents: 'none',
              }} />
              <input
                className="ann-input"
                placeholder="Search announcements…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '34px' }}
              />
            </div>

            {/* Filter chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {['all', ...Object.keys(TYPE_CONFIG)].map(t => {
                const cfg      = TYPE_CONFIG[t];
                const isActive = filterType === t;
                return (
                  <button key={t} onClick={() => setFilterType(t)}
                    style={{
                      padding: '5px 12px', borderRadius: '20px', border: 'none', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 700, textTransform: 'capitalize',
                      background: isActive ? (cfg?.bg ?? '#eef2ff') : '#f1f5f9',
                      color:      isActive ? (cfg?.color ?? '#3f51b5') : '#94a3b8',
                      transition: 'all .15s',
                    }}>
                    {t === 'all' ? 'All' : cfg.label}
                  </button>
                );
              })}
            </div>

            {/* List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '520px', overflowY: 'auto' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    border: '3px solid #e2e8f0', borderTopColor: '#3f51b5',
                    animation: 'spin 0.7s linear infinite', margin: '0 auto 12px',
                  }} />
                  Loading…
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                  <i className="fas fa-bell-slash" style={{ fontSize: '32px', display: 'block', marginBottom: '10px', opacity: .3 }} />
                  No announcements found
                </div>
              ) : (
                filtered.map(ann => (
                  <div key={ann.id} className="ann-fade">
                    <AnnouncementRow ann={ann} onDelete={handleDelete} />
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}