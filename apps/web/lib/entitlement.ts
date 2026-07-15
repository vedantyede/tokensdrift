import { getGithubInstallStore } from './githubInstallStore';
import { getBillingStore } from './billingStore';

// No card required to start — matches the PRD's 14-day trial.
const TRIAL_DAYS = 14;
const ACTIVE_STATUSES = new Set(['trialing', 'active']);

export interface Entitlement {
  entitled: boolean;
  reason: 'trial' | 'subscribed' | 'trial_expired' | 'no_subscription';
  trialEndsAt: number;
}

export async function getEntitlement(installationId: number): Promise<Entitlement> {
  const [installStore, billingStore] = await Promise.all([getGithubInstallStore(), getBillingStore()]);
  const [install, billing] = await Promise.all([
    installStore.get(installationId),
    billingStore.get(installationId),
  ]);

  if (billing && ACTIVE_STATUSES.has(billing.status)) {
    return { entitled: true, reason: 'subscribed', trialEndsAt: billing.trialEndsAt };
  }

  const trialEndsAt = billing?.trialEndsAt ?? (install?.createdAt ?? Date.now()) + TRIAL_DAYS * 24 * 60 * 60 * 1000;
  if (Date.now() < trialEndsAt) {
    return { entitled: true, reason: 'trial', trialEndsAt };
  }

  return {
    entitled: false,
    reason: billing ? 'trial_expired' : 'no_subscription',
    trialEndsAt,
  };
}
