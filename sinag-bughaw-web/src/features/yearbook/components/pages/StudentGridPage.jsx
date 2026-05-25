/**
 * StudentGridPage.jsx
 * src/features/yearbook/components/pages/StudentGridPage.jsx
 *
 * Left page: 4-portrait grid with name + section.
 * Right page handled by StudentQuotePage.
 */
import React from 'react';
import { pageBase, GOLD, DARK, CREAM, OFFWHITE, avatarColor, initials, pnumStyle, tagStyle, headingStyle } from './pageStyles';

export default function StudentGridPage({ page }) {
  const { students = [], section = {}, pageNum, side } = page;
  const bg = side === 'left' ? CREAM : OFFWHITE;

  return (
    <div style={pageBase(bg)}>
      <div style={tagStyle}>{section.name}</div>
      <div style={{ ...headingStyle, fontSize: 18, marginBottom: 14 }}>
        Senior<br />Portraits
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
        flex: 1,
      }}>
        {students.map((s) => <StudentCard key={s.id} student={s} />)}

        {/* Empty placeholders so grid always shows 4 slots */}
        {Array.from({ length: Math.max(0, 4 - students.length) }).map((_, i) => (
          <div
            key={`empty-${i}`}
            style={{
              background: 'rgba(0,0,0,.02)',
              border: '0.5px dashed #e0d8c8',
              borderRadius: 6,
            }}
          />
        ))}
      </div>

      <div style={pnumStyle(side === 'right')}>— {pageNum} —</div>
    </div>
  );
}

function StudentCard({ student }) {
  const c = avatarColor(student.student_id);

  return (
    <div style={{
      background: '#fff',
      border: '0.5px solid #ece5d4',
      borderRadius: 7,
      padding: '11px 8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
      gap: 4,
    }}>
      {student.profile_picture ? (
        <img
          src={student.profile_picture}
          alt={student.name}
          style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 52, height: 52,
          borderRadius: '50%',
          background: c.bg,
          color: c.tc,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Cormorant Garamond, Georgia, serif',
          fontSize: 16,
          fontWeight: 700,
          flexShrink: 0,
        }}>
          {initials(student.name)}
        </div>
      )}

      <div style={{ fontSize: 10, fontWeight: 600, color: DARK, lineHeight: 1.2, marginTop: 2 }}>
        {student.name}
      </div>

      <div style={{ fontSize: 8.5, color: '#aaa', lineHeight: 1.3 }}>
        {student.section?.name ?? student.course}
      </div>

      {student.student_id && (
        <div style={{ fontSize: 7.5, color: '#ccc', letterSpacing: '0.08em' }}>
          {student.student_id}
        </div>
      )}
    </div>
  );
}