import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { parse } from 'yaml';
import { sectionIds } from '../src/data/sections.ts';
import { readRecords } from './intake.ts';

/** The Home page and everything it loads, in bytes. */
export const WEIGHT_BUDGET = 150 * 1024;

const SCHEME = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/** A reference that points at a file on this site: not empty, not a fragment or query alone, not another origin. */
const isSameSite = (value: string) => value !== '' && !/^[#?]/.test(value) && !SCHEME.test(value);

function htmlPages(root: string): string[] {
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.html'))
    .map((file) => file.split(sep).join('/'))
    .sort();
}

/** The href and src values in a page that point inside the site. */
function internalReferences(html: string): string[] {
  return [...html.matchAll(/\b(?:href|src)="([^"]*)"/g)].map(([, value]) => value).filter(isSameSite);
}

/** The file a reference points at in the built site, or undefined when nothing is there. */
function target(root: string, page: string, reference: string): string | undefined {
  const encoded = reference.split(/[?#]/)[0];
  let path = encoded;
  try {
    path = decodeURIComponent(encoded);
  } catch {
    // A malformed escape is looked up as written and reported as broken.
  }
  const base = path.startsWith('/') ? join(root, path) : resolve(root, dirname(page), path);
  const candidates = [base, join(base, 'index.html'), `${base}.html`];
  return candidates.find((candidate) => existsSync(candidate) && statSync(candidate).isFile());
}

/** Every internal link in the built site that points at nothing, with the page it is on. */
export function findBrokenLinks(root: string): { page: string; link: string }[] {
  const broken: { page: string; link: string }[] = [];
  for (const page of htmlPages(root)) {
    const html = readFileSync(join(root, page), 'utf8');
    for (const link of internalReferences(html)) {
      if (!target(root, page, link)) broken.push({ page, link });
    }
  }
  return broken.sort((a, b) => a.page.localeCompare(b.page) || a.link.localeCompare(b.link));
}

/** The files the Home page loads: stylesheets, images and scripts. */
function loadedReferences(html: string): string[] {
  const tags = html.match(/<(?:link|img|script)\b[^>]*>/g) ?? [];
  return tags
    .filter((tag) => !tag.startsWith('<link') || /rel="stylesheet"/.test(tag))
    .map((tag) => tag.match(/\b(?:href|src)="([^"]*)"/)?.[1] ?? '')
    .filter((value) => value !== '' && !SCHEME.test(value));
}

/** The same-origin files a stylesheet reads through url(). */
function stylesheetReferences(css: string): string[] {
  return [...css.matchAll(/url\(\s*(['"]?)([^'")]*)\1\s*\)/gi)]
    .map(([, , value]) => value)
    .filter(isSameSite);
}

/** Size of the Home page plus each same-origin file it loads, a file counted once. */
export function homeWeight(root: string): { bytes: number; files: string[] } {
  const html = readFileSync(join(root, 'index.html'));
  const files = new Set<string>();
  const add = (page: string, reference: string) => {
    const file = target(root, page, reference);
    if (file) files.add(relative(root, file).split(sep).join('/'));
  };
  for (const reference of loadedReferences(html.toString('utf8'))) {
    add('index.html', reference);
  }
  for (const stylesheet of [...files].filter((file) => file.endsWith('.css'))) {
    for (const reference of stylesheetReferences(readFileSync(join(root, stylesheet), 'utf8'))) {
      add(stylesheet, reference);
    }
  }
  const bytes = [...files].reduce((total, file) => total + statSync(join(root, file)).size, html.length);
  return { bytes, files: [...files].sort() };
}

/** Hosted page records with no Snapshot folder, and Snapshot folders with no record. */
export function findHostedMismatches(root: string): { path: string; problem: string }[] {
  const records = new Set(readRecords(root).map((record) => record.path));
  const folders = new Set<string>();
  for (const section of sectionIds) {
    const parent = join(root, 'public', section);
    if (!existsSync(parent)) continue;
    for (const page of readdirSync(parent, { withFileTypes: true })) {
      if (page.isDirectory()) folders.add(`${section}/${page.name}`);
    }
  }
  const mismatches = [
    ...[...records]
      .filter((path) => !existsSync(join(root, 'public', path, 'index.html')))
      .map((path) => ({ path, problem: 'the record has no folder with an index.html' })),
    ...[...folders].filter((path) => !records.has(path)).map((path) => ({ path, problem: 'the folder has no record' })),
  ];
  return mismatches.sort((a, b) => a.path.localeCompare(b.path));
}

/** One Cloudflare response-header rule: where it applies, the pages to fetch, and the headers it sets. */
export type HeaderRule = { name: string; expression: string; paths: string[]; headers: Record<string, string> };

/** The rules in the first yaml block of the Cloudflare headers document. */
export function readHeaderRules(markdown: string): HeaderRule[] {
  const block = markdown.match(/```yaml\r?\n([\s\S]*?)```/)?.[1];
  if (block === undefined) throw new Error('No yaml block found in the Cloudflare headers document');
  const rules = (parse(block) as { rules?: HeaderRule[] } | null)?.rules;
  if (!Array.isArray(rules)) throw new Error('The yaml block needs a rules list');
  for (const rule of rules) {
    const name = rule.name ?? '(unnamed)';
    if (!rule.name || !rule.expression) throw new Error(`Rule ${name} needs a name and an expression`);
    if (!Array.isArray(rule.paths) || rule.paths.length === 0) throw new Error(`Rule ${name} needs paths to fetch`);
    if (typeof rule.headers !== 'object' || rule.headers === null) throw new Error(`Rule ${name} needs headers`);
  }
  return rules;
}

/** One request to the live site: no redirects followed, a timeout, and a user agent that names the check. */
const fetchLive = (base: string, path: string, timeoutMs: number) =>
  fetch(new URL(path, base), {
    redirect: 'manual',
    headers: { 'user-agent': 'tmurdianto-com-live-check' },
    signal: AbortSignal.timeout(timeoutMs),
  });

type HeaderMismatch = { path: string; header: string; live: string; documented: string };

/** Fetches each documented path from the live site and lists every header that differs from the rules. */
export async function findHeaderMismatches(
  base: string,
  rules: HeaderRule[],
  timeoutMs = 15_000,
): Promise<HeaderMismatch[]> {
  const mismatches: HeaderMismatch[] = [];
  for (const { paths, headers } of rules) {
    for (const path of paths) {
      let response: Response;
      try {
        response = await fetchLive(base, path, timeoutMs);
        await response.body?.cancel();
      } catch (error) {
        mismatches.push({ path, header: '(request)', live: (error as Error).message, documented: '200' });
        continue;
      }
      if (response.status !== 200) {
        mismatches.push({ path, header: '(status)', live: String(response.status), documented: '200' });
        continue;
      }
      for (const [header, documented] of Object.entries(headers)) {
        const live = response.headers.get(header) ?? '(missing)';
        if (live !== documented) mismatches.push({ path, header, live, documented });
      }
    }
  }
  return mismatches;
}

type AnalyticsMismatch = { path: string; problem: string };

/** Fetches the live Home page and Hosted pages: only the Home page may load the Cloudflare Web Analytics beacon. */
export async function findAnalyticsMismatches(
  base: string,
  homePath: string,
  hostedPaths: string[],
  timeoutMs = 15_000,
): Promise<AnalyticsMismatch[]> {
  const mismatches: AnalyticsMismatch[] = [];
  const read = async (path: string): Promise<string | undefined> => {
    try {
      const response = await fetchLive(base, path, timeoutMs);
      if (response.status === 200) return await response.text();
      await response.body?.cancel();
      mismatches.push({ path, problem: `the page answered ${response.status}` });
    } catch (error) {
      mismatches.push({ path, problem: (error as Error).message });
    }
    return undefined;
  };

  const home = await read(homePath);
  if (home !== undefined) {
    if (!/static\.cloudflareinsights\.com\/beacon\.min\.js/i.test(home)) {
      mismatches.push({ path: homePath, problem: 'the Home page has no Cloudflare Web Analytics beacon' });
    } else if (home.includes('CF_BEACON_TOKEN')) {
      mismatches.push({ path: homePath, problem: 'the Home page beacon still has the placeholder token' });
    }
    // Email obfuscation rewrites mailto links and adds a script that the Home page's policy blocks.
    if (/cdn-cgi\/(?:l\/email-protection|scripts\/[^"']*email-decode)/i.test(home)) {
      mismatches.push({ path: homePath, problem: 'Cloudflare email obfuscation rewrote a link; the policy blocks its script' });
    }
  }
  for (const path of hostedPaths) {
    const body = await read(path);
    if (body !== undefined && /cloudflareinsights/i.test(body)) {
      mismatches.push({ path, problem: 'a Hosted page loads Cloudflare Web Analytics' });
    }
  }
  return mismatches;
}

const kilobytes = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`;

async function main(check: string | undefined, root?: string, documents?: string): Promise<number> {
  if (check === 'links') {
    const broken = findBrokenLinks(root ?? 'dist');
    for (const { page, link } of broken) console.error(`Broken link ${link} on ${page}`);
    if (broken.length === 0) console.log('Links: every internal link resolves');
    return broken.length === 0 ? 0 : 1;
  }
  if (check === 'weight') {
    const { bytes, files } = homeWeight(root ?? 'dist');
    const size = `Home page is ${kilobytes(bytes)} against a budget of ${kilobytes(WEIGHT_BUDGET)} (${files.join(', ') || 'no files'})`;
    if (bytes > WEIGHT_BUDGET) console.error(`Over budget: ${size}`);
    else console.log(`Weight: ${size}`);
    return bytes > WEIGHT_BUDGET ? 1 : 0;
  }
  if (check === 'hosted') {
    const mismatches = findHostedMismatches(root ?? '.');
    for (const { path, problem } of mismatches) console.error(`Hosted page ${path}: ${problem}`);
    if (mismatches.length === 0) console.log('Hosted pages: every record matches a folder');
    return mismatches.length === 0 ? 0 : 1;
  }
  if (check === 'headers') {
    const rules = readHeaderRules(readFileSync(documents ?? 'docs/cloudflare-headers.md', 'utf8'));
    const mismatches = await findHeaderMismatches(root ?? 'https://tmurdianto.com', rules);
    for (const { path, header, live, documented } of mismatches) {
      console.error(`Live header ${path} ${header}: live "${live}", documented "${documented}"`);
    }
    if (mismatches.length === 0) console.log('Headers: the live site matches the documented rules');
    return mismatches.length === 0 ? 0 : 1;
  }
  if (check === 'analytics') {
    const rules = readHeaderRules(readFileSync(documents ?? 'docs/cloudflare-headers.md', 'utf8'));
    const homePath = rules.find((rule) => rule.name === 'owned-pages')?.paths[0] ?? '/';
    const hostedPaths = rules.find((rule) => rule.name === 'hosted-pages')?.paths ?? [];
    const mismatches = await findAnalyticsMismatches(root ?? 'https://tmurdianto.com', homePath, hostedPaths);
    for (const { path, problem } of mismatches) console.error(`Live analytics ${path}: ${problem}`);
    if (mismatches.length === 0) console.log('Analytics: only the Home page loads Cloudflare Web Analytics');
    return mismatches.length === 0 ? 0 : 1;
  }
  console.error(
    'Usage: node scripts/check-site.ts links|weight [built-site-folder] | hosted [site-folder] | headers|analytics [live-url] [rules-document]',
  );
  return 2;
}

if (import.meta.main) process.exit(await main(process.argv[2], process.argv[3], process.argv[4]));
