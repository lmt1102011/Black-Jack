import { useCallback, useEffect, useRef, useState } from 'react';

const currentVersion = import.meta.env.VITE_APP_VERSION || 'dev';
const versionUrl = `${import.meta.env.BASE_URL || '/'}version.json`;

export function useAutoUpdate({ canReloadAutomatically }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const reloadingRef = useRef(false);

  const reloadNow = useCallback(() => {
    reloadingRef.current = true;
    window.location.reload();
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (reloadingRef.current) return;

    try {
      const response = await fetch(`${versionUrl}?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          Accept: 'application/json'
        }
      });

      if (!response.ok) return;
      const manifest = await response.json();
      const nextVersion = manifest.version || manifest.sha;

      if (!nextVersion || nextVersion === currentVersion) return;

      setUpdateInfo({
        version: nextVersion,
        builtAt: manifest.builtAt
      });

      if (canReloadAutomatically) {
        reloadNow();
      }
    } catch {
      // Ignore transient network errors; the next poll will try again.
    }
  }, [canReloadAutomatically, reloadNow]);

  useEffect(() => {
    const firstCheck = setTimeout(checkForUpdate, 10_000);
    const interval = setInterval(checkForUpdate, 60_000);

    function checkWhenVisible() {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    }

    document.addEventListener('visibilitychange', checkWhenVisible);
    window.addEventListener('focus', checkForUpdate);

    return () => {
      clearTimeout(firstCheck);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', checkWhenVisible);
      window.removeEventListener('focus', checkForUpdate);
    };
  }, [checkForUpdate]);

  useEffect(() => {
    if (updateInfo && canReloadAutomatically) {
      reloadNow();
    }
  }, [canReloadAutomatically, reloadNow, updateInfo]);

  return {
    currentVersion,
    updateInfo,
    reloadNow
  };
}
