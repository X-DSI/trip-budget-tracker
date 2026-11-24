// Before e2e runs: stop anything still listening on the e2e ports (a Firestore or Auth emulator
// left behind by an interrupted run). Only touches these ports; does nothing where `lsof` is
// missing (e.g. Windows) or in CI.
import { execSync } from 'node:child_process';

const PORTS = [8080, 9099, 4173];

if (!process.env.CI) {
  for (const port of PORTS) {
    let pids = '';
    try {
      pids = execSync(`lsof -ti tcp:${port} -sTCP:LISTEN`, { encoding: 'utf8' }).trim();
    } catch {
      continue; // nothing listening, or no lsof
    }
    for (const pid of pids.split(/\s+/).filter(Boolean)) {
      try {
        process.kill(Number(pid), 'SIGTERM');
        console.log(`Stopped leftover process ${pid} on port ${port}`);
      } catch {
        // already gone
      }
    }
  }
}
