import Link from "next/link";

const SERIF_L = `'Source Serif Pro', 'Iowan Old Style', 'Georgia', serif`;
const SANS_L  = `-apple-system, 'Inter', system-ui, sans-serif`;
const ACCENT  = "#6C5CE7";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ borderTop: "1px solid var(--ab-border)", paddingTop: 24, marginTop: 32 }}>
      <h2 style={{
        fontFamily: SERIF_L, fontSize: 22, fontWeight: 600,
        letterSpacing: "-.01em", marginBottom: 12, color: "var(--ab-fg)",
      }}>{title}</h2>
      <div style={{
        fontFamily: SERIF_L, fontSize: 15, lineHeight: 1.75,
        color: "var(--ab-muted)",
      }}>
        {children}
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--ab-bg)", color: "var(--ab-fg)", fontFamily: SANS_L, minHeight: "100vh" }}>

      {/* ── Masthead ── */}
      <div style={{
        borderBottom: "1px solid var(--ab-border)",
        padding: "18px 48px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: ACCENT,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="17" height="17" viewBox="0 0 64 64" fill="#fff" aria-hidden="true">
              <path d="M32 6 L34 30 L32 32 L30 30 Z" />
              <path d="M32 58 L30 34 L32 32 L34 34 Z" />
              <path d="M10 32 L30 30 L32 32 L30 34 Z" />
              <path d="M54 32 L34 34 L32 32 L34 30 Z" />
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", color: "var(--ab-fg)" }}>
            AlphaBrief
          </span>
        </Link>
        <span style={{ color: "var(--ab-faint)" }}>·</span>
        <span style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 13, color: "var(--ab-muted)" }}>
          Privacy &amp; Terms
        </span>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "56px 40px 96px" }}>

        {/* Page header */}
        <div style={{ borderBottom: "2px solid var(--ab-fg)", paddingBottom: 24, marginBottom: 8 }}>
          <div style={{
            fontFamily: SANS_L, fontSize: 10, letterSpacing: ".22em",
            textTransform: "uppercase", color: ACCENT, fontWeight: 700, marginBottom: 12,
          }}>Legal</div>
          <h1 style={{
            fontFamily: SERIF_L, fontSize: 52, fontWeight: 600,
            letterSpacing: "-.03em", lineHeight: 1.05, margin: 0,
          }}>
            Privacy &amp; Terms
          </h1>
          <p style={{
            fontFamily: SERIF_L, fontStyle: "italic", fontSize: 16,
            color: "var(--ab-muted)", marginTop: 14, marginBottom: 0,
          }}>
            Last updated April 2026. These terms govern your use of AlphaBrief.
          </p>
        </div>

        {/* ── Privacy Policy ── */}
        <Section title="Privacy Policy">
          <p style={{ marginBottom: 14 }}>
            AlphaBrief collects only the information needed to provide the service: your email address
            for authentication, and usage data (pages visited, features used) to improve the product.
            We do not sell or share your personal data with third parties for advertising.
          </p>
          <p style={{ marginBottom: 14 }}>
            <strong style={{ color: "var(--ab-fg)" }}>What we collect.</strong>{" "}
            Email address, subscription tier, watchlist items you create, and aggregate usage analytics
            (via server logs and Supabase). We do not collect payment card numbers directly — billing
            is handled by Stripe under their own privacy policy.
          </p>
          <p style={{ marginBottom: 14 }}>
            <strong style={{ color: "var(--ab-fg)" }}>Cookies.</strong>{" "}
            We set a single authentication session cookie to keep you logged in. We do not use
            third-party tracking or advertising cookies.
          </p>
          <p style={{ marginBottom: 14 }}>
            <strong style={{ color: "var(--ab-fg)" }}>Data retention.</strong>{" "}
            Account data is retained while your account is active. You may delete your account at any
            time from the Account settings page, which will permanently remove your data within 30 days.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "var(--ab-fg)" }}>Contact.</strong>{" "}
            Questions about your data? Email{" "}
            <a href="mailto:locmarkets@gmail.com" style={{ color: ACCENT, textDecoration: "none" }}>
              locmarkets@gmail.com
            </a>.
          </p>
        </Section>

        {/* ── Terms of Service ── */}
        <Section title="Terms of Service">
          <p style={{ marginBottom: 14 }}>
            By using AlphaBrief you agree to these terms. If you do not agree, please do not use the
            service.
          </p>
          <p style={{ marginBottom: 14 }}>
            <strong style={{ color: "var(--ab-fg)" }}>Not financial advice.</strong>{" "}
            AlphaBrief provides market information and AI-generated summaries for informational purposes
            only. Nothing on this platform constitutes investment advice, a recommendation to buy or
            sell any security, or a solicitation of any offer. Always do your own research and consult
            a qualified financial professional before making investment decisions.
          </p>
          <p style={{ marginBottom: 14 }}>
            <strong style={{ color: "var(--ab-fg)" }}>Acceptable use.</strong>{" "}
            You may not scrape, resell, or redistribute content from AlphaBrief without written
            permission. You may not use the service for any unlawful purpose or to transmit harmful
            content through the community chat.
          </p>
          <p style={{ marginBottom: 14 }}>
            <strong style={{ color: "var(--ab-fg)" }}>Subscriptions &amp; billing.</strong>{" "}
            Pro subscriptions are billed monthly. You may cancel at any time; cancellation takes
            effect at the end of the current billing period. Refunds are handled on a case-by-case
            basis — reach out within 7 days of a charge if you believe it was made in error.
          </p>
          <p style={{ margin: 0 }}>
            <strong style={{ color: "var(--ab-fg)" }}>Limitation of liability.</strong>{" "}
            AlphaBrief is provided &ldquo;as is.&rdquo; We are not liable for any financial losses, data loss, or
            consequential damages arising from use of the service. The service may be interrupted for
            maintenance without notice.
          </p>
        </Section>

        {/* ── Changes ── */}
        <Section title="Changes to these policies">
          <p style={{ margin: 0 }}>
            We may update these policies from time to time. If changes are material, we will notify
            registered users by email. Continued use of AlphaBrief after updates constitutes
            acceptance of the revised terms.
          </p>
        </Section>

        {/* ── Back link ── */}
        <div style={{ marginTop: 48, borderTop: "1px solid var(--ab-border)", paddingTop: 24 }}>
          <Link href="/" style={{
            fontFamily: SANS_L, fontSize: 11, fontWeight: 600,
            letterSpacing: ".08em", textTransform: "uppercase",
            color: "var(--ab-muted)", textDecoration: "none",
          }}>
            ← Back to AlphaBrief
          </Link>
        </div>

      </div>

      {/* ── Footer ── */}
      <div style={{
        padding: "22px 48px", background: "var(--ab-bg)",
        borderTop: "1px solid var(--ab-border)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 5, background: ACCENT,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 64 64" fill="#fff" aria-hidden="true">
              <path d="M32 6 L34 30 L32 32 L30 30 Z" />
              <path d="M32 58 L30 34 L32 32 L34 34 Z" />
              <path d="M10 32 L30 30 L32 32 L30 34 Z" />
              <path d="M54 32 L34 34 L32 32 L34 30 Z" />
            </svg>
          </div>
          <span style={{ fontFamily: SERIF_L, fontStyle: "italic", fontSize: 12, color: "var(--ab-muted)" }}>
            AlphaBrief · est. 2026
          </span>
        </div>
        <div style={{ fontSize: 12, color: "var(--ab-muted)", display: "flex", gap: 16 }}>
          <Link href="/#pricing" style={{ color: "var(--ab-muted)" }}>Pricing</Link>
          <Link href="/privacy" style={{ color: ACCENT }}>Privacy &amp; terms</Link>
        </div>
      </div>

    </div>
  );
}
