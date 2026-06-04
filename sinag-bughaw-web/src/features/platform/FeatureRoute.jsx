import { Navigate } from 'react-router-dom';
import { useAppConfig } from './AppConfigProvider';

export default function FeatureRoute({ features, children }) {
  const { loading, isOn } = useAppConfig();
  const required = Array.isArray(features) ? features : [features];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading…</p>
      </div>
    );
  }

  const enabled = required.every((key) => isOn(key));

  if (!enabled) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
