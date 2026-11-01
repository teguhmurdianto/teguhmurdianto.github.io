import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { addPage, removePage } from '../scripts/intake';

const folders: string[] = [];
const BUILD = "mkdir dist && printf '<h1>Game</h1>' > dist/index.html";

function temp(): string {
  const folder = mkdtempSync(join(tmpdir(), 'intake-'));
  folders.push(folder);
  return folder;
}

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], {
    cwd,
    encoding: 'utf8',
  }).trim();

/** A committed Source repo holding one file. */
function sourceRepo(name = 'toddler'): string {
  const repo = join(temp(), name);
  mkdirSync(repo);
  git(repo, 'init', '-q', '-b', 'main');
  writeFileSync(join(repo, 'readme.txt'), 'game');
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '-m', 'first');
  return repo;
}

/** An empty site with a public folder. */
function siteRoot(): string {
  const root = temp();
  mkdirSync(join(root, 'public'));
  return root;
}

const records = (root: string): { path: string; source: string; commit: string; build: string }[] =>
  JSON.parse(readFileSync(join(root, 'src/data/hosted-pages.json'), 'utf8'));

afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe('addPage', () => {
  it('places the build under the section path and records the source, commit and build command', () => {
    const source = sourceRepo();
    const root = siteRoot();
    addPage({ source, path: 'fun/toddler', build: BUILD, root });
    expect(readFileSync(join(root, 'public/fun/toddler/index.html'), 'utf8')).toBe('<h1>Game</h1>');
    expect(records(root)).toEqual([
      { path: 'fun/toddler', source: 'toddler', commit: git(source, 'rev-parse', 'HEAD'), build: BUILD },
    ]);
  });

  it('records the repo name, never its location on this machine', () => {
    const source = sourceRepo();
    const root = siteRoot();
    addPage({ source, path: 'fun/toddler', build: BUILD, root });
    expect(readFileSync(join(root, 'src/data/hosted-pages.json'), 'utf8')).not.toContain(source.replace(basename(source), ''));
  });

  it('refuses a Source repo with uncommitted changes and says why', () => {
    const root = siteRoot();
    const modified = sourceRepo();
    writeFileSync(join(modified, 'readme.txt'), 'changed');
    expect(() => addPage({ source: modified, path: 'fun/toddler', build: BUILD, root })).toThrow(/uncommitted changes/);
    const untracked = sourceRepo();
    writeFileSync(join(untracked, 'new.txt'), 'new');
    expect(() => addPage({ source: untracked, path: 'fun/toddler', build: BUILD, root })).toThrow(/uncommitted changes/);
    expect(existsSync(join(root, 'public/fun'))).toBe(false);
    expect(existsSync(join(root, 'src/data/hosted-pages.json'))).toBe(false);
  });

  it('refuses a build with no top-level index.html', () => {
    const root = siteRoot();
    const build = "mkdir dist && mkdir dist/app && printf 'x' > dist/app/index.html";
    expect(() => addPage({ source: sourceRepo(), path: 'fun/toddler', build, root })).toThrow(/index\.html/);
    expect(existsSync(join(root, 'public/fun'))).toBe(false);
  });

  it('refuses a folder that is not a git repo, in one line', () => {
    const root = siteRoot();
    let message = '';
    try {
      addPage({ source: temp(), path: 'fun/toddler', build: BUILD, root });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/is not a git repository/);
    expect(message).not.toContain('Command failed');
  });

  it('leaves no staging folder next to the Snapshot', () => {
    const root = siteRoot();
    addPage({ source: sourceRepo(), path: 'fun/toddler', build: BUILD, root });
    expect(readdirSync(join(root, 'public/fun'))).toEqual(['toddler']);
  });

  it('keeps the old Snapshot when the new build fails', () => {
    const source = sourceRepo();
    const root = siteRoot();
    addPage({ source, path: 'fun/toddler', build: BUILD, root });
    expect(() => addPage({ source, path: 'fun/toddler', build: 'exit 1', root })).toThrow(/build failed/i);
    expect(readFileSync(join(root, 'public/fun/toddler/index.html'), 'utf8')).toBe('<h1>Game</h1>');
  });

  it('refuses a build that fails', () => {
    const root = siteRoot();
    expect(() => addPage({ source: sourceRepo(), path: 'fun/toddler', build: 'exit 3', root })).toThrow(/build failed/i);
  });

  it.each(['fun', '_astro/game', 'about/game', '../game', 'fun/../game', 'fun/Bad Name', '/fun/game', 'fun/game/x', 'fun/'])(
    'refuses the path %s',
    (path) => {
      const root = siteRoot();
      expect(() => addPage({ source: sourceRepo(), path, build: BUILD, root })).toThrow(/path/i);
      expect(existsSync(join(root, 'src/data/hosted-pages.json'))).toBe(false);
    },
  );

  it('never writes to the Source repo', () => {
    const source = sourceRepo();
    addPage({ source, path: 'fun/toddler', build: BUILD, root: siteRoot() });
    expect(git(source, 'status', '--porcelain')).toBe('');
    expect(existsSync(join(source, 'dist'))).toBe(false);
  });

  it('builds the recorded commit, not whatever is checked out elsewhere', () => {
    const source = sourceRepo();
    const root = siteRoot();
    addPage({ source, path: 'fun/toddler', build: "mkdir dist && cp readme.txt dist/index.html", root });
    expect(readFileSync(join(root, 'public/fun/toddler/index.html'), 'utf8')).toBe('game');
  });

  it('replaces the Snapshot and its record when run again', () => {
    const source = sourceRepo();
    const root = siteRoot();
    addPage({ source, path: 'fun/toddler', build: BUILD, root });
    writeFileSync(join(source, 'readme.txt'), 'second');
    git(source, 'commit', '-q', '-am', 'second');
    addPage({ source, path: 'fun/toddler', build: "mkdir dist && printf 'v2' > dist/new.html && cp readme.txt dist/index.html", root });
    expect(existsSync(join(root, 'public/fun/toddler/new.html'))).toBe(true);
    expect(readFileSync(join(root, 'public/fun/toddler/index.html'), 'utf8')).toBe('second');
    expect(records(root)).toHaveLength(1);
    expect(records(root)[0].commit).toBe(git(source, 'rev-parse', 'HEAD'));
  });

  it('keeps other pages and lists the records by path', () => {
    const root = siteRoot();
    addPage({ source: sourceRepo('zeta'), path: 'fun/zeta', build: BUILD, root });
    addPage({ source: sourceRepo('alpha'), path: 'fun/alpha', build: BUILD, root });
    expect(records(root).map((record) => record.path)).toEqual(['fun/alpha', 'fun/zeta']);
  });
});

describe('removePage', () => {
  it('deletes the folder and the record', () => {
    const root = siteRoot();
    addPage({ source: sourceRepo('one'), path: 'fun/one', build: BUILD, root });
    addPage({ source: sourceRepo('two'), path: 'fun/two', build: BUILD, root });
    removePage({ path: 'fun/one', root });
    expect(existsSync(join(root, 'public/fun/one'))).toBe(false);
    expect(existsSync(join(root, 'public/fun/two/index.html'))).toBe(true);
    expect(records(root).map((record) => record.path)).toEqual(['fun/two']);
  });

  it('refuses a page that is not hosted', () => {
    const root = siteRoot();
    expect(() => removePage({ path: 'fun/nothing', root })).toThrow(/no hosted page/i);
  });
});
