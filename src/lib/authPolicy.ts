export const authPolicy = {
  requireEmailVerificationToSync: true,
  blockDisposableDomains: true,
  allowedDomainsOnly: [] as string[],
};

// Bundled open-source disposable email domain list
// Licensed under MIT / open-source domain lists (e.g. widely used disposable email domains list)
export const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'guerrillamail.com', '10minutemail.com', 'tempmail.com',
  'throwawaymail.com', 'trashmail.com', 'getnada.com', 'temp-mail.org',
  'dispostable.com', 'sharklasers.com', 'maildrop.cc', 'yopmail.com',
  'fakemailgenerator.com', 'mohmal.com', 'emailondeck.com', 'inboxkitten.com',
  'burnermail.io', 'getairmail.com', 'tempmailaddress.com', 'generator.email'
]);

export function isDisposableEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const domain = email.split('@')[1]?.toLowerCase().trim();
  if (!domain) return false;
  
  if (authPolicy.allowedDomainsOnly.length > 0) {
    if (!authPolicy.allowedDomainsOnly.includes(domain)) {
      return true; // blocked if not in allowed list
    }
  }

  let currentDomain = domain;
  while (currentDomain.includes('.')) {
    if (DISPOSABLE_DOMAINS.has(currentDomain)) {
      return true;
    }
    currentDomain = currentDomain.substring(currentDomain.indexOf('.') + 1);
  }
  return DISPOSABLE_DOMAINS.has(domain);
}
