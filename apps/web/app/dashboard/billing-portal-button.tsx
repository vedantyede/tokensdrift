'use client';

import { useState } from 'react';

export function BillingPortalButton({ installationId }: { installationId: number }) {
  const [status, setStatus] = useState<'idle' | 'working' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleClick() {
    setStatus('working');
    try {
      const res = await fetch('/api/billing-portal', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ installationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatus('error');
        setMessage(typeof data.error === 'string' ? data.error : `Request failed (${res.status})`);
        return;
      }
      window.location.href = data.url;
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Request failed.');
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-start' }}>
      <button
        onClick={handleClick}
        disabled={status === 'working'}
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          fontWeight: 600,
          padding: '8px 14px',
          borderRadius: 3,
          border: '1px solid var(--rule)',
          background: 'transparent',
          color: 'var(--ink)',
          cursor: 'pointer',
        }}
      >
        {status === 'working' ? 'Opening billing…' : 'Manage billing'}
      </button>
      {status === 'error' && <p style={{ color: 'var(--drift)', fontSize: 13 }}>{message}</p>}
    </div>
  );
}
