import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import api from '@/api/client';

const listFromPayload = (payload) => {
  const raw = payload?.data?.data ?? payload?.data ?? [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
};

const formatDate = (value) => {
  if (!value) return 'Latest';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Latest';
  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
};

const categoryInfo = (item) => {
  const raw = String(item?.category ?? item?.type ?? item?.tag ?? 'General').toLowerCase();
  const text = `${item?.title ?? item?.headline ?? ''} ${item?.body ?? item?.message ?? item?.content ?? item?.description ?? ''}`;
  if (/\b(graduation|commencement|baccalaureate)\b/i.test(text)) return { key: 'graduation', label: 'Graduation', cls: 'bg-[#fdb813]/15 text-[#b77905] border-[#fdb813]/30' };
  if (raw.includes('graduat')) return { key: 'graduation', label: 'Graduation', cls: 'bg-[#fdb813]/15 text-[#b77905] border-[#fdb813]/30' };
  if (raw.includes('urgent')) return { key: 'urgent', label: 'Urgent', cls: 'bg-red-50 text-red-600 border-red-200' };
  return { key: 'general', label: 'General', cls: 'bg-blue-50 text-blue-600 border-blue-200' };
};

const isUnread = (item) => item?.is_read === false || item?.read === false || item?.unread === true;

export default function AnnouncementsPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    let active = true;
    api.get('/announcements')
      .then((payload) => {
        if (active) setItems(listFromPayload(payload));
      })
      .catch((requestError) => {
        if (active) setError(requestError?.response?.data?.message || 'Unable to load announcements.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const announcements = useMemo(() => {
    return [...items].sort((a, b) => {
      const left = new Date(a?.published_at || a?.created_at || 0).getTime();
      const right = new Date(b?.published_at || b?.created_at || 0).getTime();
      return right - left;
    });
  }, [items]);

  const visibleAnnouncements = useMemo(() => {
    if (activeCategory === 'all') return announcements;
    return announcements.filter(item => categoryInfo(item).key === activeCategory);
  }, [activeCategory, announcements]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f7fe] text-[#1d2b4b]">
      <Navbar />
      <main className="max-w-5xl mx-auto w-full flex-1 px-4 py-10">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-[#fdb813]">Campus Updates</p>
          <h1 className="text-4xl font-black mt-2">Announcements</h1>
          <p className="text-slate-500 mt-2">Official student updates from Sinag-Bughaw.</p>
        </div>

        <div className="mb-6 flex flex-nowrap gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[
            { key: 'all', label: 'All' },
            { key: 'graduation', label: 'Graduation' },
            { key: 'general', label: 'General' },
            { key: 'urgent', label: 'Urgent' },
          ].map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveCategory(tab.key)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black transition ${activeCategory === tab.key ? 'border-[#1d2b4b] bg-[#1d2b4b] text-white' : 'border-slate-200 bg-white text-slate-500 hover:border-[#fdb813]/60 hover:text-[#1d2b4b]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <div className="w-10 h-10 rounded-full border-4 border-indigo-100 border-t-[#1d2b4b] mx-auto animate-spin" />
          </div>
        ) : visibleAnnouncements.length ? (
          <div className="space-y-4">
            {visibleAnnouncements.map((item, index) => {
              const info = categoryInfo(item);
              const unread = isUnread(item);
              return (
              <article key={item?.id || index} className="relative bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                {unread && <span className="absolute left-3 top-6 h-2.5 w-2.5 rounded-full bg-blue-500" />}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#1d2b4b] text-[#fdb813] flex items-center justify-center shrink-0">
                    <i className="fas fa-bullhorn" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${info.cls}`}>
                        {info.label}
                      </span>
                      <p className={`text-xs font-bold mt-1 ${unread ? 'text-[#1d2b4b]' : 'text-slate-400'}`}>
                        {formatDate(item?.published_at || item?.created_at)} - {item?.audience || item?.recipient_type || 'Students'}
                      </p>
                    </div>
                    <h2 className={`text-lg ${unread ? 'font-black' : 'font-extrabold'}`}>{item?.title || item?.headline || 'Announcement'}</h2>
                    {(item?.body || item?.message || item?.content || item?.description) && (
                      <p className="text-sm leading-6 text-slate-600 mt-4 whitespace-pre-line">
                        {item?.body || item?.message || item?.content || item?.description}
                      </p>
                    )}
                  </div>
                  <i className="fas fa-chevron-right mt-4 text-xs text-slate-300" />
                </div>
              </article>
            );})}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
            <i className="fas fa-bullhorn text-4xl text-slate-300" />
            <h2 className="text-xl font-black mt-4">No announcements yet</h2>
            <p className="text-slate-500 mt-2">{error || 'There are no student announcements to show.'}</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
