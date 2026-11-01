import { execFileSync, spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { sectionIds } from '../src/data/sections.ts';

/** One line of the Hosted page record: where a Snapshot came from. */
export type HostedPageRecord = { path: string; source: string; commit: string; build: string };

export const DEFAULT_BUILD = 'npm ci && npm run build';

const PAGE_PATH = new RegExp(`^(?:${sectionIds.join('|')})/[a-z0-9][a-z0-9-]*$`);
const RECORDS = 'src/data/hosted-pages.json';

/** A refusal the owner can act on; the message says why. */
class Refusal extends Error {}

export function readRecords(root: string): HostedPageRecord[] {
  const file = join(root, RECORDS);
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as HostedPageRecord[]) : [];
}

function writeRecords(root: string, records: HostedPageRecord[]): void {
  const sorted = [...records].sort((a, b) => a.path.localeCompare(b.path));
  mkdirSync(dirname(join(root, RECORDS)), { recursive: true });
  writeFileSync(join(root, RECORDS), `${JSON.stringify(sorted, null, 2)}\n`);
}

function requirePath(path: string): void {
  if (!PAGE_PATH.test(path)) {
    throw new Refusal(`Path "${path}" must be <section>/<page>, a section of ${sectionIds.join(', ')} and a lowercase page name`);
  }
}

const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();

/** Whether the folder is inside a git work tree. */
function isGitRepo(folder: string): boolean {
  return existsSync(folder) && spawnSync('git', ['rev-parse', '--git-dir'], { cwd: folder }).status === 0;
}

/**
 * Builds the Source repo at its current commit in a temporary clone and places the output at
 * public/<path>/, with its record. Never writes to the Source repo.
 */
export function addPage(options: { source: string; path: string; build?: string; root?: string }): void {
  const { path, build = DEFAULT_BUILD, root = process.cwd() } = options;
  const source = resolve(options.source);
  requirePath(path);
  if (!isGitRepo(source)) throw new Refusal(`${basename(source)} is not a git repository`);
  if (git(source, 'status', '--porcelain') !== '') {
    throw new Refusal(`${basename(source)} has uncommitted changes; commit them so the Snapshot matches a commit`);
  }
  const commit = git(source, 'rev-parse', 'HEAD');

  const work = mkdtempSync(join(tmpdir(), 'snapshot-'));
  try {
    const clone = join(work, 'source');
    git(work, 'clone', '--quiet', '--no-checkout', source, clone);
    git(clone, 'checkout', '--quiet', commit);
    const built = spawnSync(build, { cwd: clone, shell: true, encoding: 'utf8' });
    if (built.status !== 0) {
      throw new Refusal(`Build failed (${build}) with exit ${built.status}\n${built.stderr}`.trimEnd());
    }
    if (!existsSync(join(clone, 'dist', 'index.html'))) {
      throw new Refusal('The build has no top-level dist/index.html, so there is no page to serve');
    }
    // Copy beside the old Snapshot first, so a failed copy leaves the old one in place.
    const folder = join(root, 'public', path);
    const staged = `${folder}.new`;
    rmSync(staged, { recursive: true, force: true });
    mkdirSync(dirname(folder), { recursive: true });
    try {
      cpSync(join(clone, 'dist'), staged, { recursive: true });
    } catch (error) {
      rmSync(staged, { recursive: true, force: true });
      throw error;
    }
    rmSync(folder, { recursive: true, force: true });
    renameSync(staged, folder);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }

  const others = readRecords(root).filter((record) => record.path !== path);
  writeRecords(root, [...others, { path, source: basename(source), commit, build }]);
}

/** Deletes a Hosted page's Snapshot folder and its record. */
export function removePage(options: { path: string; root?: string }): void {
  const { path, root = process.cwd() } = options;
  requirePath(path);
  const records = readRecords(root);
  const folder = join(root, 'public', path);
  if (!records.some((record) => record.path === path) && !existsSync(folder)) {
    throw new Refusal(`There is no hosted page at ${path}`);
  }
  rmSync(folder, { recursive: true, force: true });
  writeRecords(root, records.filter((record) => record.path !== path));
}

function main(args: string[]): number {
  const [command, ...rest] = args;
  const flag = rest.indexOf('--build');
  const build = flag === -1 ? undefined : rest.splice(flag, 2)[1];
  if (flag !== -1 && !build) {
    console.error('--build needs a command, such as --build "npm ci && npm run build"');
    return 2;
  }
  try {
    if (command === 'add' && rest.length === 2) {
      addPage({ source: rest[0], path: rest[1], build });
      console.log(`Placed ${rest[1]} at public/${rest[1]}/ and recorded it`);
      return 0;
    }
    if (command === 'remove' && rest.length === 1) {
      removePage({ path: rest[0] });
      console.log(`Removed ${rest[0]} and its record`);
      return 0;
    }
  } catch (error) {
    if (!(error instanceof Refusal)) throw error;
    console.error(error.message);
    return 1;
  }
  console.error('Usage: node scripts/intake.ts add <source-repo> <section>/<page> [--build "<command>"]\n       node scripts/intake.ts remove <section>/<page>');
  return 2;
}

if (import.meta.main) process.exit(main(process.argv.slice(2)));
