/**
 * StudentQuotePage.jsx
 * src/features/yearbook/components/pages/StudentQuotePage.jsx
 *
 * Right-side complement to StudentGridPage.
 * Shows the same 4 students' bios / senior quotes in a vertical strip.
 */
import React from 'react';
import { pageBase, GOLD, DARK, CREAM, OFFWHITE, pnumStyle, tagStyle } from './pageStyles';

export default function StudentQuotePage({ page }) {
  const { students = [], section = {}, pageNum, side } = page;
  const bg = side === 'right' ? OFFWHITE : CREAM;

  return (
    <div style={pageBase(bg)}>
      <div style={tagStyle}>Senior quotes</div>
      <div style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontSize: 18, color: DARK, lineHeight: 1.2, marginBottom: 14,
      }}>
        In Their<br />Own Words
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {students.map((s) => (
          <QuoteRow key={s.id} student={s} />
        ))}
      </div>

      <div style={pnumStyle(side === 'right')}>— {pageNum} —</div>
    </div>
  );
}

function QuoteRow({ student }) {
  const quote = student.bio || student.motto || 'Making every moment count.';

  return (
    <div style={{
      padding: '9px 11px',
      borderLeft: `2px solid ${GOLD}`,
      borderRadius: '0 5px 5px 0',
      background: '#fff',
      boxShadow: '0 1px 3px rgba(0,0,0,.04)',
    }}>
      <div style={{
        fontFamily: 'Cormorant Garamond, Georgia, serif',
        fontStyle: 'italic',
        fontSize: 10.5,
        color: '#333',
        lineHeight: 1.6,
        marginBottom: 4,
      }}>
        "{quote}"
      </div>
      <div style={{
        fontSize: 8.5,
        color: '#aaa',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}>
        <span>—</span>
        <span style={{ fontWeight: 500, color: '#666' }}>{student.name}</span>
        {student.course && (
          <>
            <span style={{ color: '#ddd' }}>·</span>
            <span>{student.course}</span>
          </>
        )}
      </div>
    </div>
  );
}