import { execFileSync } from 'node:child_process';

const localHead = () => execFileSync('git', ['rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' });

/** The commit a build was made from: the CI commit when set, else the local HEAD, else "dev". */
export function resolveVersion(ciSha: string | undefined, readHead: () => string = localHead): string {
  if (ciSha) return ciSha.slice(0, 7);
  try {
    return readHead().trim().slice(0, 7) || 'dev';
  } catch {
    return 'dev';
  }
}
