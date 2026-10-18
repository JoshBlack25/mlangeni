import LegalPage, { Email, LegalSection, TextLink } from "@/app/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "POPIA Compliance",
  description:
    "How Mlangeni Grand Hospitality meets the Protection of Personal Information Act: our Information Officer, the eight conditions for lawful processing, your rights and how to complain.",
  alternates: { canonical: "/popia" },
};

const SECTIONS = [
  { id: "commitment", title: "Our commitment" },
  { id: "information-officer", title: "Information Officer" },
  { id: "conditions", title: "How we meet POPIA’s conditions" },
  { id: "rights", title: "Your rights" },
  { id: "requests", title: "Making a request" },
  { id: "marketing", title: "Direct marketing" },
  { id: "breaches", title: "Security compromises" },
  { id: "complaints", title: "Complaints" },
];

const CONDITIONS = [
  {
    name: "Accountability",
    how: "We have an Information Officer responsible for making sure we comply, and this page and our Privacy Policy set out how we do it.",
  },
  {
    name: "Processing limitation",
    how: "We collect only what we need to respond to enquiries and deliver events, and process it lawfully: with your consent, to carry out our agreement with you, or to meet legal obligations.",
  },
  {
    name: "Purpose specification",
    how: "We collect information for the specific purposes listed in our Privacy Policy and keep it only as long as those purposes, or the law, require.",
  },
  {
    name: "Further processing limitation",
    how: "We do not use your information for purposes unrelated to why it was collected. We do not sell it.",
  },
  {
    name: "Information quality",
    how: "You can see and update your contact details in your dashboard at any time, and ask us to correct anything else.",
  },
  {
    name: "Openness",
    how: "Our Privacy Policy and PAIA Manual are published on this site, and we tell you what we collect at the point we collect it.",
  },
  {
    name: "Security safeguards",
    how: "Information travels encrypted, access is restricted so customers see only their own records, card details are handled only by PayFast, and our service providers are bound to protect what they process for us.",
  },
  {
    name: "Data subject participation",
    how: "You can ask for a copy of your information, have it corrected or deleted, and object to its use, as described below.",
  },
];

export default function PopiaPage() {
  return (
    <LegalPage
      path="/popia"
      title="POPIA Compliance"
      lead="The Protection of Personal Information Act, 2013 (POPIA) protects how South African organisations collect and use personal information. This page explains how we meet it and how you can exercise your rights."
      sections={SECTIONS}
    >
      <LegalSection id="commitment" title="1. Our commitment">
        <p>
          Planning an event means trusting us with names, contact details,
          addresses and sometimes dietary or health information. We treat that
          information with care and handle it in line with POPIA. Our{" "}
          <TextLink href="/privacy-policy">Privacy Policy</TextLink> lists
          exactly what we collect and why.
        </p>
      </LegalSection>

      <LegalSection id="information-officer" title="2. Information Officer">
        <p>
          Our Information Officer oversees compliance with POPIA and the
          Promotion of Access to Information Act (PAIA), and handles requests
          and complaints about personal information.
        </p>
        <ul>
          <li>
            <strong>Organisation:</strong> {SITE.name}
          </li>
          <li>
            <strong>Location:</strong> {SITE.locality}, South Africa
          </li>
          <li>
            <strong>Email:</strong> <Email />
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="conditions" title="3. How we meet POPIA’s conditions">
        <p>POPIA sets eight conditions for processing personal information lawfully. This is how we apply each one:</p>
        <dl className="divide-y divide-mgh-line rounded-card border border-mgh-line">
          {CONDITIONS.map((c, i) => (
            <div key={c.name} className="grid gap-1 p-5 sm:grid-cols-[13rem_1fr] sm:gap-6">
              <dt className="font-medium text-mgh-text">
                <span className="mr-2 tabular-nums text-mgh-gold">{i + 1}.</span>
                {c.name}
              </dt>
              <dd>{c.how}</dd>
            </div>
          ))}
        </dl>
      </LegalSection>

      <LegalSection id="rights" title="4. Your rights">
        <p>You have the right to:</p>
        <ul>
          <li>be told when your personal information is collected, and why;</li>
          <li>ask whether we hold personal information about you, and for a copy of it;</li>
          <li>ask us to correct, update or delete it;</li>
          <li>object to us processing it, including for direct marketing;</li>
          <li>withdraw any consent you have given; and</li>
          <li>complain to the Information Regulator.</li>
        </ul>
      </LegalSection>

      <LegalSection id="requests" title="5. Making a request">
        <p>
          Email <Email /> with your request. Tell us what you would like us to
          do, and use the email address linked to your account if you have one,
          so that we can confirm who you are. We may ask for proof of identity
          before releasing or changing information, to protect it from anyone
          else.
        </p>
        <p>
          There is no charge to correct or delete your information or to
          object to its use. Requests for copies of records follow the process
          in our <TextLink href="/paia-manual">PAIA Manual</TextLink>.
        </p>
      </LegalSection>

      <LegalSection id="marketing" title="6. Direct marketing">
        <p>
          We send marketing only to people who have agreed to receive it, or to
          customers about similar services, as section 69 of POPIA allows.
          Every message includes a way to opt out, and opting out never affects
          a booking.
        </p>
      </LegalSection>

      <LegalSection id="breaches" title="7. Security compromises">
        <p>
          If we have reason to believe that personal information has been
          accessed or acquired by someone without authority, we will notify
          the Information Regulator and the people affected as soon as
          reasonably possible, as section 22 of POPIA requires, with enough
          information for them to protect themselves.
        </p>
      </LegalSection>

      <LegalSection id="complaints" title="8. Complaints">
        <p>
          Please contact us first at <Email /> so that we can try to put things
          right. If you are not satisfied, you can lodge a complaint with the
          Information Regulator (South Africa) through its website,{" "}
          <a
            href="https://inforegulator.org.za"
            rel="noopener noreferrer"
            target="_blank"
            className="rounded-sm text-mgh-text underline decoration-mgh-line-strong underline-offset-4 transition-colors hover:decoration-mgh-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg"
          >
            inforegulator.org.za
          </a>
          , or by email at <Email address="enquiries@inforegulator.org.za" />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
