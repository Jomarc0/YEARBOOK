// sinag-bughaw-web/src/features/yearbook/pages/FlipbookPage.jsx

// Interactive Digital Yearbook PageFlip Integration
// Integrates with existing auth, routing, and yearbook API infrastructure.

import React, {
    useRef, useState, useEffect, useCallback, useMemo
} from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useParams, useNavigate } from 'react-router-dom';
import { useFlipbook, useYearbookPdfDownload } from '../hooks/useFlipbook';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Icons (inline SVGs no extra deps)
const Icon = {
    ChevLeft:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M15 18l-6-6 6-6"/></svg>,
    ChevRight: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M9 18l6-6-6-6"/></svg>,
    Menu:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
    Download:  () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
    ZoomIn:    () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M11 8v6M8 11h6"/></svg>,
    ZoomOut:   () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35M8 11h6"/></svg>,
    Close:     () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12"/></svg>,
    Book:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z"/></svg>,
    User:      () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    ArrowBack: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M19 12H5M12 5l-7 7 7 7"/></svg>,
};

// Palette
const C = {
    navy:   '#1a1a2e',
    indigo: '#302b63',
    gold:   '#c9a84c',
    goldL:  '#e8c96a',
    paper:  '#faf7f2',
    parchm: '#f0ead8',
    ink:    '#2c2c3e',
    muted:  '#8a8a9a',
    white:  '#ffffff',
};


// PAGE COMPONENTS


