/**
 * yearbook.routes.jsx
 * src/routes/yearbook.routes.jsx
 *
 * Add these routes inside your existing router.
 * Import and nest them inside your authenticated route group.
 *
 * Example (inside src/routes/index.jsx):
 *
 *   import yearbookRoutes from './yearbook.routes';
 *
 *   <Routes>
 *     <Route element={<PrivateRoute />}>
 *       {yearbookRoutes}
 *       ...existing routes...
 *     </Route>
 *   </Routes>
 */
import React, { lazy, Suspense } from 'react';
import { Route } from 'react-router-dom';

const YearbookHomePage    = lazy(() => import('../features/yearbook/pages/YearbookHomePage'));
const FlipbookViewerPage  = lazy(() => import('../features/yearbook/pages/FlipbookViewerPage'));

const Fallback = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0a0a14',
    }}
  >
    <div
      style={{
        width: 32, height: 32,
        border: '2px solid rgba(201,168,76,.15)',
        borderTop: '2px solid #c9a84c',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const yearbookRoutes = (
  <>
    {/* Yearbook home / generator — /yearbook or /yearbook/:batchId */}
    <Route
      path="/yearbook"
      element={<Suspense fallback={<Fallback />}><YearbookHomePage /></Suspense>}
    />
    <Route
      path="/yearbook/:batchId"
      element={<Suspense fallback={<Fallback />}><YearbookHomePage /></Suspense>}
    />

    {/* Flipbook viewer — /yearbook/:batchId/view */}
    <Route
      path="/yearbook/:batchId/view"
      element={<Suspense fallback={<Fallback />}><FlipbookViewerPage /></Suspense>}
    />
  </>
);

export default yearbookRoutes;