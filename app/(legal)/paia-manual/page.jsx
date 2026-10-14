import LegalPage, { Email, LegalSection, TextLink } from "@/app/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "PAIA Manual",
  description:
    "Mlangeni Grand Hospitality's manual under section 51 of the Promotion of Access to Information Act: our contact details, the records we hold and how to request access to them.",
  alternates: { canonical: "/paia-manual" },
};

const SECTIONS = [
  { id: "introduction", title: "Introduction" },
  { id: "contact", title: "Contact details" },
  { id: "guide", title: "The Information Regulator’s guide" },
  { id: "automatic", title: "Records available without a request" },
  { id: "legislation", title: "Records kept under other laws" },
  { id: "categories", title: "Categories of records we hold" },
  { id: "personal-information", title: "Processing of personal information" },
  { id: "procedure", title: "How to request access" },
  { id: "refusal", title: "Grounds for refusal" },
  { id: "remedies", title: "Remedies" },
  { id: "availability", title: "Availability of this manual" },
];

const LAWS = [
  "Basic Conditions of Employment Act, 1997",
  "Companies Act, 2008",
  "Compensation for Occupational Injuries and Diseases Act, 1993",
  "Consumer Protection Act, 2008",
  "Electronic Communications and Transactions Act, 2002",
  "Employment Equity Act, 1998",
  "Income Tax Act, 1962",
  "Labour Relations Act, 1995",
  "Occupational Health and Safety Act, 1993",
  "Protection of Personal Information Act, 2013",
  "Skills Development Levies Act, 1999",
  "Tax Administration Act, 2011",
  "Unemployment Insurance Act, 2001",
  "Value-Added Tax Act, 1991",
];

const CATEGORIES = [
  ["Company records", "Founding and registration documents, ownership records and minutes."],
  ["Financial records", "Accounting records, invoices, payment records, bank statements and tax returns."],
  ["Client records", "Enquiries, accounts, bookings, quotes, menus, consultation notes, invoices, payments, correspondence and reviews."],
  ["Supplier records", "Agreements, orders, invoices and correspondence with suppliers and service providers."],
  ["Employee records", "Employment contracts, payroll, leave and tax records, and other records employment law requires."],
  ["Operational records", "Menus, recipes, event plans, policies and procedures."],
  ["Website and systems", "Account records, system logs and security records."],
];

