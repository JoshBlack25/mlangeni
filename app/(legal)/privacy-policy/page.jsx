import LegalPage, { Email, LegalSection, TextLink } from "@/app/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy",
  description:
    "What personal information Mlangeni Grand Hospitality collects when you enquire, book or pay, why we use it, who we share it with and how to exercise your rights under POPIA.",
  alternates: { canonical: "/privacy-policy" },
};

const SECTIONS = [
  { id: "who-we-are", title: "Who we are" },
  { id: "what-we-collect", title: "What we collect" },
  { id: "why", title: "Why we use it" },
  { id: "sharing", title: "Who we share it with" },
  { id: "cross-border", title: "Information stored outside South Africa" },
  { id: "storage", title: "Cookies and browser storage" },
  { id: "reviews", title: "Published reviews" },
  { id: "retention", title: "How long we keep it" },
  { id: "security", title: "How we protect it" },
  { id: "rights", title: "Your rights" },
  { id: "children", title: "Children" },
  { id: "changes", title: "Changes and contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      path="/privacy-policy"
      title="Privacy Policy"
      lead="This policy explains what personal information we collect when you visit our website, send an enquiry, create an account, book an event or pay an invoice, and how we look after it in line with the Protection of Personal Information Act, 2013 (POPIA)."
      sections={SECTIONS}
    >
      <LegalSection id="who-we-are" title="1. Who we are">
        <p>
          {SITE.name} (“we”, “us”) is a private-event catering and hospitality
          business based in {SITE.locality}, South Africa. For the purposes of
          POPIA we are the <strong>responsible party</strong> for the personal
          information described here.
        </p>
        <p>
          Questions about this policy, and requests about your information, go
          to our Information Officer at <Email />.
        </p>
      </LegalSection>

      <LegalSection id="what-we-collect" title="2. What we collect">
        <p>We only collect what we need to plan and deliver your event:</p>
        <ul>
          <li>
            <strong>Enquiries:</strong> your name, email address, phone number,
            preferred event date and session, number of guests and any message
            you include.
          </li>
          <li>
            <strong>Your account:</strong> your name, email address, phone
            number and address, and your password (which we never see in plain
            text). If you sign in with Google, Google shares your name and
            email address with us.
          </li>
          <li>
            <strong>Bookings and quotes:</strong> the event type, date, time,
            venue or address, guest numbers, your menu and beverage choices, and
            any culinary, dietary or logistical notes you give us.
          </li>
          <li>
            <strong>Payments:</strong> the invoice, amount, payment status and
            the reference PayFast gives us. Your card or bank details are
            entered on PayFast’s own secure pages and never reach our systems.
          </li>
          <li>
            <strong>Reviews and messages:</strong> the rating and review you
            write, and messages exchanged with us through your dashboard.
          </li>
          <li>
            <strong>Technical information:</strong> the basic information any
            web server receives, such as your IP address and browser type. We
            use it to keep the site running and to stop abuse, for example to
            limit repeated form submissions.
          </li>
        </ul>
        <p>
          <strong>Special personal information.</strong> Dietary notes can
          reveal information about health or religious belief, which POPIA
          treats as special personal information. Please share only what we
          need to cater safely. We use it for that purpose alone, with your
          consent, and you can withdraw that consent at any time.
        </p>
      </LegalSection>

      <LegalSection id="why" title="3. Why we use it">
        <ul>
          <li>To reply to your enquiry and check availability for your date.</li>
          <li>
            To prepare quotes, arrange consultations, plan and deliver your
            event, and keep you informed about it.
          </li>
          <li>To issue invoices, take payment and keep financial records.</li>
          <li>
            To run your account and keep it secure, including verifying who you
            are when you sign in.
          </li>
          <li>To publish reviews you have asked us to publish.</li>
          <li>To meet our legal obligations, such as tax record-keeping.</li>
          <li>
            To send you news or offers, but only if you have agreed to receive
            them. Every marketing message lets you opt out.
          </li>
        </ul>
        <p>
          We rely on your consent, on the need to carry out a contract with you
          (or take steps you asked for before one), on our legal obligations,
          and on our legitimate interest in running a safe and reliable
          service. We do not sell your personal information.
        </p>
      </LegalSection>

      <LegalSection id="sharing" title="4. Who we share it with">
        <p>
          We share personal information only with service providers who
          process it on our behalf and under our instructions (“operators” in
          POPIA terms):
        </p>
        <ul>
          <li>
            <strong>Supabase:</strong> our database, account sign-in and file
            storage.
          </li>
          <li>
            <strong>Resend:</strong> delivers our emails, such as enquiry
            confirmations and quotes.
          </li>
          <li>
            <strong>PayFast:</strong> processes online payments.
          </li>
          <li>
            <strong>Google:</strong> only if you choose to sign in with Google.
          </li>
          <li>
            <strong>WhatsApp:</strong> only if you choose to continue a
            conversation with us there.
          </li>
          <li>
            <strong>Our website hosting provider</strong>, which serves the
            site to you.
          </li>
        </ul>
        <p>
          We may also disclose information where the law requires it, or to
          protect our rights or someone’s safety.
        </p>
      </LegalSection>

      <LegalSection id="cross-border" title="5. Information stored outside South Africa">
        <p>
          Some of our service providers store or process information on
          servers outside South Africa. When that happens we use providers that
          are bound by data-protection laws or agreements giving protection
          comparable to POPIA, as section 72 of POPIA requires.
        </p>
      </LegalSection>

      <LegalSection id="storage" title="6. Cookies and browser storage">
        <p>
          We do not use advertising or analytics cookies. When you sign in, your
          browser stores a session token so that you stay signed in; signing
          out removes it.
        </p>
        <p>
          The phone number field shows country flags that are loaded from a
          third-party content network, which receives your IP address when the
          images load, as any web server does.
        </p>
      </LegalSection>

      <LegalSection id="reviews" title="7. Published reviews">
        <p>
          Reviews are checked by our team before they appear. A published
          review shows your rating, your words, your first name with the
          initial of your surname (for example, “Thandi M.”) and the type of
          event. You can edit a review while it is waiting for approval, and ask
          us to remove a published one at any time.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="8. How long we keep it">
        <p>
          We keep personal information only for as long as we need it for the
          purposes above, or for as long as the law requires. Financial
          records, such as invoices and payments, are kept for at least five
          years as South African tax law requires. When information is no
          longer needed we delete it or anonymise it.
        </p>
      </LegalSection>

      <LegalSection id="security" title="9. How we protect it">
        <ul>
          <li>Everything you send us travels over an encrypted (HTTPS) connection.</li>
          <li>Passwords are stored by our sign-in provider in hashed form.</li>
          <li>
            Database rules ensure each customer can see only their own
            bookings, invoices and messages, and only our staff can see others.
          </li>
          <li>Card details are handled by PayFast and never stored by us.</li>
        </ul>
        <p>
          If we believe your personal information has been accessed without
          authorisation, we will notify you and the Information Regulator as
          section 22 of POPIA requires.
        </p>
      </LegalSection>

      <LegalSection id="rights" title="10. Your rights">
        <p>Under POPIA you may:</p>
        <ul>
          <li>ask whether we hold information about you, and for a copy of it;</li>
          <li>ask us to correct or delete information that is wrong, out of date or no longer needed;</li>
          <li>object to how we process your information, including for direct marketing;</li>
          <li>withdraw consent you have given us; and</li>
          <li>lodge a complaint with the Information Regulator.</li>
        </ul>
        <p>
          Email <Email /> to use any of these rights. Our{" "}
          <TextLink href="/popia">POPIA page</TextLink> explains how we handle
          requests, and our <TextLink href="/paia-manual">PAIA Manual</TextLink>{" "}
          explains how to request access to records.
        </p>
      </LegalSection>

      <LegalSection id="children" title="11. Children">
        <p>
          Our services are for adults. We do not knowingly collect personal
          information from anyone under 18 without the consent of a parent or
          guardian.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="12. Changes and contact">
        <p>
          We may update this policy as our services change. The date at the top
          shows when it was last revised. Questions are welcome at <Email />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
