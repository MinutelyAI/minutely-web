/**
 * Meeting utilities for instant meeting creation and management
 */

/**
 * Generate a unique meeting code (6 characters)
 * Non-trivially guessable using random alphanumeric characters
 */
export function generateMeetingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Generate a shareable meeting URL/link
 */
export function generateMeetingLink(meetingCode: string): string {
  return `minutely://join/${meetingCode}`;
}

/**
 * Format meeting code for display (e.g., ABC-DEF)
 */
export function formatMeetingCode(code: string): string {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Parse formatted meeting code back to original format
 */
export function parseMeetingCode(formattedCode: string): string {
  return formattedCode.replace('-', '');
}

/**
 * Validate meeting code format
 */
export function isValidMeetingCode(code: string): boolean {
  const unformatted = parseMeetingCode(code);
  return /^[A-Z0-9]{6}$/.test(unformatted);
}

/**
 * Generate a unique meeting ID (UUID-like)
 */
export function generateMeetingId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