export default function PaiaManualPage() {
  return (
    <LegalPage
      path="/paia-manual"
      title="PAIA Manual"
      lead="This manual is published under section 51 of the Promotion of Access to Information Act, 2000 (PAIA). It describes the records we hold and how you can request access to them."
      sections={SECTIONS}
    >
      <LegalSection id="introduction" title="1. Introduction">
        <p>
          PAIA gives everyone the right to request access to records held by a
          private body where those records are needed to exercise or protect a
          right. {SITE.name} is a private body under PAIA. This manual explains
          what records we hold and the procedure for requesting them.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="2. Contact details">
        <ul>
          <li>
            <strong>Name of private body:</strong> {SITE.name}
          </li>
          <li>
            <strong>Location:</strong> {SITE.locality}, South Africa
          </li>
          <li>
            <strong>Information Officer:</strong> the head of the business, who
            acts as Information Officer under PAIA and POPIA
          </li>
          <li>
            <strong>Email for requests:</strong> <Email />
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="guide" title="3. The Information Regulator’s guide">
        <p>
          The Information Regulator publishes a guide on how to use PAIA and
          POPIA, as section 10 of PAIA requires. It is available in all
          official languages from the Regulator’s website,{" "}
          <a
            href="https://inforegulator.org.za"
            rel="noopener noreferrer"
            target="_blank"
            className="rounded-sm text-mgh-text underline decoration-mgh-line-strong underline-offset-4 transition-colors hover:decoration-mgh-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mgh-gold focus-visible:ring-offset-2 focus-visible:ring-offset-mgh-bg"
          >
            inforegulator.org.za
          </a>
          , and you may also ask us for a copy.
        </p>
      </LegalSection>

      <LegalSection id="automatic" title="4. Records available without a request">
        <p>
          The following are freely available on this website and do not need
          a PAIA request: information about our services, our{" "}
          <TextLink href="/privacy-policy">Privacy Policy</TextLink>, our{" "}
          <TextLink href="/terms">Terms &amp; Conditions</TextLink>, our{" "}
          <TextLink href="/popia">POPIA Compliance</TextLink> statement and
          this manual. Customers can also see their own bookings, invoices and
          payments in their dashboard at any time.
        </p>
      </LegalSection>

      <LegalSection id="legislation" title="5. Records kept under other laws">
        <p>Where they apply to our business, we keep records in terms of:</p>
        <ul className="sm:columns-2 sm:gap-8 [&>li]:break-inside-avoid">
          {LAWS.map((law) => (
            <li key={law}>{law}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection id="categories" title="6. Categories of records we hold">
        <dl className="divide-y divide-mgh-line rounded-card border border-mgh-line">
          {CATEGORIES.map(([name, detail]) => (
            <div key={name} className="grid gap-1 p-5 sm:grid-cols-[12rem_1fr] sm:gap-6">
              <dt className="font-medium text-mgh-text">{name}</dt>
              <dd>{detail}</dd>
            </div>
          ))}
        </dl>
        <p>
          Holding a record in one of these categories does not mean access will
          be granted. Each request is considered under PAIA, including the
          grounds for refusal below.
        </p>
      </LegalSection>

      <LegalSection id="personal-information" title="7. Processing of personal information">
        <ul>
          <li>
            <strong>Purpose:</strong> responding to enquiries; planning,
            delivering and invoicing events; managing accounts; publishing
            reviews with consent; meeting legal obligations; and, with consent,
            marketing.
          </li>
          <li>
            <strong>Categories of people:</strong> enquirers, customers and
            their event contacts, employees, suppliers and service providers.
          </li>
          <li>
            <strong>Categories of information:</strong> names, contact details,
            addresses, event details, dietary requirements, account details,
            invoice and payment records, correspondence, and reviews. For
            employees and suppliers, the information needed for employment and
            contracting.
          </li>
          <li>
            <strong>Recipients:</strong> our service providers for website hosting;
            database, file storage and sign-in (Supabase); email delivery (Resend); and
            payments (PayFast). Also authorities, where the law requires.
          </li>
          <li>
            <strong>Transfers outside South Africa:</strong> some service
            providers store information outside South Africa, under protections
            that meet section 72 of POPIA.
          </li>
          <li>
            <strong>Security measures:</strong> encrypted connections,
            role-based access so customers see only their own records, hashed
            passwords, and payments handled by PayFast without card details
            reaching us.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="procedure" title="8. How to request access">
        <ul>
          <li>
            Complete <strong>Form 2</strong> (Request for Access to Record),
            available from the Information Regulator’s website or from us.
          </li>
          <li>
            Email it to <Email /> with a copy of your identity document. If you
            are acting for someone else, include proof of your authority.
          </li>
          <li>
            Describe the records you want precisely enough for us to find them,
            the form of access you want (for example, an electronic copy), and
            the right you are seeking to exercise or protect.
          </li>
          <li>
            Fees are those prescribed in the PAIA regulations. We will tell you
            if a request fee or deposit applies before we proceed. No fee
            applies to a request for your own personal information.
          </li>
          <li>
            We will decide within 30 days of receiving a complete request. We
            may extend this once by up to 30 days where the law allows, and we
            will tell you if we do.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="refusal" title="9. Grounds for refusal">
        <p>
          PAIA requires or allows us to refuse access in certain cases,
          including to protect:
        </p>
        <ul>
          <li>the privacy of other people;</li>
          <li>commercial information of ours or of third parties;</li>
          <li>information supplied in confidence;</li>
          <li>the safety of individuals and property; and</li>
          <li>records that are legally privileged.</li>
        </ul>
        <p>If we refuse a request, we will give you our reasons in writing.</p>
      </LegalSection>

      <LegalSection id="remedies" title="10. Remedies">
        <p>
          We have no internal appeal procedure. If you are unhappy with our
          decision, you may lodge a complaint with the Information Regulator or
          apply to court within 180 days of being notified of the decision.
        </p>
      </LegalSection>

      <LegalSection id="availability" title="11. Availability of this manual">
        <p>
          This manual is available on this website. You may also request a
          copy free of charge by emailing <Email />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
