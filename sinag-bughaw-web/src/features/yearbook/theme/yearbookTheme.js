export const yearbookTheme = {
  colors: {
    navy: '#071a33',
    navyDeep: '#031225',
    navySoft: '#102a4c',
    gold: '#c89b3c',
    goldLight: '#e4c36a',
    cream: '#f7f1e6',
    ivory: '#fbf7ef',
    paper: '#fffdf8',
    ink: '#172033',
    mutedInk: '#5f6470',
    line: '#d8c7a2',
    white: '#ffffff',
    charcoal: '#111827',
  },
  typography: {
    display: '"Cormorant Garamond", Georgia, serif',
    serif: '"Libre Baskerville", Georgia, serif',
    sans: 'Inter, Aptos, sans-serif',
    script: '"Great Vibes", "Brush Script MT", cursive',
  },
  spacing: {
    page: 'p-8 md:p-10',
    pageLoose: 'p-10 md:p-12',
    cover: 'p-10 md:p-14',
    gap: 'gap-4',
    gridGap: 'gap-5',
  },
  shadows: {
    paper: 'shadow-[0_16px_45px_rgba(7,26,51,0.10)]',
    portrait: 'shadow-[0_18px_40px_rgba(7,26,51,0.20)]',
    soft: 'shadow-[0_10px_28px_rgba(7,26,51,0.08)]',
  },
  borders: {
    gold: 'border border-[#c89b3c]/70',
    paper: 'border border-[#d8c7a2]/55',
    hairline: 'border border-[#d8c7a2]/35',
  },
};

export const yb = {
  darkPage: 'relative flex h-full w-full overflow-hidden bg-[#071a33] text-[#f7f1e6]',
  paperPage: 'relative flex h-full w-full overflow-hidden bg-[#fbf7ef] text-[#172033]',
  creamPage: 'relative flex h-full w-full overflow-hidden bg-[#f7f1e6] text-[#172033]',
  eyebrow: 'font-sans text-[8px] font-black uppercase tracking-[0.24em] text-[#c89b3c]',
  title: 'font-serif text-[34px] font-bold leading-[0.95] tracking-normal text-[#172033]',
  titleDark: 'font-serif text-[34px] font-bold leading-[0.95] tracking-normal text-[#f7f1e6]',
  body: 'font-serif text-[10px] leading-[1.75] text-[#172033]/75',
  label: 'font-sans text-[7px] font-black uppercase tracking-[0.18em] text-[#c89b3c]',
  rule: 'h-px w-14 bg-[#c89b3c]',
};

export const YEARBOOK_ASSETS = {
  logo: '/images/NU_logo.png',
  building: '/images/NU-building.jpg',
  faculty: '/images/nufaculty.jpg',
  gallery: '/images/gallerynu.jpg',
};
