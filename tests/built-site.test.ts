import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { WEIGHT_BUDGET, findBrokenLinks, homeWeight, readHeaderRules } from '../scripts/check-site';
import { readRecords } from '../scripts/intake';
import { beaconOrigin, beaconReportOrigin, beaconToken } from '../src/data/analytics';

type Entry = { section: string; order: number; title: string };

const entries: Entry[] = readdirSync('src/content/entries')
  .filter((file) => file.endsWith('.md'))
  .map((file) => parse(readFileSync(`src/content/entries/${file}`, 'utf8').split('---')[1]) as Entry);

// The Home page lists the three Sections under two headings.
const GROUPS = [
  { id: 'work', sections: ['work'] },
  { id: 'writing-and-fun', sections: ['writing', 'fun'] },
];

let home = '';
let notFound = '';

/** The markup of one headed group of Entries on the Home page. */
function group(id: string): string {
  return home.match(new RegExp(`<section[^>]*aria-labelledby="${id}"[\\s\\S]*?</section>`))?.[0] ?? '';
}

/** The visible text of a page, tags removed. */
const textOf = (page: string) => page.replace(/<[^>]+>/g, ' ');

/** A policy as directive name -> its value. */
const directives = (policy: string): Record<string, string> =>
  Object.fromEntries(
    policy
      .split(';')
      .map((directive) => directive.trim())
      .filter(Boolean)
      .map((directive) => {
        const [name, ...values] = directive.split(/\s+/);
        return [name, values.join(' ')];
      }),
  );

/** The content security policy a page sets in its meta tag. */
const metaPolicy = (page: string) => directives(page.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '');

beforeAll(() => {
  execFileSync('npx', ['astro', 'build'], { stdio: 'pipe' });
  home = readFileSync('dist/index.html', 'utf8');
  notFound = readFileSync('dist/404.html', 'utf8');
});

