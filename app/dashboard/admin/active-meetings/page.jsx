"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ClipboardList, MapPin, Search } from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import {
  PageHeader,
  Panel,
  PanelHeader,
  Button,
  Field,
  Input,
  Figure,
  FigureRow,
  EngravedDate,
  EmptyState,
  SkeletonRows,
} from "@/app/components/dashboard/ui";

function formatDate(dateString) {
  if (!dateString) return "TBC";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "TBC";

  return new Date(dateString).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(dateString) {
  if (!dateString) return "TBC";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) return "TBC";

  return date.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCustomerName(customer) {
  if (!customer) return "Unknown customer";

  const name = `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim();

  return name || customer.email || "Unknown customer";
}

function getMeetingLocation(note, fallbackLocation) {
  const match = note?.match(/Meeting location:\s*([^\n]+)/i);

  return match?.[1]?.trim() || fallbackLocation || "Location pending";
}

function mapConsultationToMeeting(consultation) {
  const order = consultation.order;

  return {
    id: consultation.consultations_id,
    orderId: order?.order_id,
    customerName: getCustomerName(consultation.customer),
    customerEmail: consultation.customer?.email,
    customerPhone: consultation.customer?.phone_number,
    eventType: order?.event_type?.event_name ?? "Event type pending",
    eventDate: order?.event_date,
    meetingDate: consultation.meeting_date,
    meetingTime: consultation.meeting_date,
    guests: order?.number_of_guest ?? "TBC",
    location: getMeetingLocation(consultation.note, order?.event_location),
    orderTotal: order?.total_price,
  };
}

// The `next` hairline marks only the first meeting that is still ahead
// (the list is already ordered by meeting date).
function findNextMeetingId(meetings) {
  const now = Date.now();
  return (
    meetings.find((meeting) => {
      const time = new Date(meeting.meetingDate).getTime();
      return !Number.isNaN(time) && time >= now;
    })?.id ?? null
  );
}

function getSearchText(meeting) {
  return [
    meeting.customerName,
    meeting.customerEmail,
    meeting.customerPhone,
    meeting.eventType,
    meeting.eventDate,
    meeting.meetingDate,
    meeting.meetingTime,
    meeting.guests,
    meeting.location,
    meeting.orderTotal,
  ]
    .join(" ")
    .toLowerCase();
}

export default function AdminActiveMeetingsPage() {
  const [meetings, setMeetings] = useState(null);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const activeMeetings = meetings ?? [];
  const filteredMeetings = normalizedSearch
    ? activeMeetings.filter((meeting) =>
        getSearchText(meeting).includes(normalizedSearch),
      )
    : activeMeetings;
  const meetingCount = meetings?.length ?? 0;

  useEffect(() => {
    let mounted = true;

    async function loadActiveMeetings() {
      try {
        setError(null);

        const { data, error: meetingsError } = await supabase
          .from("consultations")
          .select(
            `
            consultations_id,
            meeting_date,
            note,
            customer:customer_id (
              first_name,
              last_name,
              email,
              phone_number
            ),
            order:order_id (
              order_id,
              total_price,
              event_date,
              event_location,
              number_of_guest,
              event_type ( event_name )
            ),
            invoices (
              invoices_id,
              status
            )
          `,
          )
          .eq("status", "scheduled")
          .not("order_id", "is", null)
          .order("meeting_date", { ascending: true });

        if (meetingsError) {
          throw meetingsError;
        }

        const uninvoicedMeetings = (data ?? []).filter(
          (consultation) =>
            !(consultation.invoices ?? []).some(
              (invoice) => invoice.status !== "draft",
            ),
        );

        if (mounted) {
          setMeetings(uninvoicedMeetings.map(mapConsultationToMeeting));
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || "Unable to load active meetings right now.");
          setMeetings([]);
        }
      }
    }

    loadActiveMeetings();

    return () => {
      mounted = false;
    };
  }, []);

  const nextMeetingId = findNextMeetingId(activeMeetings);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button variant="quiet" size="sm" href="/dashboard/admin" className="-ml-3">
          <ArrowLeft size={16} aria-hidden="true" className="text-mgh-dim" />
          Back to dashboard
        </Button>
      </div>

      <PageHeader
        density="dense"
        className="mb-0 md:mb-0"
        title="Scheduled Client Meetings"
        lead="Review meetings that were scheduled from consultation requests and prepare invoices once meeting details are confirmed."
        actions={
          <p className="text-sm tabular-nums text-mgh-muted">
            {meetings === null ? "..." : meetingCount} meetings awaiting invoice
            creation
          </p>
        }
      />

      <FigureRow>
        <Figure
          label="Meetings"
          value={meetingCount}
          loading={meetings === null}
          hint="Scheduled with customers"
        />
      </FigureRow>

      <Panel density="dense">
        <PanelHeader density="dense" title="Active Meetings" />

        <div className="mb-4">
          <Field label="Search order details" className="w-full md:max-w-md">
            <SearchInput
              id="active-meetings-search"
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by client, event, date, guests, or location"
            />
          </Field>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-control border border-mgh-danger/30 bg-mgh-danger/10 px-4 py-3 text-sm text-mgh-danger"
          >
            {error}
          </p>
        )}

        {meetings === null ? (
          <SkeletonRows rows={4} label="Loading active meetings" />
        ) : filteredMeetings.length === 0 ? (
          <EmptyState
            title={normalizedSearch ? "No matches" : "No active meetings"}
          >
            {normalizedSearch
              ? "No active meetings match your search."
              : "No active meetings have been scheduled yet."}
          </EmptyState>
        ) : (
          <>
            <div
              aria-hidden="true"
              className="hidden h-10 grid-cols-[2.75rem_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1fr)_4.5rem_auto] items-center gap-4 border-b border-mgh-line text-label font-semibold uppercase text-mgh-dim lg:grid"
            >
              <span className="sr-only">Date</span>
              <span>Client</span>
              <span>Meeting</span>
              <span>Event</span>
              <span className="text-right">Guests</span>
              <span className="text-right">Action</span>
            </div>

            <ul className="divide-y divide-mgh-line-soft">
              {filteredMeetings.map((meeting) => (
                <li
                  key={meeting.id}
                  className="grid grid-cols-[2.75rem_minmax(0,1fr)] items-center gap-x-4 gap-y-3 py-3 lg:grid-cols-[2.75rem_minmax(0,1.3fr)_minmax(0,0.8fr)_minmax(0,1fr)_4.5rem_auto]"
                >
                  <EngravedDate
                    date={meeting.meetingDate}
                    size="sm"
                    next={meeting.id === nextMeetingId}
                    className="row-span-2 self-start lg:row-span-1 lg:self-center"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-mgh-text">
                      {meeting.customerName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-caption text-mgh-muted">
                      <MapPin size={16} aria-hidden="true" className="shrink-0 text-mgh-dim" />
                      <span className="truncate">{meeting.location}</span>
                    </p>
                  </div>

                  {/* Phones: meeting, event and guests share one stacked block. */}
                  <dl className="col-start-2 grid grid-cols-2 gap-x-4 gap-y-1.5 lg:contents">
                    <div className="min-w-0">
                      <dt className="text-label font-semibold uppercase text-mgh-dim lg:sr-only">
                        Meeting
                      </dt>
                      <dd className="text-sm tabular-nums text-mgh-text">
                        {formatDate(meeting.meetingDate)}
                        <span className="text-mgh-muted">
                          {" · "}
                          {formatTime(meeting.meetingTime)}
                        </span>
                      </dd>
                    </div>

                    <div className="min-w-0">
                      <dt className="text-label font-semibold uppercase text-mgh-dim lg:sr-only">
                        Event
                      </dt>
                      <dd className="text-sm">
                        <span className="block truncate text-mgh-text">
                          {meeting.eventType}
                        </span>
                        <span className="block text-caption tabular-nums text-mgh-muted">
                          {formatDate(meeting.eventDate)}
                        </span>
                      </dd>
                    </div>

                    <div className="min-w-0 lg:text-right">
                      <dt className="text-label font-semibold uppercase text-mgh-dim lg:sr-only">
                        Guests
                      </dt>
                      <dd className="text-sm tabular-nums text-mgh-text">
                        {meeting.guests}
                      </dd>
                    </div>
                  </dl>

                  <div className="col-span-2 lg:col-span-1 lg:justify-self-end">
                    <Button
                      variant="secondary"
                      size="sm"
                      href={`/dashboard/admin/invoices/create?consultationId=${meeting.id}`}
                      className="h-10 w-full sm:w-auto lg:h-8"
                    >
                      <ClipboardList size={16} aria-hidden="true" className="text-mgh-dim" />
                      Create Invoice
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </div>
  );
}

function SearchInput(props) {
  return (
    <div className="relative">
      <Search
        size={16}
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-mgh-dim"
      />
      <Input {...props} className="pl-9" />
    </div>
  );
}
