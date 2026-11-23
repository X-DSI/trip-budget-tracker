import { useRegisterSW } from 'virtual:pwa-register/react';

/**
 * Registers the service worker. A new version is never swapped in silently: people tap Reload
 * when it suits them, so a half-entered expense isn't lost.
 */
export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;

  return (
    <div
      role="status"
      data-testid="sw-toast"
      className="fixed inset-x-4 bottom-24 z-30 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg lg:bottom-6"
    >
      <span className="flex-1">
        {needRefresh ? 'A new version is ready.' : 'Ready to work offline.'}
      </span>
      {needRefresh && (
        <button
          type="button"
          onClick={() => void updateServiceWorker(true)}
          className="rounded-lg bg-teal-500 px-3 py-1.5 font-medium text-slate-950"
        >
          Reload
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setOfflineReady(false);
          setNeedRefresh(false);
        }}
        className="rounded-lg px-2 py-1.5 text-slate-300 hover:text-white"
      >
        {needRefresh ? 'Later' : 'OK'}
      </button>
    </div>
  );
}
