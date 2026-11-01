import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

type Job = { needs?: string | string[]; if?: string; permissions?: Record<string, string> };
type Workflow = { on: { push?: { branches: string[] }; pull_request?: { branches: string[] } }; jobs: Record<string, Job> };

const workflow = parse(readFileSync('.github/workflows/deploy.yml', 'utf8')) as Workflow;
const needs = (job: Job) => [job.needs ?? []].flat();

describe('Deploy workflow', () => {
  it('runs on a pull request to master and on a push to master', () => {
    expect(workflow.on.pull_request?.branches).toEqual(['master']);
    expect(workflow.on.push?.branches).toEqual(['master']);
  });

  it('builds only from master, so neither a pull request nor a manual run on a branch can deploy', () => {
    expect(workflow.jobs.check.if).toBeUndefined();
    expect(workflow.jobs.build.if).toBe("github.ref == 'refs/heads/master'");
  });

  it('gives the write permissions to the deploy job alone, not to the jobs that install packages', () => {
    for (const name of ['check', 'build', 'verify']) expect(workflow.jobs[name].permissions, name).toEqual({ contents: 'read' });
    expect(workflow.jobs.deploy.permissions).toBeUndefined();
  });

  it('keeps deploy and verify behind the build, so they skip with it', () => {
    expect(needs(workflow.jobs.build)).toContain('check');
    expect(needs(workflow.jobs.deploy)).toContain('build');
    expect(needs(workflow.jobs.verify)).toContain('deploy');
  });
});
