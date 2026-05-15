const { contextBridge } = require('electron');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const SECRET_KEY = 'k3pc0-run-s3cr3t-hmac-k3y-2024!';

// Resolve userData path: Electron sets it after app ready,
// but in preload we can derive it from environment.
function getScorePath() {
  const userDataDir =
    process.env.APPDATA ||
    (process.platform === 'darwin'
      ? path.join(require('os').homedir(), 'Library', 'Application Support')
      : path.join(require('os').homedir(), '.config'));
  const appDir = path.join(userDataDir, 'kepco-run');
  if (!fs.existsSync(appDir)) {
    fs.mkdirSync(appDir, { recursive: true });
  }
  return path.join(appDir, 'score.json');
}

function sign(score) {
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(String(score))
    .digest('hex');
}

function verify(score, sig) {
  const expected = sign(score);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}

contextBridge.exposeInMainWorld('scoreAPI', {
  load() {
    try {
      const filePath = getScorePath();
      if (!fs.existsSync(filePath)) return 0;
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (
        typeof data.score === 'number' &&
        typeof data.sig === 'string' &&
        data.sig.length === 64 &&
        verify(data.score, data.sig)
      ) {
        return data.score;
      }
      // Signature mismatch — reset
      return 0;
    } catch {
      return 0;
    }
  },

  save(score) {
    try {
      const numScore = Math.floor(Number(score));
      if (!Number.isFinite(numScore) || numScore < 0) return;
      const filePath = getScorePath();
      const data = { score: numScore, sig: sign(numScore) };
      fs.writeFileSync(filePath, JSON.stringify(data), 'utf-8');
    } catch {
      // Silently fail — game continues without persistence
    }
  },
});
