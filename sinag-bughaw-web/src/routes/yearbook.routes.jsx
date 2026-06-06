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
  <div className="flex min-h-screen items-center justify-center bg-[#0a0a14]">
    <div
      className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9a84c]/15 border-t-[#c9a84c]"
      role="status"
      aria-label="Loading"
    />
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
