// sinag-bughaw-web/src/features/yearbook/pages/YearbookHomePage.jsx
// Extends the existing home page — adds batch cards that open the flipbook,
// and a PDF download shortcut per batch.

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getYearbookBatches } from '../../../api/yearbook.api';
import { useYearbookPdfDownload } from '../hooks/useFlipbook';
import { useAuth } from '@/features/auth/hooks/useAuth';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const C = {
    navy:  '#1a1a2e',
    indigo:'#302b63',
    gold:  '#c9a84c',
    paper: '#faf7f2',
    ink:   '#2c2c3e',
    muted: '#8a8a9a',
    white: '#ffffff',
    bg:    '#f4f1ec',
};

export default function YearbookHomePage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [batches, setBatches]   = useState([]);
    const [loading, setLoading]   = useState(true);
    const { download, downloading } = useYearbookPdfDownload();
    const canDownloadPdf = Boolean(
        user?.is_subscribed ||
        user?.is_premium ||
        user?.tier === 'standard' ||
        user?.tier === 'premium' ||
        user?.subscription?.status === 'active' ||
        user?.subscription?.tier === 'standard' ||
        user?.subscription?.tier === 'premium'
    );

    useEffect(() => {
        getYearbookBatches()
            .then(res => setBatches(res.data?.data ?? res.data ?? []))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    return (
        <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'Georgia, serif' }}>

            {/* Hero */}
            <div style={{
                background: `linear-gradient(135deg, ${C.navy} 0%, ${C.indigo} 100%)`,
                padding: '64px 24px 48px',
                textAlign: 'center',
            }}>
                <div style={{ fontSize: 10, letterSpacing: 6, color: C.gold, textTransform: 'uppercase', marginBottom: 12 }}>
                    Digital Yearbook
                </div>
                <h1 style={{ fontSize: 36, fontWeight: 900, color: C.white, margin: 0, letterSpacing: 1 }}>
                    Sinag Bughaw
                </h1>
                <p style={{ color: 'rgba(255,255,255,0.55)', marginTop: 10, fontSize: 14 }}>
                    Relive your memories. Browse, flip, and download your yearbook.
                </p>
            </div>

            {/* Batch Cards */}
            <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: C.ink, marginBottom: 24 }}>
                    Select a Batch
                </h2>

                {loading ? (
                    <LoadingSkeleton variant="card" count={4} gridClassName="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" />
                ) : batches.length === 0 ? (
                    <p style={{ color: C.muted }}>No batches available yet.</p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
                        {batches.map(batch => (
                            <div key={batch.id} style={{
                                background: C.white,
                                borderRadius: 12,
                                boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
                                overflow: 'hidden',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.14)'; }}
                            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.08)'; }}
                            >
                                {/* Card header */}
                                <div style={{
                                    background: `linear-gradient(135deg, ${C.navy}, ${C.indigo})`,
                                    padding: '28px 20px 20px',
                                    textAlign: 'center',
                                }}>
                                    <div style={{ fontSize: 32, fontWeight: 900, color: C.gold, letterSpacing: 3 }}>
                                        {batch.year ?? batch.name}
                                    </div>
                                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 2, marginTop: 4 }}>
                                        {batch.name ?? `Batch ${batch.year}`}
                                    </div>
                                </div>

                                {/* Card body */}
                                <div style={{ padding: '16px 16px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <button
                                        onClick={() => navigate(`/yearbook/${batch.id}/view`)}
                                        style={{
                                            background: C.navy, color: C.white,
                                            border: 'none', borderRadius: 8, padding: '9px 0',
                                            fontWeight: 700, fontSize: 13, cursor: 'pointer',
                                            width: '100%', letterSpacing: 0.5,
                                            fontFamily: 'Georgia, serif',
                                        }}
                                    >
                                        📖 Open Flipbook
                                    </button>
                                    <button
                                        onClick={() => canDownloadPdf && download(batch.id, batch.year ?? batch.name)}
                                        disabled={downloading || !canDownloadPdf}
                                        title={canDownloadPdf ? 'Download PDF' : 'Standard or Premium subscription required'}
                                        style={{
                                            background: 'transparent', color: C.gold,
                                            border: `1.5px solid ${C.gold}`, borderRadius: 8,
                                            padding: '8px 0', fontWeight: 700,
                                            fontSize: 12, cursor: downloading || !canDownloadPdf ? 'not-allowed' : 'pointer',
                                            width: '100%', opacity: downloading || !canDownloadPdf ? 0.55 : 1,
                                            fontFamily: 'Georgia, serif',
                                        }}
                                    >
                                        ⬇ Download PDF
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