// Cover Page
const CoverPage = React.forwardRef(({ school, batchYear }, ref) => (
    <div ref={ref} style={{
        width: '100%', height: '100%',
        background: `linear-gradient(145deg, ${C.navy} 0%, ${C.indigo} 55%, #24243e 100%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', userSelect: 'none',
    }}>
        {/* Decorative rings */}
        {[220, 310, 420].map(s => (
            <div key={s} style={{
                position: 'absolute', width: s, height: s, borderRadius: '50%',
                border: `1px solid rgba(201,168,76,0.08)`, pointerEvents: 'none',
            }}/>
        ))}
        {/* Logo */}
        {school?.logo && (
            <img src={school.logo} alt="logo" style={{
                width: 72, height: 72, objectFit: 'contain',
                marginBottom: 16, filter: 'brightness(1.1)',
            }}/>
        )}
        <div style={{ fontSize: 11, letterSpacing: 6, color: C.gold, textTransform: 'uppercase', marginBottom: 10 }}>
            {school?.name}
        </div>
        <div style={{ fontSize: 42, fontWeight: 900, color: C.white, letterSpacing: 2, lineHeight: 1, fontFamily: 'Georgia, serif' }}>
            SINAG BUGHAW
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', letterSpacing: 4, margin: '10px 0 20px' }}>
            Digital Yearbook
        </div>
        <div style={{
            fontSize: 22, fontWeight: 700, color: C.gold, letterSpacing: 8,
            borderTop: `1px solid rgba(201,168,76,0.35)`,
            borderBottom: `1px solid rgba(201,168,76,0.35)`,
            padding: '8px 28px',
        }}>{batchYear}</div>
        {/* Bottom ornament */}
        <div style={{
            position: 'absolute', bottom: 0, width: '100%', height: 60,
            background: 'linear-gradient(90deg,transparent,rgba(201,168,76,0.1),transparent)',
        }}/>
    </div>
));
CoverPage.displayName = 'CoverPage';

// Section Divider Page
const DividerPage = React.forwardRef(({ label, title, subtitle, index }, ref) => (
    <div ref={ref} style={{
        width: '100%', height: '100%',
        background: C.paper,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', userSelect: 'none',
    }}>
        {/* Big ghost number */}
        <div style={{
            position: 'absolute', fontSize: 180, fontWeight: 900,
            color: 'rgba(26,26,46,0.04)', userSelect: 'none',
            fontFamily: 'Georgia, serif',
        }}>{String(index + 1).padStart(2, '0')}</div>
        <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontSize: 9, letterSpacing: 6, color: C.gold, textTransform: 'uppercase', marginBottom: 10 }}>
                {label}
            </div>
            <div style={{ width: 48, height: 2, background: C.gold, margin: '0 auto 12px' }}/>
            <div style={{ fontSize: 36, fontWeight: 900, color: C.ink, fontFamily: 'Georgia, serif', marginBottom: 8 }}>
                {title}
            </div>
            <div style={{ fontSize: 11, color: C.muted, letterSpacing: 2 }}>{subtitle}</div>
        </div>
    </div>
));
DividerPage.displayName = 'DividerPage';

// Faculty Grid Page
const FacultyPage = React.forwardRef(({ faculty, pageNum, schoolName }, ref) => (
    <div ref={ref} style={{
        width: '100%', height: '100%',
        background: C.paper,
        padding: '22px 24px 28px',
        position: 'relative', overflow: 'hidden', userSelect: 'none',
        fontFamily: 'Georgia, serif',
    }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 4, height: 22, background: C.gold, borderRadius: 2 }}/>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>Faculty</div>
            <div style={{ fontSize: 8, color: C.muted, letterSpacing: 2, textTransform: 'uppercase', marginLeft: 4 }}>
                {schoolName}
            </div>
        </div>
        {/* Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            {faculty.map((f, i) => (
                <div key={i} style={{ width: 80, textAlign: 'center' }}>
                    {f.photo
                        ? <img src={f.photo} alt={f.name} style={{
                            width: 60, height: 72, objectFit: 'cover',
                            borderRadius: 4, border: `2px solid #e8e0d0`,
                            display: 'block', margin: '0 auto 5px',
                          }}/>
                        : <div style={{
                            width: 60, height: 72, borderRadius: 4,
                            background: `linear-gradient(135deg,${C.parchm},#d5cfc5)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 5px',
                          }}>
                            <span style={{ color: C.muted, opacity: 0.6 }}>
                                <Icon.User/>
                            </span>
                          </div>
                    }
                    <div style={{ fontSize: 7, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{f.name}</div>
                    <div style={{ fontSize: 6, color: C.gold, marginTop: 2 }}>{f.department}</div>
                </div>
            ))}
        </div>
        <PageNum num={pageNum}/>
    </div>
));
FacultyPage.displayName = 'FacultyPage';

// Student Grid Page
const StudentPage = React.forwardRef(({ students, sectionName, batchYear, pageNum }, ref) => (
    <div ref={ref} style={{
        width: '100%', height: '100%',
        background: C.paper,
        position: 'relative', overflow: 'hidden', userSelect: 'none',
        fontFamily: 'Georgia, serif',
    }}>
        {/* Section strip */}
        <div style={{
            background: `linear-gradient(90deg, ${C.navy}, ${C.indigo})`,
            color: C.white, padding: '7px 20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2 }}>{sectionName}</span>
            <span style={{ fontSize: 7, color: C.gold }}>{batchYear}</span>
        </div>
        {/* Students */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '12px 16px' }}>
            {students.map((s, i) => (
                <div key={i} style={{ width: 64, textAlign: 'center' }}>
                    {s.photo
                        ? <img src={s.photo} alt={s.name} style={{
                            width: 52, height: 62, objectFit: 'cover',
                            borderRadius: 3, border: `1.5px solid #e8e0d0`,
                            display: 'block', margin: '0 auto 4px',
                          }}/>
                        : <div style={{
                            width: 52, height: 62, borderRadius: 3,
                            background: `linear-gradient(135deg,${C.parchm},#d5cfc5)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 4px',
                          }}>
                            <span style={{ opacity: 0.4, color: C.muted, fontSize: 20 }}>
                                <Icon.User/>
                            </span>
                          </div>
                    }
                    <div style={{ fontSize: 6, fontWeight: 700, color: C.ink, lineHeight: 1.3 }}>{s.name}</div>
                    <div style={{ fontSize: 5.5, color: C.muted }}>{s.student_id}</div>
                </div>
            ))}
        </div>
        <PageNum num={pageNum}/>
    </div>
));
StudentPage.displayName = 'StudentPage';

// Closing Page
const ClosingPage = React.forwardRef(({ school, batchYear, pageNum }, ref) => (
    <div ref={ref} style={{
        width: '100%', height: '100%',
        background: `linear-gradient(145deg, ${C.navy} 0%, ${C.indigo} 60%, #24243e 100%)`,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', userSelect: 'none',
    }}>
        <div style={{
            fontSize: 15, fontStyle: 'italic', color: 'rgba(255,255,255,0.75)',
            textAlign: 'center', maxWidth: 320, lineHeight: 1.7,
            marginBottom: 24, fontFamily: 'Georgia, serif',
        }}>
            <span style={{ color: C.gold, fontSize: 22 }}>"</span>
            The tassel was worth the hassle. Carry your memories forward.
            <span style={{ color: C.gold, fontSize: 22 }}>"</span>
        </div>
        <div style={{ fontSize: 9, letterSpacing: 5, color: C.gold, textTransform: 'uppercase', marginBottom: 6 }}>
            {school?.name}
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: C.white, fontFamily: 'Georgia, serif', letterSpacing: 3 }}>
            Class of {batchYear}
        </div>
        <div style={{ position: 'absolute', bottom: 14, color: 'rgba(255,255,255,0.25)', fontSize: 9 }}>
            {pageNum}
        </div>
    </div>
));
ClosingPage.displayName = 'ClosingPage';

