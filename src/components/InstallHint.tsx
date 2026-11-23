import { useState } from 'react';
import { currentPlatform, shouldShowInstallHint } from '../lib/platform';
import { readFlag, writeFlag } from '../lib/storage';
import { ShareIcon } from './Icons';

const DISMISSED_KEY = 'tbt.installHintDismissed';

/** iPhone Safari only: explain "Add to Home Screen", which iOS never prompts for itself. */
export function InstallHint() {
  const [visible, setVisible] = useState(
    () => shouldShowInstallHint(currentPlatform()) && !readFlag(DISMISSED_KEY),
  );
  if (!visible) return null;

  return (
    <div
      data-testid="install-hint"
      className="mb-4 flex items-start gap-3 rounded-2xl bg-teal-50 p-4 text-sm text-teal-900 ring-1 ring-teal-200"
    >
      <ShareIcon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="flex-1">
        Install the app so it works with no signal: tap <strong>Share</strong>, then{' '}
        <strong>Add to Home Screen</strong>.
      </p>
      <button
        type="button"
        className="font-medium text-teal-700"
        onClick={() => {
          writeFlag(DISMISSED_KEY, true);
          setVisible(false);
        }}
      >
        Got it
      </button>
    </div>
  );
}
