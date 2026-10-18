import LegalPage, { Email, LegalSection, TextLink } from "@/app/components/legal/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Terms & Conditions",
  description:
    "The terms that apply when you enquire, book an event, accept a quote or pay an invoice with Mlangeni Grand Hospitality.",
  alternates: { canonical: "/terms" },
};

const SECTIONS = [
  { id: "about", title: "About these terms" },
  { id: "enquiries", title: "Enquiries and quotes" },
  { id: "accounts", title: "Your account" },
  { id: "bookings", title: "Bookings" },
  { id: "payment", title: "Invoices and payment" },
  { id: "cancellations", title: "Changes and cancellations" },
  { id: "dietary", title: "Dietary requirements and allergies" },
  { id: "event-day", title: "On the day" },
  { id: "reviews", title: "Reviews" },
  { id: "website", title: "Using this website" },
  { id: "liability", title: "Liability" },
  { id: "general", title: "General" },
];

export default function TermsPage() {
  return (
    <LegalPage
      path="/terms"
      title="Terms & Conditions"
      lead="These terms apply when you use our website, send us an enquiry, create an account, book an event or pay an invoice. Please read them before you book."
      sections={SECTIONS}
    >
      <LegalSection id="about" title="1. About these terms">
        <p>
          These terms are an agreement between you and {SITE.name} (“we”,
          “us”). Anything specific we agree with you for your event, such as
          what is in your quote or invoice, applies alongside them. Where the
          two differ, the specific agreement for your event applies.
        </p>
        <p>
          Nothing in these terms limits the rights you have under the Consumer
          Protection Act, 2008, or any other law that cannot be excluded.
        </p>
      </LegalSection>

      <LegalSection id="enquiries" title="2. Enquiries and quotes">
        <ul>
          <li>
            An enquiry asks about availability. It does not reserve a date or
            create a booking.
          </li>
          <li>We aim to reply to every enquiry within 24 hours.</li>
          <li>
            Quotes, including those produced by our online Menu Builder, are
            based on the details you give us. The final price is the one on
            your invoice, which reflects anything agreed with us since the
            quote, such as changes to guest numbers or the menu.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="accounts" title="3. Your account">
        <ul>
          <li>Please give accurate details and keep them up to date.</li>
          <li>
            Keep your password private. You are responsible for activity on
            your account, so tell us straight away if you think someone else
            has used it.
          </li>
          <li>
            We may suspend an account that is used to misuse the site or to
            make bookings in bad faith.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="bookings" title="4. Bookings">
        <ul>
          <li>Events must be booked at least one month before the event date.</li>
          <li>
            You can have one pending booking at a time. Once it is confirmed or
            cancelled, you can make another.
          </li>
          <li>
            A date is held for you only once we confirm your booking. Until
            then it remains available to others.
          </li>
          <li>
            We may arrange a consultation with you to finalise the menu,
            logistics and other details before confirming.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="payment" title="5. Invoices and payment">
        <ul>
          <li>Prices are in South African rand (ZAR).</li>
          <li>
            Each invoice shows its due date, which is no later than seven days
            before your event.
          </li>
          <li>
            You can pay online through PayFast from your dashboard. PayFast’s
            own terms apply to the payment itself, and we never see or store
            your card details.
          </li>
          <li>
            <strong>
              If an invoice is not paid by its due date, the booking it relates
              to may be cancelled
            </strong>{" "}
            and the date released.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="cancellations" title="6. Changes and cancellations">
        <ul>
          <li>
            You can cancel a booking that we have not yet confirmed from your
            dashboard at no cost.
          </li>
          <li>
            Changes to a confirmed booking need our agreement, as they can
            affect staffing, ingredients and price.
          </li>
          <li>
            Cancelling a confirmed booking is subject to the cancellation terms
            in your quote or invoice. The Consumer Protection Act lets you
            cancel an advance booking, and any cancellation charge must be
            reasonable.
          </li>
          <li>
            If we ever have to cancel, we will tell you as soon as possible and
            refund what you have paid for the cancelled services.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="dietary" title="7. Dietary requirements and allergies">
        <p>
          Tell us about allergies and dietary requirements when you book. We
          take great care with them, but our kitchens handle common allergens,
          so we cannot guarantee that any dish is completely free of them
          unless we have agreed that with you in writing.
        </p>
      </LegalSection>

      <LegalSection id="event-day" title="8. On the day">
        <ul>
          <li>
            Please make sure we have access to the venue, and to any kitchen
            facilities we agreed on, at the times arranged.
          </li>
          <li>
            Final guest numbers affect what we prepare, so let us know of
            changes as early as you can.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="reviews" title="9. Reviews">
        <p>
          You can review an event that has taken place. Reviews must be your
          honest account of your own experience. We check reviews before they
          are published and may decline ones that are offensive, unlawful or
          not about our service. Our{" "}
          <TextLink href="/privacy-policy#reviews">Privacy Policy</TextLink>{" "}
          explains what a published review shows.
        </p>
      </LegalSection>

      <LegalSection id="website" title="10. Using this website">
        <ul>
          <li>
            The content, photography and branding on this site belong to us or
            are used with permission. Please don’t copy them without asking.
          </li>
          <li>
            Don’t attempt to interfere with the site, access accounts or data
            that aren’t yours, or submit forms automatically or in bulk.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="liability" title="11. Liability">
        <p>
          We are responsible for delivering the services we agree with you
          with reasonable care and skill. As far as the law allows, we are not
          liable for loss that we could not reasonably have foreseen or that
          is caused by events outside our reasonable control. Nothing here
          limits liability that cannot be limited by law.
        </p>
      </LegalSection>

      <LegalSection id="general" title="12. General">
        <p>
          We may update these terms from time to time; the version in force
          when you book applies to that booking. These terms are governed by
          the laws of South Africa. Questions are welcome at <Email />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
