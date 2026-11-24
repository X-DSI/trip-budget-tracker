// Find Indian phone numbers in free text, so they can be tapped to call.
//
// Matches only:
// - mobiles: 10 digits starting 6–9, optionally after +91, 91 or 0, with spaces or hyphens
//   between groups (98765 43210, +91-98765-43210, 098765 43210);
// - landlines: 0 + STD code + number, 11 digits in all (080-2345 6789, 0423 2444444).
// Never inside a longer run of digits, after a PNR label, or in amounts and dates (which have
// commas, slashes or too few digits).

export type TextPart = { text: string } | { phone: string; href: string };

const PHONE =
  /(?<![\d\w])(?:(?:\+91|91)[\s-]?[6-9]\d{4}[\s-]?\d{5}|0?[6-9]\d{4}[\s-]?\d{5}|0\d{2,4}[\s-]?\d{3,4}[\s-]?\d{3,4})(?![\d\w])/g;

function digits(s: string): string {
  return s.replace(/\D/g, '');
}

/** The tel: number in +91 form, or null when the match isn't a real phone-number shape. */
function toTel(raw: string): string | null {
  const d = digits(raw);
  if (d.length === 12 && d.startsWith('91') && /^[6-9]/.test(d.slice(2))) return `+${d}`;
  if (d.length === 11 && d.startsWith('0')) return `+91${d.slice(1)}`; // 0 + mobile or landline
  if (d.length === 10 && /^[6-9]/.test(d)) return `+91${d}`;
  return null;
}

// India's emergency short codes, linked only right after a word that says what they are
// ("Ambulance: 108", "police 100"), so a stray "108" elsewhere stays plain text.
const EMERGENCY =
  /(?<=\b(?:ambulance|police|fire|emergency|helpline|women\s+helpline)\b[\s:–-]*)(?:100|101|102|108|112|1091)(?![\d\w])/gi;

export function splitPhones(text: string): TextPart[] {
  const matches = [
    ...[...text.matchAll(PHONE)].map((m) => {
      const start = m.index ?? 0;
      const before = text.slice(Math.max(0, start - 8), start);
      return { start, raw: m[0], tel: /PNR[\s:#.-]*$/i.test(before) ? null : toTel(m[0]) };
    }),
    ...[...text.matchAll(EMERGENCY)].map((m) => ({ start: m.index ?? 0, raw: m[0], tel: m[0] })),
  ].sort((a, b) => a.start - b.start);

  const parts: TextPart[] = [];
  let last = 0;
  for (const { start, raw, tel } of matches) {
    if (!tel || start < last) continue;
    if (start > last) parts.push({ text: text.slice(last, start) });
    parts.push({ phone: raw, href: `tel:${tel}` });
    last = start + raw.length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}
