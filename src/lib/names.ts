/** First word of a display name, for greetings. */
export function firstName(displayName: string | null | undefined): string {
  const first = (displayName ?? '').trim().split(/\s+/)[0];
  return first || 'there';
}
