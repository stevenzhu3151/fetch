import { config } from './config.js';

// Patterns that mean "this is still a placeholder, not a real value".
const PLACEHOLDERS = [
  /example\.(com|org)/i,
  /\byou@/i,
  /yourstudio/i,
  /your-?domain/i,
  /123 Main St/i,
  /calendly\.com\/you\b/i,
  /change-me/i,
];

const looksFake = (v: string) => !v.trim() || PLACEHOLDERS.some((re) => re.test(v));

export interface ConfigProblem {
  field: string;
  message: string;
}

/** True only when emails will actually leave the machine. */
export function isRealSend(): boolean {
  return config.email.enabled && !config.email.dryRun;
}

/** Things that MUST be real before a single email goes out. */
export function checkSendConfig(): ConfigProblem[] {
  const problems: ConfigProblem[] = [];

  if (looksFake(config.email.from) || !/@/.test(config.email.from)) {
    problems.push({
      field: 'EMAIL_FROM',
      message: 'Use a real From address on your own domain, e.g. "StanAlpha <hi@stanalpha.com>".',
    });
  }
  if (looksFake(config.sender.physicalAddress)) {
    problems.push({
      field: 'SENDER_ADDRESS',
      message:
        'A REAL physical postal address is legally required (CAN-SPAM). ' +
        'Use a PO box or a virtual mailbox if you would rather not use your home address.',
    });
  }
  if (looksFake(config.email.host)) {
    problems.push({ field: 'SMTP_HOST', message: 'Set your SMTP host, e.g. smtp.resend.com.' });
  }
  if (!config.email.pass.trim()) {
    problems.push({ field: 'SMTP_PASS', message: 'Set your SMTP password / API key.' });
  }
  return problems;
}

/**
 * Hard gate: in real-send mode, throw with clear guidance if anything is fake
 * or missing. In dry-run mode this is a no-op (nothing leaves the machine).
 */
export function assertSendConfig(): void {
  if (!isRealSend()) return;
  const problems = checkSendConfig();
  if (problems.length === 0) return;
  const lines = problems.map((p) => `  • ${p.field}: ${p.message}`).join('\n');
  throw new Error(
    `Refusing to send real emails until these are fixed:\n${lines}\n\n` +
      `Keep DRY_RUN=true to preview safely without sending.`,
  );
}
