import { useAppConfig } from '@/features/platform/AppConfigProvider';

export default function MaintenancePage() {
  const { config } = useAppConfig();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-lg text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-600 text-2xl font-black">
          !
        </div>
        <h1 className="text-xl font-extrabold text-slate-800 mb-2">Under maintenance</h1>
        <p className="text-sm text-slate-500 leading-relaxed mb-4">
          {config.yearbook_name} is temporarily unavailable while we perform updates.
          Please check back soon.
        </p>
        {config.contact_email && (
          <p className="text-xs text-slate-400">
            Questions?{' '}
            <a href={`mailto:${config.contact_email}`} className="text-indigo-600 font-semibold">
              {config.contact_email}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
