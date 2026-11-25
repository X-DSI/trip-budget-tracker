/**
 * Hand a text file to the person: the share sheet on phones that can share files (Save to Files,
 * WhatsApp, Drive…), otherwise a normal download. Works offline; nothing leaves the device unless
 * they choose a destination.
 */
export async function saveTextFile(name: string, text: string, type: string): Promise<void> {
  const file = new File([text], name, { type });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  if (coarse && nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: name });
      return;
    } catch (error) {
      // They closed the share sheet: that's a choice, not a failure.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      // Anything else: fall back to a download below.
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** "goa-trip-expenses-2026-12-07.csv" */
export function csvFileName(tripName: string, today: string): string {
  const slug =
    tripName
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'trip';
  return `${slug}-expenses-${today}.csv`;
}
