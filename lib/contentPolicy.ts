/**
 * Blocks explicit / sexual language in user-provided fields (hobby, chat, notes, etc.).
 * Server routes must enforce this; client checks are optional UX hints.
 */

export const USER_DISALLOWED_CONTENT_MESSAGE =
  "That language isn't allowed here. Please remove explicit or sexual content and try again." as const

function normalizeForPolicyScan(raw: string): string {
  return raw
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

/** Built once — unicode-aware case-insensitive matching. */
const DISALLOW_PATTERNS: RegExp[] = [
  /\bporno?(graphy|graphic)?\b/iu,
  /\bxxx\b/iu,
  /\b(nsfw|hentai|rule\s*34|r-?34)\b/iu,
  /\bonlyfans\b/iu,
  /\b(hardcore|softcore)\s*(porn|sex)?\b/iu,
  /\bsex\b/iu,
  /\bsexual(ly|ity)?\b/iu,
  /\bmasturbat/iu,
  /\b(fuck|fucks|fucking|fucked|fucker|motherfucker)\b/iu,
  /\b(cock|dick|penis|phallus|pussy|vagina|cunt|clit|clitoris)\b/iu,
  /\b(tits|boobs|nipples?)\b/iu,
  /\b(blowjob|blow job|handjob|hand job|deepthroat|deep throat)\b/iu,
  /\b(jerk|jacking)\s*off\b/iu,
  /\b(cumshot|cum shot|creampie|cream pie|orgasm|ejacul|bukkake)\b/iu,
  /\bhorny\b/iu,
  /\b(nude|nudes|naked|nudity)\b/iu,
  /\berotic\b/iu,
  /\b(pornstar|camgirl|camwhore)\b/iu,
  /\b(rape|raping|rapist|molest|non-?consensual)\b/iu,
  /\b(pedoph|paedoph|child\s*porn|loli|shota)\b|\bcp\b/iu,
  /\b(prostitut|whore|slut)\b/iu,
  /\b(dildo|vibrator|fleshlight|fetish|bdsm|bondage)\b/iu,
  /\b(suck|sucks|sucking|sucked)\b/iu,
  /\bkissing\b/iu,
  /\b(milf|dilf|threesome|gangbang|facesit)\b/iu,
  /\b(gay|lesbian)\s+(porn|sex)\b/iu,
]

export function getUserContentPolicyViolation(
  text: string | null | undefined
): typeof USER_DISALLOWED_CONTENT_MESSAGE | null {
  if (text == null) return null
  const s = normalizeForPolicyScan(text)
  if (s.length === 0) return null
  for (const re of DISALLOW_PATTERNS) {
    if (re.test(s)) return USER_DISALLOWED_CONTENT_MESSAGE
  }
  return null
}

export function getFirstUserContentPolicyViolation(
  texts: Array<string | null | undefined>
): typeof USER_DISALLOWED_CONTENT_MESSAGE | null {
  for (const t of texts) {
    const v = getUserContentPolicyViolation(t)
    if (v) return v
  }
  return null
}
