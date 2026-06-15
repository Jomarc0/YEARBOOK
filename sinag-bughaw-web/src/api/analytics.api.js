// src/api/analytics.api.js
// All analytics-related API calls. Uses your existing Axios client instance.

import client from './client';

const BASE = '/analytics';

/**
 * Platform-wide summary counts (public).
 * @returns {{ total_students, total_photos, total_messages, total_tagged }}
 */
export const getSummary = () =>
  client.get(`${BASE}/summary`).then((r) => r.data);

/**
 * Top-viewed alumni by all-time profile views (public).
 * @param {number} limit - max results (1 50, default 10)
 * @returns {{ data: AlumniRecord[] }}
 */
export const getTopViewed = (limit = 10) =>
  client.get(`${BASE}/top-viewed`, { params: { limit } }).then((r) => r.data);

/**
 * Trending alumni most views in the last 7 days (public).
 * @param {number} limit - max results (1 50, default 10)
 * @returns {{ data: TrendingRecord[] }}
 */
export const getTrending = (limit = 10) =>
  client.get(`${BASE}/trending`, { params: { limit } }).then((r) => r.data);

/**
 * Personal stats for the logged-in student (auth required).
 * @returns {{ profile_views, photos_uploaded, times_tagged, messages_sent, messages_received }}
 */
export const getMyStats = () =>
  client.get(`${BASE}/my-stats`).then((r) => r.data);

/**
 * Daily view counts for the logged-in student's profile (auth required).
 * @param {number} days - lookback window (7 90, default 30)
 * @returns {{ data: Record<string, number> }}  e.g. { "2024-05-01": 4, "2024-05-02": 7 }
 */
export const getMyStatsTrend = (days = 30) =>
  client.get(`${BASE}/my-stats/trend`, { params: { days } }).then((r) => r.data);

/**
 * Top-viewed batchmates of the logged-in student (auth required).
 * @returns {{ batch_id, top_profiles: BatchmateRecord[] }}
 */
export const getBatchmates = () =>
  client.get(`${BASE}/batchmates`).then((r) => r.data);

/**
 * Platform-wide engagement overview (admin only).
 * @returns {{ views_today, views_this_week, views_this_month, unique_viewers_today }}
 */
export const getPlatformEngagement = () =>
  client.get('/admin/analytics/engagement').then((r) => r.data);

/**
 * Record a profile view. Call this when any StudentProfileView page mounts.
 * Works for guests (no token) and authenticated users.
 * @param {number} userId - the profile being viewed
 */
export const recordProfileView = (userId) =>
  client.post(`${BASE}/record-view/${userId}`).then((r) => r.data);

const trimText = (value, max) => {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text ? text.slice(0, max) : undefined;
};

export const recordContentView = (payload = {}) => {
  const contentId = Number(payload.content_id);
  const contentType = trimText(payload.content_type, 40);

  if (!contentType || !Number.isInteger(contentId) || contentId < 1) {
    return Promise.resolve({ recorded: false, skipped: true });
  }

  return client.post(`${BASE}/record-content-view`, {
    content_type: contentType,
    content_id: contentId,
    title: trimText(payload.title, 255),
    category: trimText(payload.category, 60),
    url: trimText(payload.url, 255),
  }).then((r) => r.data);
};

// JSDoc type stubs

/**
 * @typedef {Object} AlumniRecord
 * @property {number} id
 * @property {string} name
 * @property {string} profile_picture
 * @property {string} course
 * @property {string} batch
 * @property {number} graduation_year
 * @property {number} views
 */

/**
 * @typedef {Object} TrendingRecord
 * @property {number} id
 * @property {string} name
 * @property {string} profile_picture
 * @property {string} course
 * @property {string} batch
 * @property {number} graduation_year
 * @property {number} views_this_week
 * @property {number} total_views
 */

/**
 * @typedef {Object} BatchmateRecord
 * @property {number} id
 * @property {string} name
 * @property {string} profile_picture
 * @property {string} course
 * @property {number} views
 */
