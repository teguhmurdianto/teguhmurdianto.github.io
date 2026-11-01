import { execFile, spawnSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { promisify } from 'node:util';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  findAnalyticsMismatches,
  findBrokenLinks,
  findHeaderMismatches,
  findHostedMismatches,
  homeWeight,
  readHeaderRules,
} from '../scripts/check-site';

const folders: string[] = [];

/** A throwaway built site: file path -> contents. */
function site(files: Record<string, string | Buffer>): string {
  const root = mkdtempSync(join(tmpdir(), 'check-site-'));
  folders.push(root);
  for (const [path, contents] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), contents);
  }
  return root;
}

const servers: Server[] = [];

/** A local stand-in for the live site: path -> status and headers. */
async function serve(
  responses: Record<string, { status?: number; headers: Record<string, string>; body?: string }>,
): Promise<string> {
  const server = createServer((request, response) => {
    const found = responses[request.url ?? ''];
    response.writeHead(found ? (found.status ?? 200) : 404, found?.headers ?? {});
    response.end(found?.body ?? 'page');
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  servers.push(server);
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
  for (const server of servers.splice(0)) {
    server.closeAllConnections();
    server.close();
  }
});

describe('findBrokenLinks', () => {
  it('passes when every internal link resolves', () => {
    const root = site({
      'index.html': '<a href="/fun/toddler/">Game</a><a href="/about.html">About</a><img src="/portrait.jpg">',
      'fun/toddler/index.html': '<a href="/">Home</a>',
      'about.html': '<a href="/#work">Work</a>',
      'portrait.jpg': 'x',
    });
    expect(findBrokenLinks(root)).toEqual([]);
  });

  it('names a broken link and the page it is on', () => {
    const root = site({ 'index.html': '<a href="/missing/">Gone</a>', 'a/index.html': '<img src="/nope.png">' });
    expect(findBrokenLinks(root)).toEqual([
      { page: 'a/index.html', link: '/nope.png' },
      { page: 'index.html', link: '/missing/' },
    ]);
  });

  it('skips fragments, mailto and absolute URLs', () => {
    const root = site({
      'index.html':
        '<a href="#work">w</a><a href="mailto:a@b.c">m</a><a href="https://example.com/x">e</a><a href="//cdn.example/x.js">c</a>',
    });
    expect(findBrokenLinks(root)).toEqual([]);
  });

  it('resolves a percent-encoded link to the file with spaces in its name', () => {
    const root = site({ 'index.html': '<img src="/my%20photo.jpg">', 'my photo.jpg': 'x' });
    expect(findBrokenLinks(root)).toEqual([]);
  });

  it('ignores a query string or fragment on an internal link', () => {
    const root = site({ 'index.html': '<a href="/page.html?x=1#top">p</a>', 'page.html': '' });
    expect(findBrokenLinks(root)).toEqual([]);
  });
});

describe('homeWeight', () => {
  it('adds the page and the same-origin files it loads', () => {
    const root = site({
      'index.html':
        '<link rel="stylesheet" href="/_astro/a.css"><img src="/p.jpg"><a href="https://example.com/big.png">x</a>',
      '_astro/a.css': Buffer.alloc(100),
      'p.jpg': Buffer.alloc(1000),
    });
    const { bytes } = homeWeight(root);
    expect(bytes).toBe(Buffer.byteLength(
      '<link rel="stylesheet" href="/_astro/a.css"><img src="/p.jpg"><a href="https://example.com/big.png">x</a>',
    ) + 1100);
  });

  it('counts a file used twice once', () => {
    const root = site({ 'index.html': '<img src="/p.jpg"><img src="/p.jpg">', 'p.jpg': Buffer.alloc(500) });
    expect(homeWeight(root).bytes).toBe(Buffer.byteLength('<img src="/p.jpg"><img src="/p.jpg">') + 500);
  });

  it('adds the same-origin files a loaded stylesheet reads through url(), a file counted once', () => {
    const css =
      '@font-face{src:url(/_astro/f.woff2)}.a{shape-outside:url("/p.webp")}.b{background:url(data:image/png;base64,AAAA)}.c{background:url(https://example.com/x.png)}';
    const html = '<link rel="stylesheet" href="/_astro/a.css"><img src="/p.webp">';
    const root = site({ 'index.html': html, '_astro/a.css': css, '_astro/f.woff2': Buffer.alloc(300), 'p.webp': Buffer.alloc(200) });
    const { bytes, files } = homeWeight(root);
    expect(files).toEqual(['_astro/a.css', '_astro/f.woff2', 'p.webp']);
    expect(bytes).toBe(Buffer.byteLength(html) + Buffer.byteLength(css) + 500);
  });

  it('reads url() in any letter case, drops a query or hash, and skips a protocol-relative address', () => {
    const css = '.a{src:URL("/_astro/f.woff2?v=3#x")}.b{background:url(//cdn.example.com/y.png)}';
    const root = site({
      'index.html': '<link rel="stylesheet" href="/_astro/a.css">',
      '_astro/a.css': css,
      '_astro/f.woff2': Buffer.alloc(300),
    });
    expect(homeWeight(root).files).toEqual(['_astro/a.css', '_astro/f.woff2']);
  });

  it('reads a relative url() from the stylesheet\'s own folder', () => {
    const root = site({
      'index.html': '<link rel="stylesheet" href="/_astro/a.css">',
      '_astro/a.css': '@font-face{src:url(./f.woff2)}',
      '_astro/f.woff2': Buffer.alloc(300),
    });
    expect(homeWeight(root).files).toContain('_astro/f.woff2');
  });
});

describe('findHostedMismatches', () => {
  const record = (path: string) => ({ path, source: 'repo', commit: 'abc', build: 'npm run build' });
  const hosted = (records: object[], files: Record<string, string> = {}) =>
    site({ 'src/data/hosted-pages.json': JSON.stringify(records), ...files });

  it('passes when every record has a folder and every folder has a record', () => {
    const root = hosted([record('fun/toddler')], { 'public/fun/toddler/index.html': 'x', 'public/portrait.jpg': 'x' });
    expect(findHostedMismatches(root)).toEqual([]);
  });

  it('passes a site with no hosted pages and no record file', () => {
    expect(findHostedMismatches(site({ 'public/robots.txt': 'x' }))).toEqual([]);
  });

  it('names a record that has no folder', () => {
    expect(findHostedMismatches(hosted([record('fun/gone')]))).toEqual([
      { path: 'fun/gone', problem: 'the record has no folder with an index.html' },
    ]);
  });

  it('names a folder that has no record', () => {
    const root = hosted([], { 'public/fun/loose/index.html': 'x', 'public/work/tool/index.html': 'x' });
    expect(findHostedMismatches(root)).toEqual([
      { path: 'fun/loose', problem: 'the folder has no record' },
      { path: 'work/tool', problem: 'the folder has no record' },
    ]);
  });
});

describe('readHeaderRules', () => {
  const doc = (body: string) => `# Rules\n\nSome words.\n\n\`\`\`yaml\n${body}\`\`\`\n\nMore words.\n`;

  it('reads the rules from the YAML block', () => {
    const rules = readHeaderRules(
      doc('rules:\n  - name: site\n    expression: \'http.host eq "x"\'\n    paths: [/]\n    headers:\n      X-Test: one\n'),
    );
    expect(rules).toEqual([{ name: 'site', expression: 'http.host eq "x"', paths: ['/'], headers: { 'X-Test': 'one' } }]);
  });

  it('refuses a document with no YAML block', () => {
    expect(() => readHeaderRules('# Nothing here\n')).toThrow(/yaml/i);
  });

  it('refuses a block with no rules list, in plain words', () => {
    expect(() => readHeaderRules(doc('other: 1\n'))).toThrow(/rules list/);
  });

  it('names the rule that lacks paths or headers', () => {
    expect(() => readHeaderRules(doc('rules:\n  - name: broken\n    expression: x\n    headers:\n      A: b\n'))).toThrow(/broken.*paths/);
    expect(() => readHeaderRules(doc('rules:\n  - name: broken\n    expression: x\n    paths: [/]\n'))).toThrow(/broken.*headers/);
  });

  it('reads a document with Windows line endings', () => {
    const text = doc('rules:\n  - name: a\n    expression: x\n    paths: [/]\n    headers:\n      A: b\n').replace(/\n/g, '\r\n');
    expect(readHeaderRules(text)).toHaveLength(1);
  });
});

describe('findHeaderMismatches', () => {
  const rules = [
    { name: 'site', expression: 'x', paths: ['/'], headers: { 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' } },
  ];
  const good = { 'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer' };

  it('passes when every documented header matches, whatever the header name case', async () => {
    const base = await serve({ '/': { headers: good } });
    expect(await findHeaderMismatches(base, rules)).toEqual([]);
  });

  it('names the path, header, live value and documented value when a header differs', async () => {
    const base = await serve({ '/': { headers: { ...good, 'referrer-policy': 'origin' } } });
    expect(await findHeaderMismatches(base, rules)).toEqual([
      { path: '/', header: 'Referrer-Policy', live: 'origin', documented: 'no-referrer' },
    ]);
  });

  it('reports a missing header as missing', async () => {
    const base = await serve({ '/': { headers: { 'x-content-type-options': 'nosniff' } } });
    expect(await findHeaderMismatches(base, rules)).toEqual([
      { path: '/', header: 'Referrer-Policy', live: '(missing)', documented: 'no-referrer' },
    ]);
  });

  it('reports a page that does not answer 200', async () => {
    const base = await serve({ '/': { status: 403, headers: good } });
    expect(await findHeaderMismatches(base, rules)).toEqual([
      { path: '/', header: '(status)', live: '403', documented: '200' },
    ]);
  });

  it('reports a site that cannot be reached', async () => {
    const mismatches = await findHeaderMismatches('http://127.0.0.1:1', rules);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({ path: '/', header: '(request)', documented: '200' });
  });

  it('gives up on a site that never answers, and says so', async () => {
    const server = createServer(() => {});
    await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
    servers.push(server);
    const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const mismatches = await findHeaderMismatches(base, rules, 200);
    expect(mismatches).toHaveLength(1);
    expect(mismatches[0]).toMatchObject({ path: '/', header: '(request)', documented: '200' });
  });

  it('checks every path of every rule', async () => {
    const base = await serve({ '/': { headers: good }, '/fun/a/': { headers: {} } });
    const both = [...rules, { name: 'hosted', expression: 'y', paths: ['/fun/a/'], headers: { 'X-Content-Type-Options': 'nosniff' } }];
    expect((await findHeaderMismatches(base, both)).map((mismatch) => mismatch.path)).toEqual(['/fun/a/']);
  });
});

describe('the check command', () => {
  const run = (check: string, root: string) =>
    spawnSync('node', ['scripts/check-site.ts', check, root], { encoding: 'utf8' });

  it('fails a broken link and names it', () => {
    const result = run('links', site({ 'index.html': '<a href="/missing/">Gone</a>' }));
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Broken link /missing/ on index.html');
  });

  it('fails a Home page over the budget and shows its size', () => {
    const result = run('weight', site({ 'index.html': '<img src="/p.jpg">', 'p.jpg': Buffer.alloc(151 * 1024) }));
    expect(result.status).toBe(1);
    expect(result.stderr).toMatch(/Over budget: Home page is 151\.\d KB against a budget of 150\.0 KB/);
  });

  it('fails a record with no folder and names it', () => {
    const root = site({ 'src/data/hosted-pages.json': JSON.stringify([{ path: 'fun/gone', source: 'r', commit: 'c', build: 'b' }]) });
    const result = run('hosted', root);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Hosted page fun/gone: the record has no folder with an index.html');
  });

  it('passes a clean site', () => {
    const root = site({ 'index.html': '<a href="/">Home</a><img src="/p.jpg">', 'p.jpg': Buffer.alloc(1024) });
    expect(run('links', root).status).toBe(0);
    expect(run('weight', root).status).toBe(0);
  });
});

describe('the headers command', () => {
  const run = promisify(execFile);
  const docs = (header: string) =>
    site({
      'rules.md': `\`\`\`yaml\nrules:\n  - name: site\n    expression: 'x'\n    paths: [/]\n    headers:\n      Referrer-Policy: ${header}\n\`\`\`\n`,
    });

  it('exits 0 when the live headers match the docs', async () => {
    const base = await serve({ '/': { headers: { 'referrer-policy': 'no-referrer' } } });
    const { stdout } = await run('node', ['scripts/check-site.ts', 'headers', base, join(docs('no-referrer'), 'rules.md')]);
    expect(stdout).toContain('Headers: the live site matches the documented rules');
  });

  it('exits 1 and shows the difference when a live header differs', async () => {
    const base = await serve({ '/': { headers: { 'referrer-policy': 'origin' } } });
    const failure = await run('node', ['scripts/check-site.ts', 'headers', base, join(docs('no-referrer'), 'rules.md')]).catch((error) => error);
    expect(failure.code).toBe(1);
    expect(failure.stderr).toContain('/ Referrer-Policy: live "origin", documented "no-referrer"');
  });
});

describe('findAnalyticsMismatches', () => {
  const beacon = '<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js"></script>';
  const ok = { headers: {} };

  it('passes when the Home page has the beacon and no Hosted page has any analytics', async () => {
    const base = await serve({ '/': { ...ok, body: beacon }, '/fun/a/': { ...ok, body: '<p>game</p>' } });
    expect(await findAnalyticsMismatches(base, '/', ['/fun/a/'])).toEqual([]);
  });

  it('reports a Home page without the beacon', async () => {
    const base = await serve({ '/': { ...ok, body: '<p>home</p>' }, '/fun/a/': ok });
    expect(await findAnalyticsMismatches(base, '/', ['/fun/a/'])).toEqual([
      { path: '/', problem: 'the Home page has no Cloudflare Web Analytics beacon' },
    ]);
  });

  it('reports a Hosted page that carries the beacon, in any letter case', async () => {
    const base = await serve({ '/': { ...ok, body: beacon }, '/fun/a/': { ...ok, body: '<script src="HTTPS://STATIC.CloudflareInsights.com/x">' } });
    expect(await findAnalyticsMismatches(base, '/', ['/fun/a/'])).toEqual([
      { path: '/fun/a/', problem: 'a Hosted page loads Cloudflare Web Analytics' },
    ]);
  });

  it('reports a page that does not answer 200, or a site that cannot be reached', async () => {
    const base = await serve({ '/': { ...ok, body: beacon }, '/fun/a/': { status: 403, headers: {} } });
    expect(await findAnalyticsMismatches(base, '/', ['/fun/a/'])).toEqual([{ path: '/fun/a/', problem: 'the page answered 403' }]);
    const down = await findAnalyticsMismatches('http://127.0.0.1:1', '/', []);
    expect(down).toHaveLength(1);
    expect(down[0]).toMatchObject({ path: '/' });
  });
});

describe('findAnalyticsMismatches, stricter cases', () => {
  const ok = { headers: {} };
  const beacon = 'src="https://static.cloudflareinsights.com/beacon.min.js"';

  it('reports a live beacon that still has the placeholder token', async () => {
    const body = `<script ${beacon} data-cf-beacon="{&quot;token&quot;:&quot;<<CF_BEACON_TOKEN>>&quot;}">`;
    const base = await serve({ '/': { ...ok, body } });
    expect(await findAnalyticsMismatches(base, '/', [])).toEqual([
      { path: '/', problem: 'the Home page beacon still has the placeholder token' },
    ]);
  });

  it('reports a Home page whose email link Cloudflare rewrote, because the policy blocks its script', async () => {
    const body = `<script ${beacon}></script><a href="/cdn-cgi/l/email-protection#abc">Email me</a>`;
    const base = await serve({ '/': { ...ok, body } });
    expect(await findAnalyticsMismatches(base, '/', [])).toEqual([
      { path: '/', problem: 'Cloudflare email obfuscation rewrote a link; the policy blocks its script' },
    ]);
  });

  it('judges a Hosted page as a Hosted page even when its path equals the Home path', async () => {
    const base = await serve({ '/': { ...ok, body: `<script ${beacon}></script>` } });
    expect(await findAnalyticsMismatches(base, '/', ['/'])).toEqual([
      { path: '/', problem: 'a Hosted page loads Cloudflare Web Analytics' },
    ]);
  });
});

describe('the analytics command', () => {
  const run = promisify(execFile);
  const docs = () =>
    site({
      'rules.md':
        "```yaml\nrules:\n  - name: owned-pages\n    expression: 'x'\n    paths: [/]\n    headers:\n      A: b\n  - name: hosted-pages\n    expression: 'y'\n    paths: [/fun/a/]\n    headers:\n      A: b\n```\n",
    });

  it('exits 0 when the Home page has the beacon and the Hosted pages have none', async () => {
    const base = await serve({
      '/': { headers: {}, body: '<script src="https://static.cloudflareinsights.com/beacon.min.js">' },
      '/fun/a/': { headers: {} },
    });
    const { stdout } = await run('node', ['scripts/check-site.ts', 'analytics', base, join(docs(), 'rules.md')]);
    expect(stdout).toContain('Analytics: only the Home page loads Cloudflare Web Analytics');
  });

  it('exits 1 and names the page when a Hosted page carries it', async () => {
    const tracked = '<script src="https://static.cloudflareinsights.com/beacon.min.js">';
    const base = await serve({ '/': { headers: {}, body: tracked }, '/fun/a/': { headers: {}, body: tracked } });
    const failure = await run('node', ['scripts/check-site.ts', 'analytics', base, join(docs(), 'rules.md')]).catch((error) => error);
    expect(failure.code).toBe(1);
    expect(failure.stderr).toContain('/fun/a/: a Hosted page loads Cloudflare Web Analytics');
  });
});
