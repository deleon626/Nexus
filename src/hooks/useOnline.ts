import { useEffect, useState, useCallback, useRef } from 'react';

// Heartbeat endpoint configuration
const HEARTBEAT_INTERVAL = 30000; // 30 seconds (Claude's discretion)
const HEARTBEAT_TIMEOUT = 5000; // 5 second timeout for ping

export function useOnline() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isReachable, setIsReachable] = useState(true);
  const heartbeatIntervalRef = useRef<number | null>(null);

  // Heartbeat ping to check actual connectivity (not just network interface)
  const heartbeat = useCallback(async () => {
    try {
      // Ping a lightweight endpoint with cache busting
      // Using Convex health endpoint or a simple fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT);

      // Fetch with cache busting to avoid cached responses
      await fetch(`/health?_=${Date.now()}`, {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      setIsReachable(true);
      setIsOnline(true);
    } catch (error) {
      // Heartbeat failed — might be offline or server unreachable
      setIsReachable(false);
      // Don't immediately set offline — could be temporary blip
      // navigator.onLine event will handle actual offline state
    }
  }, []);

  // Start/stop heartbeat based on navigator.onLine
  useEffect(() => {
    if (!navigator.onLine) {
      // Definitely offline — stop heartbeat
      setIsOnline(false);
      setIsReachable(false);
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    // Online — start heartbeat
    heartbeat(); // Immediate check
    heartbeatIntervalRef.current = window.setInterval(heartbeat, HEARTBEAT_INTERVAL);

    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
    };
  }, [heartbeat]);

  // Listen for browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      heartbeat(); // Immediate ping when browser reports online
    };

    const handleOffline = () => {
      setIsOnline(false);
      setIsReachable(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [heartbeat]);

  // Combine navigator.onLine with heartbeat reachability
  const effectivelyOnline = isOnline && isReachable;

  return {
    isOnline: effectivelyOnline,
    isReachable,
    navigatorOnLine: navigator.onLine,
  };
}
