import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy & terms · AlphaBrief",
  description: "Privacy Policy and Terms of Use for AlphaBrief.",
};

const lastUpdated = "April 18, 2026";

const nav = [
  { id: "privacy-policy", label: "Privacy Policy" },
  { id: "terms-of-use", label: "Terms of Use" },
] as const;

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-6xl items-center px-6">
          <Link href="/" className="flex items-center gap-2 text-gray-900">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#6C5CE7]">
              <svg className="h-[18px] w-[18px] text-white" viewBox="0 0 64 64" fill="currentColor" aria-hidden="true">
                <path d="M32 6 L34 30 L32 32 L30 30 Z" />
                <path d="M32 58 L30 34 L32 32 L34 34 Z" />
                <path d="M10 32 L30 30 L32 32 L30 34 Z" />
                <path d="M54 32 L34 34 L32 32 L34 30 Z" />
              </svg>
            </div>
            <span className="text-base font-bold">AlphaBrief</span>
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-12 lg:flex lg:gap-16">
        <aside className="mb-12 shrink-0 lg:mb-0 lg:w-52">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Legal</p>
          <nav className="mt-4 space-y-0.5 border-l-2 border-gray-200" aria-label="Legal sections">
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block border-l-2 border-transparent py-2 pl-4 text-sm text-gray-600 transition hover:text-gray-900 -ml-0.5 hover:border-[#6C5CE7]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <article
            id="privacy-policy"
            className="scroll-mt-24 border-b border-gray-100 pb-16"
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Privacy Policy</h1>
            <p className="mt-2 text-sm text-gray-500">Last updated: {lastUpdated}</p>
            <p className="mt-8 text-base leading-relaxed text-gray-600">
              This Privacy Policy describes how AlphaBrief (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;)
              collects, uses, and shares information when you use our website and related services
              (the &quot;Service&quot;). Please read it carefully.
            </p>

            <Section title="1. Who we are">
              <p>
                AlphaBrief provides market news, timelines, watchlists, and related tools. For
                privacy purposes, we act as the controller of personal information described in this
                policy, except where a provider (such as our authentication vendor) determines
                certain processing on our behalf as described below.
              </p>
            </Section>

            <Section title="2. Information we collect">
              <ul className="list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-gray-800">Account and contact data.</strong> When you
                  create an account, we collect the email address you provide. We use it to
                  identify your account, send service-related messages, and—if you opt in—send
                  product emails such as digest notifications.
                </li>
                <li>
                  <strong className="text-gray-800">Authentication.</strong> Sign-in is handled by{" "}
                  <a
                    href="https://supabase.com"
                    className="text-[#6C5CE7] underline decoration-[#6C5CE7]/30 underline-offset-2 hover:decoration-[#6C5CE7]"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Supabase
                  </a>
                  , our authentication provider. Supabase processes credentials (such as your
                  password) using industry-standard security practices.{" "}
                  <strong className="text-gray-800">
                    We do not receive, store, or have access to your password in plain text.
                  </strong>{" "}
                  We may receive a user identifier and session tokens needed to keep you signed in.
                </li>
                <li>
                  <strong className="text-gray-800">Service data you choose to save.</strong> For
                  example, watchlists, saved tickers, digest preferences, and similar content you
                  store in the Service are stored in our backend (hosted with Supabase) and
                  associated with your account.
                </li>
                <li>
                  <strong className="text-gray-800">Technical and usage data.</strong> Like most
                  sites, we automatically collect certain information when you use the Service, such
                  as IP address, device/browser type, general location derived from IP, and log data
                  related to requests and errors. Our hosting and infrastructure providers may also
                  process similar data when delivering the Service.
                </li>
              </ul>
            </Section>

            <Section title="3. How we use information">
              <ul className="list-disc space-y-2 pl-5">
                <li>Provide, maintain, and improve the Service.</li>
                <li>Authenticate you and secure accounts.</li>
                <li>Send transactional or service-related email (for example, sign-up confirmation).</li>
                <li>
                  Send optional emails you request (for example, digest emails), where supported.
                </li>
                <li>Respond to inquiries, enforce our terms, and comply with law.</li>
              </ul>
            </Section>

            <Section title="4. How we share information">
              <p>We do not sell your personal information. We share information only as follows:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>
                  <strong className="text-gray-800">Service providers.</strong> We use vendors that
                  help us run the Service, including{" "}
                  <strong className="text-gray-800">Supabase</strong> (hosted database and
                  authentication),{" "}
                  <strong className="text-gray-800">Resend</strong> (email delivery when
                  configured), and hosting/infrastructure providers (for example, where the site is
                  deployed). They process data on our instructions and under contractual safeguards
                  appropriate to their role.
                </li>
                <li>
                  <strong className="text-gray-800">Legal and safety.</strong> We may disclose
                  information if required by law, or to protect rights, safety, and integrity of
                  users or the public.
                </li>
                <li>
                  <strong className="text-gray-800">Business transfers.</strong> If we are involved
                  in a merger or acquisition, information may be transferred as part of that
                  transaction, subject to appropriate notices and choices where required.
                </li>
              </ul>
            </Section>

            <Section title="5. Cookies and similar technologies">
              <p>
                We use cookies and similar technologies that are necessary for the Service to
                function (for example, to maintain your session after you log in). You can control
                cookies through your browser settings; disabling essential cookies may affect
                sign-in or core features.
              </p>
            </Section>

            <Section title="6. Retention">
              <p>
                We retain personal information for as long as your account is active or as needed to
                provide the Service, comply with legal obligations, resolve disputes, and enforce our
                agreements. You may request deletion of your account where applicable; some
                information may be retained in backups or as required by law.
              </p>
            </Section>

            <Section title="7. Security">
              <p>
                We implement reasonable technical and organizational measures designed to protect
                personal information. No method of transmission or storage is completely secure;
                we cannot guarantee absolute security.
              </p>
            </Section>

            <Section title="8. Your rights">
              <p>
                Depending on where you live, you may have rights to access, correct, delete, or
                restrict processing of your personal information, or to object to certain
                processing or portability. To exercise these rights, contact us using the methods
                described below. You may also lodge a complaint with a supervisory authority where
                applicable.
              </p>
            </Section>

            <Section title="9. International users">
              <p>
                We may process and store information in the United States and other countries where
                we or our providers operate. Those countries may have different data protection laws
                than your country of residence.
              </p>
            </Section>

            <Section title="10. Children">
              <p>
                The Service is not directed to children under 13 (or the minimum age required in
                your jurisdiction). We do not knowingly collect personal information from children.
              </p>
            </Section>

            <Section title="11. Changes to this policy">
              <p>
                We may update this Privacy Policy from time to time. We will post the updated
                version on this page and revise the &quot;Last updated&quot; date. Material changes
                may be communicated through the Service or by email where appropriate.
              </p>
            </Section>

            <Section title="12. Contact">
              <p>
                For privacy questions or requests, email us at{" "}
                <a
                  href="mailto:locmarkets@gmail.com"
                  className="text-[#6C5CE7] underline decoration-[#6C5CE7]/30 underline-offset-2 hover:decoration-[#6C5CE7]"
                >
                  locmarkets@gmail.com
                </a>
                . You can also reach us through the support or contact options we make available in
                the Service.
              </p>
            </Section>
          </article>

          <article id="terms-of-use" className="scroll-mt-24 pt-16">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">Terms of Use</h2>
            <p className="mt-2 text-sm text-gray-500">Last updated: {lastUpdated}</p>
            <p className="mt-8 text-base leading-relaxed text-gray-600">
              These Terms of Use (&quot;Terms&quot;) govern your access to and use of AlphaBrief
              (the &quot;Service&quot;). By using the Service, you agree to these Terms.
            </p>

            <Section title="1. The Service">
              <p>
                AlphaBrief is an independent market intelligence tool that provides AI-generated
                summaries and sentiment analysis of financial news, upcoming event timelines,
                watchlists, and exploratory market tools. The Service is provided for informational
                purposes only.{" "}
                <strong className="text-gray-800">
                  Nothing on the Service constitutes investment advice, financial advice, trading
                  advice, or any other sort of advice.
                </strong>{" "}
                You are solely responsible for your investment and trading decisions. We strongly
                recommend consulting a qualified financial advisor before making any investment
                decisions.
              </p>
            </Section>

            <Section title="2. AI-generated content">
              <p>
                Summaries, sentiment ratings, market impact assessments, and related analyses
                displayed on the Service are generated by artificial intelligence models. This
                content{" "}
                <strong className="text-gray-800">
                  may contain errors, inaccuracies, or outdated information
                </strong>{" "}
                and does not represent the views of the original news publishers or any financial
                institution. AI-generated sentiment ratings (bullish, bearish, neutral) are
                algorithmic estimates only and should not be used as the basis for investment
                decisions. We encourage you to read the original source articles for complete and
                accurate information.
              </p>
            </Section>

            <Section title="3. News sources and third-party data">
              <p>
                AlphaBrief aggregates news metadata — including headlines, publication dates, and
                source attribution — through third-party news and market data APIs. We display this
                metadata alongside AI-generated analysis; we do not reproduce full article text.
                Links to original articles open in a new window and direct you to the publisher&apos;s
                website. These links do not constitute an endorsement of or affiliation with those
                publishers. Your access to linked articles is subject to each publisher&apos;s own terms
                of service.
              </p>
            </Section>

            <Section title="4. Pro subscription">
              <p>
                AlphaBrief offers an optional paid Pro plan. Subscription fees are processed
                securely by Stripe. By subscribing, you authorize recurring charges to your payment
                method at the stated price until you cancel. You may cancel at any time from your
                account settings; cancellation takes effect at the end of the current billing
                period and no partial refunds are issued unless required by applicable law. We
                reserve the right to change Pro pricing with reasonable advance notice to
                subscribers.
              </p>
            </Section>

            <Section title="6. Eligibility and accounts">
              <p>
                You must be able to form a binding contract in your jurisdiction to use the
                Service. You are responsible for maintaining the confidentiality of your sign-in
                credentials managed through our authentication provider (Supabase). You agree to
                provide accurate information and notify us of unauthorized access if you become
                aware of it.
              </p>
            </Section>

            <Section title="7. Acceptable use">
              <p>You agree not to:</p>
              <ul className="mt-3 list-disc space-y-2 pl-5">
                <li>Use the Service in violation of law or third-party rights.</li>
                <li>
                  Attempt to probe, scan, or test the vulnerability of the Service, or breach
                  security or authentication measures.
                </li>
                <li>
                  Use automated means to access the Service in a way that imposes an unreasonable
                  load or circumvents rate limits or technical restrictions.
                </li>
                <li>Copy, scrape, or resell the Service or its data except as expressly permitted.</li>
                <li>Interfere with other users&apos; use of the Service.</li>
              </ul>
            </Section>

            <Section title="8. Third-party content and data">
              <p>
                The Service may display or link to content, data, or services from third parties
                (including market data and news sources). We do not control and are not
                responsible for third-party content or availability. Use of third-party services may
                be subject to their own terms.
              </p>
            </Section>

            <Section title="9. Intellectual property">
              <p>
                The Service, including its design, text, graphics, and software, is owned by Alpha
                Brief or its licensors and is protected by intellectual property laws. We grant you
                a limited, non-exclusive, non-transferable license to access and use the Service
                for personal, non-commercial purposes in line with these Terms.
              </p>
            </Section>

            <Section title="10. Disclaimers">
              <p>
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE,&quot; WITHOUT
                WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT
                WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR THAT CONTENT IS
                ACCURATE OR COMPLETE.
              </p>
            </Section>

            <Section title="11. Limitation of liability">
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, ALPHA BRIEF AND ITS AFFILIATES, OFFICERS,
                DIRECTORS, EMPLOYEES, AND AGENTS WILL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
                SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, OR
                GOODWILL, ARISING FROM YOUR USE OF THE SERVICE. OUR TOTAL LIABILITY FOR ANY CLAIM
                ARISING OUT OF OR RELATING TO THE SERVICE WILL NOT EXCEED THE GREATER OF (A) THE
                AMOUNT YOU PAID US FOR THE SERVICE IN THE TWELVE MONTHS BEFORE THE CLAIM OR (B)
                FIFTY U.S. DOLLARS (US$50), IF YOU HAVE NOT PAID ANYTHING. SOME JURISDICTIONS DO
                NOT ALLOW CERTAIN LIMITATIONS; IN THOSE CASES, OUR LIABILITY IS LIMITED TO THE
                FULLEST EXTENT PERMITTED BY LAW.
              </p>
            </Section>

            <Section title="12. Indemnity">
              <p>
                You will defend and indemnify AlphaBrief and its affiliates against claims, damages,
                losses, and expenses (including reasonable attorneys&apos; fees) arising from your
                use of the Service, your content, or your violation of these Terms.
              </p>
            </Section>

            <Section title="13. Suspension and termination">
              <p>
                We may suspend or terminate access to the Service at any time, with or without
                notice, for conduct that we believe violates these Terms or harms the Service or
                others. You may stop using the Service at any time. Provisions that by their nature
                should survive will survive termination.
              </p>
            </Section>

            <Section title="14. Changes">
              <p>
                We may modify these Terms from time to time. We will post the updated Terms on this
                page and update the &quot;Last updated&quot; date. Continued use after changes
                become effective constitutes acceptance of the revised Terms.
              </p>
            </Section>

            <Section title="15. Governing law">
              <p>
                These Terms are governed by the laws of the United States, without regard to
                conflict-of-law principles, except where mandatory local consumer protections
                apply. Courts in the United States shall have exclusive jurisdiction for disputes,
                subject to any rights you may have to bring claims in your local courts where
                required by law.
              </p>
            </Section>

            <Section title="16. Contact">
              <p>
                For questions about these Terms, email us at{" "}
                <a
                  href="mailto:locmarkets@gmail.com"
                  className="text-[#6C5CE7] underline decoration-[#6C5CE7]/30 underline-offset-2 hover:decoration-[#6C5CE7]"
                >
                  locmarkets@gmail.com
                </a>
                , or use the support options we provide in the Service.
              </p>
            </Section>
          </article>

          <p className="mt-12 text-center text-sm text-gray-500">
            <Link href="/" className="text-[#6C5CE7] hover:underline">
              ← Back to AlphaBrief
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-3 space-y-3 text-base leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}
