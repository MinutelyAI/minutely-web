const PEER_IDENTITY_KEY = 'meeting_peer_email';
const PEER_SUFFIX_KEY = 'meeting_peer_suffix';

const normalizeEmail = (value: string) => value.trim().toLowerCase();

// Returns a stable per-profile identity used for meeting participant rows and WebRTC routing.
export function getMeetingPeerEmail(userEmailRaw: string | null): string {
  const userEmail = normalizeEmail(userEmailRaw || '');
  if (!userEmail) {
    return '';
  }

  const existingPeer = normalizeEmail(localStorage.getItem(PEER_IDENTITY_KEY) || '');
  if (existingPeer) {
    return existingPeer;
  }

  const atIndex = userEmail.indexOf('@');
  const localPart = atIndex > 0 ? userEmail.slice(0, atIndex) : userEmail;
  const domainPart = atIndex > 0 ? userEmail.slice(atIndex + 1) : 'local.minutely';

  let suffix = normalizeEmail(localStorage.getItem(PEER_SUFFIX_KEY) || '');
  if (!suffix) {
    suffix = Math.random().toString(36).slice(2, 10);
    localStorage.setItem(PEER_SUFFIX_KEY, suffix);
  }

  const peerEmail = `${localPart}+${suffix}@${domainPart}`;
  localStorage.setItem(PEER_IDENTITY_KEY, peerEmail);

  return peerEmail;
}
