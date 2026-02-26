import { useState, useEffect } from 'react';
import { useOnline } from '../../hooks/useOnline';

export default function OfflineBanner() {
  const { isOnline } = useOnline();
  const [isDismissed, setIsDismissed] = useState(false);

  // Reset dismissed state when coming back online
  useEffect(() => {
    if (isOnline) {
      setIsDismissed(false);
    }
  }, [isOnline]);

  // Don't show if online or dismissed
  if (isOnline || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-white px-4 py-2">
      <div className="container mx-auto flex items-center justify-between">
        <p className="text-sm font-medium">
          You're offline. Some features may be limited.
        </p>
        <button
          onClick={() => setIsDismissed(true)}
          className="ml-4 text-sm underline hover:no-underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
