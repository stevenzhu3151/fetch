/* Tiny leveled logger so runs are easy to read in a terminal. */
const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

export const log = {
  info: (msg: string, ...rest: unknown[]) =>
    console.log(`\x1b[36m[${ts()}]\x1b[0m ${msg}`, ...rest),
  ok: (msg: string, ...rest: unknown[]) =>
    console.log(`\x1b[32m[${ts()}] ✓\x1b[0m ${msg}`, ...rest),
  warn: (msg: string, ...rest: unknown[]) =>
    console.warn(`\x1b[33m[${ts()}] !\x1b[0m ${msg}`, ...rest),
  error: (msg: string, ...rest: unknown[]) =>
    console.error(`\x1b[31m[${ts()}] ✗\x1b[0m ${msg}`, ...rest),
  step: (msg: string) => console.log(`\x1b[35m▸\x1b[0m ${msg}`),
};
