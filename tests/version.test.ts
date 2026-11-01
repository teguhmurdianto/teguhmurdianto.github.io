import { describe, expect, it } from 'vitest';
import { resolveVersion } from '../src/data/version';

const FULL_SHA = '71ef8b4d0c2a9e5f13b6a7c8d9e0f1a2b3c4d5e6';

describe('resolveVersion', () => {
  it('uses the first seven characters of the commit the CI build was made from', () => {
    expect(resolveVersion(FULL_SHA, () => 'ffffffff')).toBe('71ef8b4');
  });

  it('reads the local HEAD when CI sets no commit', () => {
    expect(resolveVersion(undefined, () => 'abc1234\n')).toBe('abc1234');
    expect(resolveVersion('', () => 'abc1234')).toBe('abc1234');
  });

  it('says "dev" when there is no commit to read, instead of failing the build', () => {
    const noGit = () => {
      throw new Error('not a git repository');
    };
    expect(resolveVersion(undefined, noGit)).toBe('dev');
    expect(resolveVersion(undefined, () => '')).toBe('dev');
  });
});
