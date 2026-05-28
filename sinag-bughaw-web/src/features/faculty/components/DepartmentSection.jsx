import FacultyCard from './FacultyCard';

export default function DepartmentSection({ department, isOnly = false }) {
  const { name, code, color, description, faculty } = department;
  const accent = color ?? '#fdb813';

  return (
    <section className="dept-section">
      {/* Department heading — skip if only one dept visible */}
      {!isOnly && (
        <header className="dept-header">
          <div className="dept-bar" style={{ background: accent }} />
          <div className="dept-meta">
            <div className="dept-title-row">
              <h2 className="dept-name">{name}</h2>
              {code && (
                <span className="dept-code" style={{ background: `${accent}1a`, color: accent }}>
                  {code}
                </span>
              )}
              <span className="dept-count">
                {faculty.length} {faculty.length === 1 ? 'member' : 'members'}
              </span>
            </div>
            {description && (
              <p className="dept-desc">{description}</p>
            )}
          </div>
        </header>
      )}

      {/* Grid */}
      <div className="faculty-grid">
        {faculty.map((f, i) => (
          <FacultyCard
            key={f.id}
            faculty={f}
            accentColor={accent}
            index={i}
          />
        ))}
      </div>
    </section>
  );
}