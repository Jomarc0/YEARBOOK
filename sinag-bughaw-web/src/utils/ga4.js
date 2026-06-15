// src/utils/ga4.js

// Lightweight GA4 helper using the free gtag.js snippet.

// SETUP (do this once in index.html or main.jsx):

// index.html head snippet
//   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
//   <script>
// window.dataLayer initialization
//     function gtag(){ dataLayer.push(arguments); }
// gtag bootstrap call
//     gtag('config', 'G-XXXXXXXXXX');
//   </script>

//   Replace G-XXXXXXXXXX with your GA4 Measurement ID (free, from analytics.google.com).


const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID ?? '';

/**
 * Internal: safely call gtag if it exists in window.
 */
function gtag(...args) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

// Page tracking

/**
 * Send a manual page_view event.
 * GA4 auto-tracks page_view on full reloads, but SPAs need this on route change.
 *
 * Usage: call inside a useEffect that watches location.pathname.
 *
 * @param {string} path   - e.g. '/analytics'
 * @param {string} title  - document.title value
 */
export function trackPageView(path, title) {
  gtag('event', 'page_view', {
    page_path:     path,
    page_title:    title,
    send_to:       GA_ID,
  });
}

// Profile view tracking

/**
 * Fire a custom `profile_view` GA4 event when a student profile is opened.
 * Also shows up under Events profile_view in your GA4 dashboard.
 *
 * @param {{ id: number, name: string, course: string, batch: string }} profile
 */
export function trackProfileView(profile) {
  gtag('event', 'profile_view', {
    profile_id:    profile.id,
    profile_name:  profile.name,
    course:        profile.course,
    batch:         profile.batch,
    send_to:       GA_ID,
  });
}

// Analytics dashboard interaction tracking

/**
 * Track when a user clicks on a trending alumni card.
 *
 * @param {{ id: number, name: string, views_this_week: number }} alumni
 */
export function trackTrendingClick(alumni) {
  gtag('event', 'trending_alumni_click', {
    alumni_id:       alumni.id,
    alumni_name:     alumni.name,
    views_this_week: alumni.views_this_week,
    send_to:         GA_ID,
  });
}

/**
 * Track when a user clicks on a top-viewed alumni card.
 *
 * @param {{ id: number, name: string, views: number }} alumni
 */
export function trackTopViewedClick(alumni) {
  gtag('event', 'top_viewed_click', {
    alumni_id:   alumni.id,
    alumni_name: alumni.name,
    total_views: alumni.views,
    send_to:     GA_ID,
  });
}

/**
 * Track tab switches on the analytics page (trending / top-viewed / my stats).
 *
 * @param {'trending'|'top-viewed'|'my-stats'} tab
 */
export function trackAnalyticsTabSwitch(tab) {
  gtag('event', 'analytics_tab_switch', {
    tab_name: tab,
    send_to:  GA_ID,
  });
}