describe('Home page', () => {
  it('opens on the Hero: the portrait first so the text can wrap it, the brand line and one About sentence', () => {
    const hero = home.match(/<header class="hero">[\s\S]*?<\/header>/)?.[0] ?? '';
    expect(hero).toMatch(/<img[^>]*src="\/portrait\.webp"[\s\S]*<h1[^>]*>I build the foundations teams depend on\.<\/h1>/);
    expect(hero).toContain(
      "I've spent 14 years building enterprise systems, and I make the structure that keeps a team's work consistent, whatever the stack.",
    );
    expect(hero.match(/<p[\s>]/g)).toHaveLength(1);
  });

  it('follows the Hero with one intro sentence', () => {
    expect(home).toContain('I make what other people build on:');
  });

  it('lists every Entry under its heading, in order', () => {
    expect(entries.length).toBeGreaterThan(0);
    for (const { id, sections } of GROUPS) {
      const listed = entries.filter((entry) => sections.includes(entry.section)).sort((a, b) => a.order - b.order);
      expect(listed.length, id).toBeGreaterThan(0);
      const markup = group(id);
      let last = -1;
      for (const { title } of listed) {
        const at = markup.indexOf(`>${title}<`);
        expect(at, `${title} in ${id}`).toBeGreaterThan(last);
        last = at;
      }
    }
  });

  it('gives each Entry its own order', () => {
    const orders = entries.map((entry) => entry.order);
    expect(new Set(orders).size).toBe(orders.length);
  });

  it('links the Blog Entry to a post, not to the blog front page', () => {
    const blogLinks = [...group('writing-and-fun').matchAll(/href="(https:\/\/blog\.tmurdianto\.com[^"]*)"/g)].map((match) => match[1]);
    expect(blogLinks).toHaveLength(1);
    expect(blogLinks[0]).toMatch(/^https:\/\/blog\.tmurdianto\.com\/[a-z0-9-]+$/);
  });

  it('ends with a plain contact line, the contact links and the Version line', () => {
    const footer = home.match(/<footer[\s\S]*?<\/footer>/)?.[0] ?? '';
    expect(footer).toContain('You can reach me by email, on LinkedIn, GitHub or GitLab.');
    expect(footer).toContain('href="mailto:');
    for (const host of ['linkedin.com', 'github.com', 'gitlab.com']) expect(footer, host).toContain(host);
    expect(footer).not.toMatch(/Senior Software Engineer/);
    expect(footer).toMatch(/Version [0-9a-f]{7}</);
    expect(footer).not.toContain('Last changed');
  });

  it('has no title block, revision table, section numbers or Entry codes', () => {
    expect(home).not.toMatch(/Drawn by|class="rev"|<table|<figcaption/);
    expect(textOf(home)).not.toMatch(/\b[A-Z]-\d{2}\b|\b0\d\s*\//);
  });
});

describe('Not-found page', () => {
  it('uses the same frame, says nothing is here and links back home', () => {
    expect(notFound).toContain('<title>');
    expect(notFound).toContain('There is nothing at this address.');
    expect(notFound).toMatch(/<a [^>]*href="\/"/);
    expect(notFound).toContain('<footer');
  });

  it('has a main landmark holding the message and the way home, like the Home page', () => {
    const main = notFound.match(/<main[\s\S]*?<\/main>/)?.[0] ?? '';
    expect(main).toContain('There is nothing at this address.');
    expect(main).toMatch(/<a [^>]*href="\/"/);
  });
});

describe('Page head and structure', () => {
  it('is British English with a title, description and link-preview tags', () => {
    expect(home).toContain('<html lang="en-GB"');
    expect(home).toMatch(/<title>[^<]+<\/title>/);
    expect(home).toMatch(/<meta name="description" content="[^"]{20,}"/);
    expect(home).toMatch(/<meta property="og:title" content="[^"]+"/);
    expect(home).toMatch(/<meta property="og:description" content="[^"]+"/);
    expect(home).toContain('<link rel="canonical" href="https://tmurdianto.com/"');
  });

  it('has one h1 and alt text on every image', () => {
    expect(home.match(/<h1[\s>]/g)).toHaveLength(1);
    const images = home.match(/<img\b[^>]*>/g) ?? [];
    expect(images.length).toBeGreaterThan(0);
    for (const image of images) {
      expect(image).toMatch(/alt="[^"]+"/);
    }
  });
});

describe('Creative Toddler, the first Hosted page', () => {
  const page = () => readFileSync('dist/fun/creative-toddler/index.html', 'utf8');

  it('is served at /fun/creative-toddler/ and its Entry links to it', () => {
    expect(page()).toContain('<title>');
    expect(group('writing-and-fun')).toMatch(/<a href="\/fun\/creative-toddler\/"[^>]*>Creative Toddler<\/a>/);
  });

  it('loads its own files by relative paths, so it works under its folder', () => {
    const references = [...page().matchAll(/\b(?:href|src)="([^"]+)"/g)].map(([, value]) => value);
    expect(references.length).toBeGreaterThan(0);
    for (const reference of references) expect(reference, reference).toMatch(/^\.\//);
  });

  it('carries no analytics and loads nothing from another origin', () => {
    expect(page()).not.toMatch(/googletagmanager|google-analytics|gtag|cloudflareinsights/i);
    expect(page()).not.toMatch(/(?:href|src)="(?:https?:)?\/\//i);
  });
});

describe('Documented Cloudflare header rules', () => {
  const rules = readHeaderRules(readFileSync('docs/cloudflare-headers.md', 'utf8'));
  const rule = (name: string) => {
    const found = rules.find((candidate) => candidate.name === name);
    if (!found) throw new Error(`no rule named ${name}`);
    return found;
  };
  const SECURITY_HEADERS = [
    'Content-Security-Policy',
    'Referrer-Policy',
    'X-Content-Type-Options',
    'Permissions-Policy',
    'Strict-Transport-Security',
  ];

  it('fit the free plan: at most 10 rules of 30 headers, each with a name, expression, paths and headers', () => {
    expect(rules.length).toBeGreaterThan(0);
    expect(rules.length).toBeLessThanOrEqual(10);
    for (const { name, expression, paths, headers } of rules) {
      expect(name).toBeTruthy();
      expect(expression, name).toBeTruthy();
      expect(paths.length, name).toBeGreaterThan(0);
      expect(Object.keys(headers).length, name).toBeGreaterThan(0);
      expect(Object.keys(headers).length, name).toBeLessThanOrEqual(30);
    }
  });

  it('set the same security headers on the Home page and on /fun/*', () => {
    for (const name of ['owned-pages', 'hosted-pages']) {
      expect(Object.keys(rule(name).headers).sort(), name).toEqual([...SECURITY_HEADERS].sort());
    }
  });

  it('match on the main host only, split at /fun/', () => {
    for (const name of ['owned-pages', 'hosted-pages']) expect(rule(name).expression, name).toContain('http.host eq "tmurdianto.com"');
    expect(rule('owned-pages').expression).toContain('not starts_with(http.request.uri.path, "/fun/")');
    expect(rule('hosted-pages').expression).toContain('starts_with(http.request.uri.path, "/fun/")');
    expect(rule('hosted-pages').expression).not.toContain('not starts_with');
  });

  it('check the Home page and every recorded Hosted page', () => {
    expect(rule('owned-pages').paths).toContain('/');
    for (const { path } of readRecords('.')) expect(rule('hosted-pages').paths, path).toContain(`/${path}/`);
  });

  it('give /fun/* every directive of each Snapshot policy, deny framing, and allow no other origin', () => {
    const documented = directives(rule('hosted-pages').headers['Content-Security-Policy']);
    expect(documented['default-src']).toBe("'none'");
    expect(documented['frame-ancestors']).toBe("'none'");
    expect(Object.values(documented).join(' ')).not.toMatch(/https?:|\*/);
    for (const { path } of readRecords('.')) {
      const page = readFileSync(`dist/${path}/index.html`, 'utf8');
      const own = directives(page.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1] ?? '');
      expect(Object.keys(own).length, path).toBeGreaterThan(0);
      for (const [name, value] of Object.entries(own)) {
        if (name !== 'default-src') expect(documented[name], `${path} ${name}`).toBe(value);
      }
    }
  });

  it('give the pages this repo builds a policy for their own styles, images and fonts only', () => {
    const documented = directives(rule('owned-pages').headers['Content-Security-Policy']);
    expect(documented['default-src']).toBe("'none'");
    expect(documented['style-src']).toBe("'self'");
    expect(documented['img-src']).toBe("'self'");
    expect(documented['font-src']).toBe("'self'");
    expect(documented['frame-ancestors']).toBe("'none'");
    expect(documented['script-src']).toBe(beaconOrigin);
    expect(documented['connect-src']).toBe(`'self' ${beaconReportOrigin}`);
    expect(Object.values(documented).join(' ').replace(beaconOrigin, '').replace(beaconReportOrigin, '')).not.toMatch(/https?:|\*/);
    expect(home).not.toMatch(/<(?:iframe|object|embed|video|audio|form)\b/i);
    expect(notFound).not.toMatch(/<(?:script|iframe|object|embed|video|audio|form)\b/i);
    const rels = [...home.matchAll(/<link\b[^>]*\brel="([^"]+)"/g)].map(([, rel]) => rel);
    expect(rels.filter((rel) => !['stylesheet', 'canonical'].includes(rel))).toEqual([]);
    for (const [name, page] of [['Home page', home], ['not-found page', notFound]]) {
      expect(page, name).not.toMatch(/<style\b|\sstyle="/i);
      const sources = [...page.matchAll(/\bsrc="([^"]*)"/g)].map(([, value]) => value);
      for (const source of sources.filter((value) => value !== `${beaconOrigin}/beacon.min.js`)) {
        expect(source, `${name} src`).toMatch(/^\/(?!\/)/);
      }
    }
  });

  it('keep Strict-Transport-Security short and limited to this host', () => {
    for (const name of ['owned-pages', 'hosted-pages']) {
      const value = rule(name).headers['Strict-Transport-Security'];
      expect(value, name).toMatch(/^max-age=\d+$/);
      expect(Number(value.split('=')[1]), name).toBeLessThanOrEqual(86_400);
    }
  });
});

describe('Pre-deploy checks on the real site', () => {
  it('has no broken internal links', () => {
    expect(findBrokenLinks('dist')).toEqual([]);
  });

  it('keeps the Home page within the weight budget', () => {
    expect(homeWeight('dist').bytes).toBeLessThanOrEqual(WEIGHT_BUDGET);
  });

  it('counts the font files and the portrait that the page and its stylesheet load', () => {
    const { files } = homeWeight('dist');
    expect(files.filter((file) => file.endsWith('.woff2')).length).toBeGreaterThan(0);
    expect(files).toContain('portrait.webp');
  });
});

describe('Fonts', () => {
  const stylesheet = () => {
    const href = home.match(/<link rel="stylesheet" href="(\/_astro\/[^"]+\.css)"/)?.[1];
    return readFileSync(`dist${href}`, 'utf8');
  };

  it('serves Archivo Black and Libre Franklin from this domain', () => {
    const faces = stylesheet().match(/@font-face\s*\{[^}]*\}/g) ?? [];
    for (const family of ['Archivo Black', 'Libre Franklin']) {
      expect(faces.some((face) => face.includes(family)), family).toBe(true);
    }
    for (const face of faces) expect(face).toMatch(/url\(["']?\/_astro\/[^)"']+\.woff2/);
  });

  it('loads nothing from another origin through the stylesheet', () => {
    expect(stylesheet()).not.toMatch(/url\(\s*["']?(?:https?:)?\/\//);
  });
});

describe('Public safety', () => {
  it('runs one script, the Cloudflare Web Analytics beacon with a token, and no other analytics', () => {
    const scripts = home.match(/<script\b[^>]*>/gi) ?? [];
    expect(scripts).toHaveLength(1);
    expect(scripts[0]).toContain('type="module"');
    expect(scripts[0]).toContain(`src="${beaconOrigin}/beacon.min.js"`);
    expect(scripts[0]).toMatch(/data-cf-beacon="[^"]*token[^"]+"/);
    expect(home).not.toMatch(/googletagmanager|google-analytics|gtag/i);
  });

  it('has a real beacon token, not the placeholder', () => {
    expect(beaconToken).not.toMatch(/<<|>>/);
    expect(beaconToken.trim()).not.toBe('');
  });

  it('carries the beacon on the Home page only', () => {
    expect(notFound).not.toMatch(/<script|cloudflareinsights/i);
  });

  it('keeps styles in files so style-src self holds', () => {
    expect(home).not.toMatch(/<style/i);
    expect(home).toMatch(/<link rel="stylesheet" href="\/_astro\/[^"]+\.css"/);
  });

  it('lets the Home page load the beacon and let it report to Cloudflare, and nothing else', () => {
    const policy = metaPolicy(home);
    expect(Object.keys(policy).length).toBeGreaterThan(0);
    expect(policy['script-src']).toBe(beaconOrigin);
    expect(policy['connect-src']).toBe(`'self' ${beaconReportOrigin}`);
    expect(Object.values(policy).join(' ').replace(beaconOrigin, '').replace(beaconReportOrigin, '')).not.toMatch(/https?:\/\//);
  });

  it('allows no other origin and no script on the not-found page', () => {
    const policy = metaPolicy(notFound);
    expect(Object.keys(policy).length).toBeGreaterThan(0);
    expect(policy['script-src']).toBe("'none'");
    expect(Object.values(policy).join(' ')).not.toMatch(/https?:\/\//);
  });

  it('carries no phone number, street address or job-search wording', () => {
    const text = home.replace(/<[^>]+>/g, ' ');
    expect(text).not.toMatch(/(?:\+62|\b0)8\d[\d\s-]{7,}/);
    expect(text).not.toMatch(/\bjalan\b|\bjl\./i);
    expect(text).not.toMatch(/open to (?:work|roles|new)|looking for (?:a |new )?(?:role|job|opportunit)/i);
  });
});
