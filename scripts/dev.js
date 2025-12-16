#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');

const processes = [
  {
    name: 'frontend',
    cwd: path.resolve(__dirname, '../aCapital-react-main-7'),
    args: ['run', 'dev'],
  },
].filter(Boolean); // backend removed for now

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];
let shuttingDown = false;
let exitCode = 0;

const shutdown = (signal) => {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

const handleProcessExit = (code) => {
  if (code && exitCode === 0) {
    exitCode = code;
  }
  if (!shuttingDown) {
    shutdown('SIGINT');
  }
};

for (const proc of processes) {
  const child = spawn(npmCommand, proc.args, {
    cwd: proc.cwd,
    stdio: 'inherit',
  });

  children.push(child);

  child.on('error', (error) => {
    console.error(`[${proc.name}] failed to start: ${error.message}`);
    exitCode = 1;
    shutdown('SIGINT');
  });

  child.on('exit', handleProcessExit);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

Promise.allSettled(
  children.map(
    (child) =>
      new Promise((resolve) => {
        child.on('close', () => resolve());
      }),
  ),
).finally(() => {
  process.exit(exitCode);
});
