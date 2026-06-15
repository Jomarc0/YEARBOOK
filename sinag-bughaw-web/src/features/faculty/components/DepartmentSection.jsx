import FacultyCard from './FacultyCard';

export default function DepartmentSection({ department, isOnly = false }) {
  const { name, code, description, faculty } = department;

  return (
    <section className="mb-10">
      {/* Department heading skip if only one dept visible */}
      {!isOnly && (
        <header className="mb-5 flex items-start gap-4 border-b border-slate-200 pb-4">
          <div className="mt-1 h-10 w-1 rounded-full bg-[#fdb813]" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-xl font-black text-[#1d2b4b]">{name}</h2>
              {code && (
                <span className="rounded-full bg-[#fdb813]/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#b77905]">
                  {code}
                </span>
              )}
              <span className="ml-auto text-xs font-bold text-slate-400">
                {faculty.length} {faculty.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            {description && (
              <p className="m-0 mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
        </header>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {faculty.map((f) => (
          <FacultyCard
            key={f.id}
            faculty={f}
          />
        ))}
      </div>
    </section>
  );
}
