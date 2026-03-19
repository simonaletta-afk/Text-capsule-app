export default function PaywallScreenshot() {
  return (
    <div style={{
      width: 640,
      height: 920,
      backgroundColor: '#FAFAF9',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 8px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 18,
          backgroundColor: '#F3F4F6', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: '#6B7280',
        }}>✕</div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '0 28px',
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 40,
          backgroundColor: '#6366F1', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          marginBottom: 22, marginTop: 8,
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
        </div>

        <div style={{
          fontSize: 28, fontWeight: 700, color: '#1A1A2E',
          textAlign: 'center', marginBottom: 8,
        }}>Upgrade to Capsule Pro</div>

        <div style={{
          fontSize: 16, fontWeight: 400, color: '#6B7280',
          textAlign: 'center', marginBottom: 28, lineHeight: '24px',
        }}>Unlock unlimited messages to your future self</div>

        <div style={{
          width: '100%', backgroundColor: '#FFFFFF',
          borderRadius: 16, padding: '22px 22px',
          border: '1px solid #E5E7EB', marginBottom: 26,
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>
          {[
            { icon: '∞', text: 'Unlimited text capsules' },
            { icon: '📅', text: 'Custom delivery dates' },
            { icon: '⭐', text: 'Priority SMS delivery' },
            { icon: '❤️', text: 'Support indie development' },
          ].map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                backgroundColor: '#EEF2FF', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: 20, flexShrink: 0,
              }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 500, color: '#1A1A2E' }}>{f.text}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 14, width: '100%', marginBottom: 16 }}>
          <div style={{
            flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16,
            padding: '22px 16px', textAlign: 'center',
            border: '2px solid #E5E7EB',
          }}>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#6B7280', marginBottom: 6 }}>Monthly</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#1A1A2E' }}>$1.99</div>
            <div style={{ fontSize: 13, fontWeight: 400, color: '#9CA3AF', marginTop: 2 }}>/month</div>
          </div>

          <div style={{
            flex: 1, backgroundColor: '#EEF2FF', borderRadius: 16,
            padding: '22px 16px', textAlign: 'center',
            border: '2px solid #6366F1', position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
              backgroundColor: '#F59E0B', padding: '3px 12px',
              borderRadius: 10, fontSize: 10, fontWeight: 700, color: '#fff',
              whiteSpace: 'nowrap',
            }}>BEST VALUE</div>
            <div style={{ fontSize: 14, fontWeight: 500, color: '#6366F1', marginBottom: 6 }}>Yearly</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: '#6366F1' }}>$12.99</div>
            <div style={{ fontSize: 13, fontWeight: 400, color: '#6366F1', marginTop: 2 }}>/year</div>
          </div>
        </div>

        <div style={{
          fontSize: 12, fontWeight: 400, color: '#9CA3AF',
          textAlign: 'center', lineHeight: '18px', padding: '0 8px',
        }}>
          Yearly subscription at $12.99/year — that's just $1.08/month. Cancel anytime. Payment will be charged to your Apple ID account at confirmation of purchase. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period.
        </div>
      </div>

      <div style={{
        padding: '14px 28px 28px',
        borderTop: '1px solid #F3F4F6',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
      }}>
        <div style={{
          width: '100%', backgroundColor: '#6366F1',
          padding: '17px 0', borderRadius: 26,
          textAlign: 'center', fontSize: 18, fontWeight: 600, color: '#fff',
        }}>Continue</div>
        <div style={{ fontSize: 13, fontWeight: 400, color: '#9CA3AF' }}>Restore Purchases</div>
      </div>
    </div>
  );
}
