/**
 * Geo-based language routing for csv-editor.format-portal.com
 *
 * Rules
 *  1. ?setlang=ja|en  -> remembers the choice in a cookie and redirects (used by the header switch)
 *  2. crawlers        -> never redirected (each language keeps its own indexable URL)
 *  3. returning users -> follow the remembered cookie
 *  4. first visit      -> Japan => Japanese, everywhere else => English
 */

const ONE_YEAR = 60 * 60 * 24 * 365;
const CRAWLER = /bot|crawler|spider|slurp|googlebot|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|twitterbot|linkedinbot|embedly|pinterest/i;

const langPath = (lang) => (lang === 'en' ? '/en/' : '/');

export default function middleware(request) {
  const url = new URL(request.url);

  // 1. explicit switch — always wins and is remembered
  const setlang = url.searchParams.get('setlang');
  if (setlang === 'ja' || setlang === 'en') {
    const res = Response.redirect(new URL(langPath(setlang), url.origin), 307);
    res.headers.append(
      'Set-Cookie',
      `lang=${setlang}; Path=/; Max-Age=${ONE_YEAR}; SameSite=Lax`
    );
    return res;
  }

  // 2. never auto-redirect crawlers
  const ua = request.headers.get('user-agent') || '';
  if (CRAWLER.test(ua)) return;

  // 3. remembered choice from the cookie
  const cookieHeader = request.headers.get('cookie') || '';
  const remembered = (cookieHeader.match(/(?:^|;\s*)lang=(ja|en)/) || [])[1];
  if (remembered) {
    const want = langPath(remembered);
    if (url.pathname !== want) return Response.redirect(new URL(want, url.origin), 307);
    return;
  }

  // 4. first visit — infer from IP country (set by Vercel's edge network)
  const country = (request.headers.get('x-vercel-ip-country') || '').toUpperCase();
  if (!country) return; // unknown geo: keep the default (Japanese)

  const want = langPath(country === 'JP' ? 'ja' : 'en');
  if (url.pathname !== want) return Response.redirect(new URL(want, url.origin), 307);
}

export const config = {
  matcher: ['/', '/en/'],
};
