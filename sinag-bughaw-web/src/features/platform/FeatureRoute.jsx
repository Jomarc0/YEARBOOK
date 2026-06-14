import { Navigate } from 'react-router-dom';
import { useAppConfig } from './AppConfigProvider';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

export default function FeatureRoute({ features, children }) {
  const { loading, isOn } = useAppConfig();
  const required = Array.isArray(features) ? features : [features];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fe] px-4 py-8">
        <div className="mx-auto w-full max-w-3xl">
          <LoadingSkeleton variant="page" count={1} />
        </div>
      </div>
    );
  }

  const enabled = required.every((key) => isOn(key));

  if (!enabled) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
