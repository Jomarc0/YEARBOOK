import { useState } from 'react';

export default function FacultyCard({ faculty, accentColor = '#fdb813', index = 0 }) {
  const [imgError, setImgError] = useState(false);

  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(faculty.name)}&background=1d2b4b&color=fdb813&bold=true&size=300`;
  const src = (!faculty.image_url || imgError) ? avatarUrl : faculty.image_url;

  return (
    <article
      className="faculty-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Top accent bar */}
      <div className="card-accent" style={{ background: accentColor }} />

      {/* Avatar */}
      <div className="card-avatar-wrap">
        <div className="card-avatar">
          <img
            src={src}
            alt={faculty.name}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      </div>

      {/* Info */}
      <div className="card-body">
        <span className="card-position" style={{ color: accentColor }}>
          {faculty.position}
        </span>
        <h3 className="card-name">{faculty.name}</h3>

        {faculty.bio && (
          <p className="card-bio">"{faculty.bio}"</p>
        )}

        {faculty.email && (
          <a
            href={`mailto:${faculty.email}`}
            className="card-email"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            {faculty.email}
          </a>
        )}
      </div>
    </article>
  );
}