// Page Number stamp
const PageNum = ({ num }) => (
    <div style={{
        position: 'absolute', bottom: 10, width: '100%',
        textAlign: 'center', fontSize: 8, color: C.muted, pointerEvents: 'none',
    }}>{num}</div>
);


// MAIN FLIPBOOK PAGE

export default function FlipbookPage() {
    const { batchId }          = useParams();
    const navigate             = useNavigate();
    const { user }             = useAuth();
    const bookRef              = useRef(null);
    const containerRef         = useRef(null);

    const { data, loading, error } = useFlipbook(batchId);
    const { download, downloading, progress } = useYearbookPdfDownload();
    const canDownloadPdf = Boolean(
        user?.is_subscribed ||
        user?.is_premium ||
        user?.tier === 'standard' ||
        user?.tier === 'premium' ||
        user?.subscription?.status === 'active' ||
        user?.subscription?.tier === 'standard' ||
        user?.subscription?.tier === 'premium'
    );

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages,  setTotalPages]  = useState(0);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [zoom,        setZoom]        = useState(1);
    const [isMobile,    setIsMobile]    = useState(window.innerWidth < 768);

    // Responsive
    useEffect(() => {
        const handler = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, []);

    // Build page manifest from API data
    const pages = useMemo(() => {
        if (!data) return [];
        const list = [];

        // 0 Cover
        list.push({ type: 'cover' });

        // 1 Faculty divider
        list.push({ type: 'divider', label: 'Our Mentors', title: 'Faculty', subtitle: 'The guides behind every graduate', index: 0 });

        // Faculty grid pages (7 per page)
        const fChunks = chunkArray(data.faculty ?? [], 7);
        fChunks.forEach(chunk => list.push({ type: 'faculty', faculty: chunk }));

        // Sections
        (data.sections ?? []).forEach((section, sIdx) => {
            list.push({ type: 'divider', label: `Class of ${data.batch?.year}`, title: section.name, subtitle: `${section.students?.length ?? 0} Graduates`, index: sIdx + 1 });
            const sChunks = chunkArray(section.students ?? [], 9);
            sChunks.forEach(chunk => list.push({ type: 'students', students: chunk, sectionName: section.name }));
        });

        // Last Closing
        list.push({ type: 'closing' });

        return list;
    }, [data]);

    useEffect(() => { setTotalPages(pages.length); }, [pages]);

    // TOC entries for sidebar
    const toc = useMemo(() => {
        if (!pages.length) return [];
        const entries = [{ label: 'Cover', pageIdx: 0 }];
        pages.forEach((p, idx) => {
            if (p.type === 'divider') entries.push({ label: p.title, pageIdx: idx });
        });
        entries.push({ label: 'Closing', pageIdx: pages.length - 1 });
        return entries;
    }, [pages]);

    // Navigation
    const goTo = useCallback((idx) => {
        bookRef.current?.pageFlip()?.turnToPage(idx);
        setSidebarOpen(false);
    }, []);

    const prev = useCallback(() => bookRef.current?.pageFlip()?.flipPrev(), []);
    const next = useCallback(() => bookRef.current?.pageFlip()?.flipNext(), []);

    const onFlip = useCallback((e) => setCurrentPage(e.data), []);

    // Keyboard nav
    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'ArrowRight') next();
            if (e.key === 'ArrowLeft')  prev();
            if (e.key === 'Escape')     setSidebarOpen(false);
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [next, prev]);

    // Zoom helpers
    const zoomIn  = () => setZoom(z => Math.min(z + 0.2, 2));
    const zoomOut = () => setZoom(z => Math.max(z - 0.2, 0.5));

    // PDF download
    const handleDownload = async () => {
        if (!canDownloadPdf) return;

        try {
            await download(batchId, data?.batch?.year);
        } catch (e) {
            alert(e.message);
        }
    };

    // Computed book dimensions
    const bookW = isMobile ? Math.floor((window.innerWidth - 32) / 2) : 460;
    const bookH = Math.floor(bookW * 1.38);

    // Loading / error states
    if (loading) return (
        <div style={styles.fullCenter}>
            <div style={styles.spinner}/>
            <p style={{ color: C.muted, marginTop: 16, fontFamily: 'Georgia, serif' }}>Preparing your yearbook…</p>
        </div>
    );

    if (error) return (
        <div style={styles.fullCenter}>
            <p style={{ color: '#e74c3c', marginBottom: 12 }}>{error}</p>
            <button onClick={() => navigate(-1)} style={styles.btnGold}>Go Back</button>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: '#1a1820', position: 'relative', overflow: 'hidden' }}>

            {/* Background texture */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at 50% 30%, rgba(48,43,99,0.5) 0%, transparent 70%)',
            }}/>

            {/* Top bar */}
            <div style={styles.topBar}>
                <button onClick={() => navigate(-1)} style={styles.iconBtn} title="Back">
                    <Icon.ArrowBack/>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon.Book/>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: 14, color: C.white, letterSpacing: 1 }}>
                        {data?.school?.name} · Yearbook {data?.batch?.year}
                    </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={zoomOut}     style={styles.iconBtn} title="Zoom out"><Icon.ZoomOut/></button>
                    <span style={{ color: C.muted, fontSize: 12, alignSelf: 'center', minWidth: 36, textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button onClick={zoomIn}      style={styles.iconBtn} title="Zoom in"><Icon.ZoomIn/></button>
                    <button
                        onClick={handleDownload}
                        style={{
                            ...styles.btnGold,
                            opacity: downloading || !canDownloadPdf ? 0.55 : 1,
                            cursor: downloading || !canDownloadPdf ? 'not-allowed' : 'pointer',
                        }}
                        title={canDownloadPdf ? 'Download PDF' : 'Standard or Premium subscription required'}
                        disabled={downloading || !canDownloadPdf}
                    >
                        <Icon.Download/>
                        <span style={{ fontSize: 12 }}>
                            {canDownloadPdf ? (downloading ? `${progress}%` : 'PDF') : 'Locked'}
                        </span>
                    </button>
                    <button onClick={() => setSidebarOpen(v => !v)} style={styles.iconBtn} title="Table of Contents">
                        <Icon.Menu/>
                    </button>
                </div>
            </div>

            {/* Flipbook area */}
            <div ref={containerRef} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                paddingTop: 72, paddingBottom: 64, minHeight: '100vh',
            }}>
                <div style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center top',
                    transition: 'transform 0.25s ease',
                    filter: 'drop-shadow(0 24px 48px rgba(0,0,0,0.6))',
                }}>
                    <HTMLFlipBook
                        ref={bookRef}
                        width={bookW}
                        height={bookH}
                        size="stretch"
                        minWidth={200}
                        maxWidth={580}
                        minHeight={280}
                        maxHeight={800}
                        maxShadowOpacity={0.6}
                        showCover={true}
                        mobileScrollSupport={true}
                        swipeDistance={20}
                        onFlip={onFlip}
                        className="yearbook-flipbook"
                        style={{ fontFamily: 'Georgia, serif' }}
                        startPage={0}
                        drawShadow={true}
                        flippingTime={700}
                        usePortrait={isMobile}
                        startZIndex={10}
                        autoSize={true}
                        clickEventForward={true}
                        useMouseEvents={true}
                    >
                        {pages.map((page, idx) => {
                            const pageNum = idx + 1;
                            if (page.type === 'cover') {
                                return <CoverPage key={idx} school={data?.school} batchYear={data?.batch?.year}/>;
                            }
                            if (page.type === 'divider') {
                                return <DividerPage key={idx} {...page} />;
                            }
                            if (page.type === 'faculty') {
                                return <FacultyPage key={idx} faculty={page.faculty} pageNum={pageNum} schoolName={data?.school?.name}/>;
                            }
                            if (page.type === 'students') {
                                return <StudentPage key={idx} students={page.students} sectionName={page.sectionName} batchYear={data?.batch?.year} pageNum={pageNum}/>;
                            }
                            if (page.type === 'closing') {
                                return <ClosingPage key={idx} school={data?.school} batchYear={data?.batch?.year} pageNum={pageNum}/>;
                            }
                            return <div key={idx}/>;
                        })}
                    </HTMLFlipBook>
                </div>
            </div>

            {/* Bottom navigation */}
            <div style={styles.bottomNav}>
                <button onClick={prev} style={styles.navBtn} title="Previous page (←)">
                    <Icon.ChevLeft/>
                    <span style={{ fontSize: 11 }}>Prev</span>
                </button>
                <span style={{ color: C.muted, fontSize: 12, fontFamily: 'Georgia, serif' }}>
                    Page {currentPage + 1} of {totalPages}
                </span>
                <button onClick={next} style={styles.navBtn} title="Next page (→)">
                    <span style={{ fontSize: 11 }}>Next</span>
                    <Icon.ChevRight/>
                </button>
            </div>

            {/* Sidebar / TOC */}
            <>
                {/* Backdrop */}
                {sidebarOpen && (
                    <div onClick={() => setSidebarOpen(false)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
                        zIndex: 40, backdropFilter: 'blur(2px)',
                    }}/>
                )}
                <div style={{
                    ...styles.sidebar,
                    transform: sidebarOpen ? 'translateX(0)' : 'translateX(100%)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                        <span style={{ fontFamily: 'Georgia, serif', fontSize: 15, fontWeight: 700, color: C.white }}>
                            Table of Contents
                        </span>
                        <button onClick={() => setSidebarOpen(false)} style={styles.iconBtn}><Icon.Close/></button>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1 }}>
                        {toc.map((entry, i) => (
                            <button key={i} onClick={() => goTo(entry.pageIdx)} style={{
                                ...styles.tocEntry,
                                background: currentPage === entry.pageIdx ? 'rgba(201,168,76,0.15)' : 'transparent',
                                borderLeft: currentPage === entry.pageIdx ? `3px solid ${C.gold}` : '3px solid transparent',
                            }}>
                                <span style={{ fontSize: 13, color: currentPage === entry.pageIdx ? C.gold : C.white }}>
                                    {entry.label}
                                </span>
                                <span style={{ fontSize: 10, color: C.muted }}>p. {entry.pageIdx + 1}</span>
                            </button>
                        ))}
                    </div>
                    {/* Download in sidebar */}
                    <button onClick={handleDownload} disabled={downloading || !canDownloadPdf} title={canDownloadPdf ? 'Download PDF' : 'Standard or Premium subscription required'} style={{
                        ...styles.btnGold, marginTop: 16, width: '100%',
                        justifyContent: 'center', padding: '10px 0',
                        opacity: downloading || !canDownloadPdf ? 0.55 : 1,
                        cursor: downloading || !canDownloadPdf ? 'not-allowed' : 'pointer',
                    }}>
                        <Icon.Download/>
                        <span style={{ fontSize: 13 }}>
                            {downloading ? `Generating… ${progress}%` : 'Download PDF Copy'}
                        </span>
                    </button>
                    {downloading && (
                        <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${progress}%`, background: C.gold, transition: 'width 0.3s ease' }}/>
                        </div>
                    )}
                </div>
            </>
        </div>
    );
}

// Helpers
function chunkArray(arr, size) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
    return chunks;
}

// Styles
const styles = {
    fullCenter: {
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', background: '#1a1820',
        fontFamily: 'Georgia, serif',
    },
    spinner: {
        width: 40, height: 40, borderRadius: '50%',
        border: `3px solid rgba(201,168,76,0.2)`,
        borderTop: `3px solid ${C.gold}`,
        animation: 'spin 0.9s linear infinite',
    },
    topBar: {
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 30,
        height: 56, background: 'rgba(26,24,32,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', gap: 12,
    },
    bottomNav: {
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        height: 52, background: 'rgba(26,24,32,0.9)', backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24,
    },
    iconBtn: {
        background: 'transparent', border: 'none', cursor: 'pointer',
        color: C.white, padding: 6, borderRadius: 8, opacity: 0.8,
        display: 'flex', alignItems: 'center', gap: 6,
        transition: 'opacity 0.15s', width: 32, height: 32,
    },
    navBtn: {
        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
        cursor: 'pointer', color: C.white, padding: '6px 14px',
        borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, transition: 'background 0.15s',
    },
    btnGold: {
        background: C.gold, border: 'none', cursor: 'pointer',
        color: C.navy, padding: '7px 14px', borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700,
        fontSize: 12, transition: 'opacity 0.15s',
    },
    sidebar: {
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 280, zIndex: 50,
        background: 'rgba(22,20,35,0.97)', backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        padding: '18px 16px', display: 'flex', flexDirection: 'column',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
    },
    tocEntry: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        width: '100%', padding: '10px 12px', background: 'transparent',
        border: 'none', cursor: 'pointer', borderRadius: 6,
        marginBottom: 2, transition: 'background 0.15s',
        textAlign: 'left',
    },
};

// Inject spin keyframe once
if (typeof document !== 'undefined' && !document.getElementById('flipbook-spin-style')) {
    const s = document.createElement('style');
    s.id = 'flipbook-spin-style';
    s.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
    document.head.appendChild(s);
}
