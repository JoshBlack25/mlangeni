-- =============================================================================
-- MLANGENI GUEST HOUSE — DATABASE SCHEMA REFERENCE
-- =============================================================================
--
-- WHAT THIS FILE IS
-- A complete, human-readable snapshot of the `public` schema of the hosted
-- Supabase project, generated from the live database catalogs. It exists so
-- that anyone joining this project can understand the data model without
-- opening the Supabase dashboard or guessing from the application code.
--
-- WHAT THIS FILE IS *NOT*
-- It is NOT a migration and it is NOT run by anything. Do not add it to the
-- numbered sequence in this directory and do not paste it into the SQL editor
-- against a database that already has these objects. The numbered files
-- (001..004) are the change history; this is a picture of the result.
--
-- Creating a fresh database from this file would also require the Supabase
-- platform schemas it depends on (auth.users in particular), so treat it as
-- documentation rather than a bootstrap script.
--
-- HOW TO REGENERATE
-- Everything below comes out of the system catalogs, so it can be rebuilt at
-- any time and should be whenever the schema changes. The quickest route is to
-- ask Claude Code (the Supabase MCP server is configured in .mcp.json):
--
--     "regenerate db/schema.sql from the live database"
--
-- If you prefer to do it by hand, the source of each section is named in that
-- section's header comment.
--
-- Generated: 2026-09-07
-- Project:   hzifwowfenglxigvpalb
--
-- =============================================================================


-- =============================================================================
-- 1. ORIENTATION — how the tables relate
-- =============================================================================
--
-- Two entry points create rows: the public enquiry form (anonymous) and the
-- authenticated customer dashboard. Everything else hangs off `customer`.
--
--   auth.users  (managed by Supabase Auth — not defined in this file)
--     |
--     +--< admin.user_id          unique, on delete cascade
--     +--< customer.user_id       unique, on delete cascade
--     +--< enquiries.user_id      nullable, on delete set null
--     +--< notifications.user_id  recipient, on delete cascade
--     +--< notifications.sender_id  nullable, on delete set null
--
--   CATALOG (publicly readable — this is the browsable menu)
--     category --< menu_item
--     premade_menu --< premade_menu_items >-- menu_item
--     event_type
--     services
--
--   BOOKING PIPELINE
--     customer --< orders                     the booking itself
--                    |  >-- event_type        required
--                    |  >-- premade_menu      optional
--                    +--< customer_menu_items >-- menu_item    (a la carte)
--                    +--< order_items         >-- services     (add-on services)
--                    +--< consultations       optional follow-up meeting
--
--   BILLING
--     customer --< consultations --< invoices --< payments
--     (note: invoices hang off the CONSULTATION, not the order)
--
--   SOCIAL
--     customer --< testimonials   moderated: pending -> approved / rejected
--
-- NAMING NOTE
-- Primary keys are inconsistent across tables — mostly `<table>_id`, but
-- `enquiries` uses `id`, `customer_menu_items` uses `custom_menu_id`, and
-- `event_type` uses `event_id` (not `event_type_id`). Check the DDL rather
-- than assuming a pattern. Every table carries `created_at` / `updated_at`.


-- =============================================================================
-- 2. ENUM TYPES
-- =============================================================================
-- Source: pg_type join pg_enum
--
-- These are strict. Comparing an enum column against a label that does not
-- exist raises 22P02 invalid_text_representation and fails the whole query --
-- it is not a silent no-op. See db/002 for a bug this actually caused.

create type consultation_status   as enum ('requested', 'scheduled', 'completed', 'cancelled');
create type enquiry_status        as enum ('pending', 'confirmed', 'cancelled');
create type invoice_status        as enum ('draft', 'sent', 'paid', 'overdue', 'cancelled');
create type notification_category as enum ('order', 'enquiry', 'invoice', 'consultation', 'general');
create type order_status          as enum ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled');
create type payment_status        as enum ('pending', 'succeeded', 'failed', 'refunded');
create type testimonial_status    as enum ('pending', 'approved', 'rejected');


-- =============================================================================
-- 3. TABLES
-- =============================================================================
-- Source: pg_class / pg_attribute / pg_attrdef / pg_constraint
-- Foreign keys are listed separately in section 4 to keep the ordering valid.
-- Approximate row counts as of the generation date are noted per table.

-- Staff accounts. One row per admin; `is_admin()` reads this table.
create table admin (                                            -- ~1 row
  admin_id              uuid not null default gen_random_uuid(),
  user_id               uuid,
  first_name            text not null,
  last_name             text not null,
  phone_number          text not null,
  address               text not null,
  email                 text not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint admin_pkey PRIMARY KEY (admin_id),
  constraint admin_email_key UNIQUE (email),
  constraint admin_user_id_key UNIQUE (user_id)
);

-- Menu categories (Starters, Mains, ...).
create table category (                                         -- ~4 rows
  category_id           uuid not null default gen_random_uuid(),
  name                  text not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint category_pkey PRIMARY KEY (category_id),
  constraint category_name_key UNIQUE (name)
);

-- Follow-up meetings. Optionally tied to an order; invoices hang off these.
create table consultations (                                    -- ~3 rows
  consultations_id      uuid not null default gen_random_uuid(),
  order_id              uuid,
  customer_id           uuid not null,
  admin_id              uuid,
  status                consultation_status not null default 'requested'::consultation_status,
  meeting_date          timestamp with time zone not null,
  note                  text not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint consultations_pkey PRIMARY KEY (consultations_id)
);

-- Customer profiles. `current_customer_id()` maps auth.uid() -> customer_id.
create table customer (                                         -- ~6 rows
  customer_id           uuid not null default gen_random_uuid(),
  user_id               uuid,
  first_name            text,
  last_name             text,
  phone_number          text,
  address               text,
  email                 text not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint customer_pkey PRIMARY KEY (customer_id),
  constraint customer_email_key UNIQUE (email),
  constraint customer_user_id_key UNIQUE (user_id)
);

-- A la carte line items chosen in the Interactive Menu Builder.
-- `quantity` is set to the order's guest count by create_menu_order (db/003).
create table customer_menu_items (                              -- ~49 rows
  custom_menu_id        uuid not null default gen_random_uuid(),
  order_id              uuid not null,
  item_id               uuid not null,
  quantity              bigint not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint customer_menu_items_pkey PRIMARY KEY (custom_menu_id)
);

-- Public contact-form submissions. CONTAINS PII: name, email, phone, message.
-- `user_id` is set only when a signed-in customer submits; anonymous
-- submissions leave it null. See section 8 -- the read policy on this table is
-- currently wrong.
create table enquiries (                                        -- ~5 rows
  id                    uuid not null default gen_random_uuid(),
  name                  text not null,
  email                 text not null,
  phone                 text not null,
  event_date            date not null,
  session               text not null,
  guests                bigint not null,
  message               text,
  status                enquiry_status not null default 'pending'::enquiry_status,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  user_id               uuid,
  constraint enquiries_pkey PRIMARY KEY (id)
);

-- Event categories (Wedding, Corporate, ...). Note the PK is `event_id`.
create table event_type (                                       -- ~4 rows
  event_id              uuid not null default gen_random_uuid(),
  event_name            text not null,
  description           text not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint event_type_pkey PRIMARY KEY (event_id),
  constraint event_type_event_name_key UNIQUE (event_name)
);

-- Invoices attach to a CONSULTATION, not directly to an order.
create table invoices (                                         -- 0 rows (unused so far)
  invoices_id           uuid not null default gen_random_uuid(),
  consultation_id       uuid not null,
  total_amount          numeric(10,2) not null,
  status                invoice_status not null default 'draft'::invoice_status,
  due_date              timestamp with time zone not null,
  notes                 text not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint invoices_pkey PRIMARY KEY (invoices_id)
);

-- Individual dishes and drinks. `is_alcoholic` drives the beverage step;
-- `available` hides an item without deleting it.
create table menu_item (                                        -- ~13 rows
  item_id               uuid not null default gen_random_uuid(),
  category_id           uuid not null,
  name                  text not null,
  description           text not null,
  price                 numeric(10,2) not null,
  is_alcoholic          boolean not null default false,
  image_url             text,
  available             boolean not null default true,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint menu_item_pkey PRIMARY KEY (item_id)
);

-- In-app notifications. `user_id` is the recipient, `sender_id` the author.
-- Both reference auth.users directly, not customer/admin.
create table notifications (                                    -- ~5 rows
  notification_id       uuid not null default gen_random_uuid(),
  user_id               uuid not null,
  title                 text not null,
  message               text not null,
  is_read               boolean not null default false,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  link_url              text,
  sender_id             uuid,
  category              notification_category not null default 'general'::notification_category,
  constraint notifications_pkey PRIMARY KEY (notification_id)
);

-- Add-on services attached to an order (staffing, equipment, ...).
create table order_items (                                      -- 0 rows (unused so far)
  order_items_id        uuid not null default gen_random_uuid(),
  order_id              uuid not null,
  service_id            uuid not null,
  quantity              bigint not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint order_items_pkey PRIMARY KEY (order_items_id)
);

-- The booking. This is the centre of the model.
--
-- `event_range` is a tsrange over [event_date + start_time, event_date +
-- end_time) and backs the orders_no_overlap exclusion constraint, which is the
-- database's authority on double-booking. IMPORTANT: it is an ordinary column
-- with a DEFAULT, not a generated column, and no trigger maintains it -- so it
-- is computed on INSERT only and goes stale if event_date, start_time or
-- end_time are later UPDATEd. See section 8.
create table orders (                                           -- ~17 rows
  order_id              uuid not null default gen_random_uuid(),
  customer_id           uuid not null,
  event_type_id         uuid not null,
  premade_menu_id       uuid,
  status                order_status not null default 'pending'::order_status,
  total_price           numeric(10,2) not null,
  event_date            date not null,
  event_location        text not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  start_time            time without time zone not null default '09:00:00'::time without time zone,
  end_time              time without time zone not null default '17:00:00'::time without time zone,
  event_range           tsrange default tsrange((event_date + start_time), (event_date + end_time)),
  number_of_guest       bigint,
  special_requests      text,
  constraint orders_pkey PRIMARY KEY (order_id),
  constraint orders_no_overlap EXCLUDE USING gist (event_range WITH &&) WHERE ((status <> 'cancelled'::order_status)),
  constraint orders_time_check CHECK ((end_time > start_time))
);

-- Payment records. `stripe_payment_id` is unique; Stripe is not yet wired up.
create table payments (                                         -- 0 rows (unused so far)
  payments_id           uuid not null default gen_random_uuid(),
  invoice_id            uuid not null,
  amount                numeric(10,2) not null,
  stripe_payment_id     text not null,
  status                payment_status not null default 'pending'::payment_status,
  date                  timestamp with time zone not null default now(),
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint payments_pkey PRIMARY KEY (payments_id),
  constraint payments_stripe_payment_id_key UNIQUE (stripe_payment_id)
);

-- Curated set menus offered as an alternative to building a menu item by item.
create table premade_menu (                                     -- ~2 rows
  premade_menu_id       uuid not null default gen_random_uuid(),
  name                  text not null,
  description           text not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint premade_menu_pkey PRIMARY KEY (premade_menu_id)
);

-- Join table: which menu_items make up a premade_menu.
-- The only non-uuid primary key in the schema.
create table premade_menu_items (                               -- ~4 rows
  premade_menu_items_id bigint not null generated by default as identity,
  premade_menu_id       uuid not null,
  item_id               uuid not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint premade_menu_items_pkey PRIMARY KEY (premade_menu_items_id)
);

-- Add-on services catalogue.
create table services (                                         -- 0 rows (unused so far)
  service_id            uuid not null default gen_random_uuid(),
  name                  text not null,
  price                 numeric(10,2) not null,
  description           text not null,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint services_pkey PRIMARY KEY (service_id)
);

-- Customer reviews, moderated before they appear publicly.
create table testimonials (                                     -- 0 rows (unused so far)
  testimonial_id        uuid not null default gen_random_uuid(),
  customer_id           uuid not null,
  rating                smallint not null,
  message               text not null,
  status                testimonial_status not null default 'pending'::testimonial_status,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  constraint testimonials_pkey PRIMARY KEY (testimonial_id),
  constraint testimonials_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


-- =============================================================================
-- 4. FOREIGN KEYS
-- =============================================================================
-- Source: pg_constraint where contype = 'f'
--
-- Delete behaviour is deliberate and worth reading: deleting an auth user
-- cascades away their admin/customer profile and everything below it, but an
-- enquiry survives (user_id -> null) so the business keeps the lead.

alter table admin add constraint admin_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table consultations add constraint consultations_admin_id_fkey
  FOREIGN KEY (admin_id) REFERENCES admin(admin_id) ON UPDATE CASCADE ON DELETE SET NULL;
alter table consultations add constraint consultations_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON UPDATE CASCADE ON DELETE CASCADE;
alter table consultations add constraint consultations_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE SET NULL;

alter table customer add constraint customer_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table customer_menu_items add constraint customer_menu_items_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES menu_item(item_id) ON UPDATE CASCADE ON DELETE CASCADE;
alter table customer_menu_items add constraint customer_menu_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;

alter table enquiries add constraint enquiries_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table invoices add constraint invoices_consultation_id_fkey
  FOREIGN KEY (consultation_id) REFERENCES consultations(consultations_id) ON UPDATE CASCADE ON DELETE CASCADE;

alter table menu_item add constraint menu_item_category_id_fkey
  FOREIGN KEY (category_id) REFERENCES category(category_id) ON UPDATE CASCADE ON DELETE CASCADE;

alter table notifications add constraint notifications_sender_id_fkey
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table notifications add constraint notifications_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table order_items add constraint order_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES orders(order_id) ON UPDATE CASCADE ON DELETE CASCADE;
alter table order_items add constraint order_items_service_id_fkey
  FOREIGN KEY (service_id) REFERENCES services(service_id) ON UPDATE CASCADE ON DELETE CASCADE;

alter table orders add constraint orders_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON UPDATE CASCADE ON DELETE CASCADE;
alter table orders add constraint orders_event_type_id_fkey
  FOREIGN KEY (event_type_id) REFERENCES event_type(event_id) ON UPDATE CASCADE ON DELETE CASCADE;
alter table orders add constraint orders_premade_menu_id_fkey
  FOREIGN KEY (premade_menu_id) REFERENCES premade_menu(premade_menu_id) ON UPDATE CASCADE ON DELETE SET NULL;

alter table payments add constraint payments_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES invoices(invoices_id) ON UPDATE CASCADE ON DELETE CASCADE;

alter table premade_menu_items add constraint premade_menu_items_item_id_fkey
  FOREIGN KEY (item_id) REFERENCES menu_item(item_id) ON UPDATE CASCADE ON DELETE CASCADE;
alter table premade_menu_items add constraint premade_menu_items_premade_menu_id_fkey
  FOREIGN KEY (premade_menu_id) REFERENCES premade_menu(premade_menu_id) ON UPDATE CASCADE ON DELETE CASCADE;

alter table testimonials add constraint testimonials_customer_id_fkey
  FOREIGN KEY (customer_id) REFERENCES customer(customer_id) ON UPDATE CASCADE ON DELETE CASCADE;


-- =============================================================================
-- 5. INDEXES
-- =============================================================================
-- Source: pg_index (primary-key and unique-constraint indexes omitted --
-- those are implied by section 3)
--
-- Every foreign key in this schema is indexed, which is the right default and
-- worth preserving. The performance advisor reports most of these as "unused";
-- that reflects a database with almost no traffic yet, not dead weight. Do not
-- drop them on that basis until the tables have seen real load.

create index idx_consultations_admin_id       on consultations       using btree (admin_id);
create index idx_consultations_customer_id    on consultations       using btree (customer_id);
create index idx_consultations_order_id       on consultations       using btree (order_id);
create index idx_customer_menu_items_item_id  on customer_menu_items using btree (item_id);
create index idx_customer_menu_items_order_id on customer_menu_items using btree (order_id);
create index idx_enquiries_email              on enquiries           using btree (email);
create index idx_enquiries_status             on enquiries           using btree (status);
create index idx_enquiries_user_id            on enquiries           using btree (user_id);
create index idx_invoices_consultation_id     on invoices            using btree (consultation_id);
create index idx_menu_item_category_id        on menu_item           using btree (category_id);
create index idx_notifications_is_read        on notifications       using btree (is_read);
create index idx_notifications_sender_id      on notifications       using btree (sender_id);
create index idx_notifications_user_id        on notifications       using btree (user_id);
create index idx_order_items_order_id         on order_items         using btree (order_id);
create index idx_order_items_service_id       on order_items         using btree (service_id);
create index idx_orders_customer_id           on orders              using btree (customer_id);
create index idx_orders_event_type_id         on orders              using btree (event_type_id);
create index idx_orders_premade_menu_id       on orders              using btree (premade_menu_id);
create index idx_payments_invoice_id          on payments            using btree (invoice_id);
create index idx_premade_menu_items_item_id   on premade_menu_items  using btree (item_id);
create index idx_premade_menu_items_menu_id   on premade_menu_items  using btree (premade_menu_id);
create index idx_testimonials_customer_id     on testimonials        using btree (customer_id);
create index idx_testimonials_status          on testimonials        using btree (status);

-- The gist index backing orders_no_overlap is created by that constraint.


-- =============================================================================
-- 6. FUNCTIONS
-- =============================================================================
-- Source: pg_proc. Full bodies for the ones this repo owns are in the numbered
-- files; the rest predate them and live only in the database.
--
-- SECURITY DEFINER means the function runs as its owner and bypasses RLS. That
-- is the point for the helpers below, and it is also why their EXECUTE grants
-- matter as much as their bodies -- see db/004.
--
--   RLS HELPERS (called from inside policies)
--     is_admin()                  -> boolean   DEFINER  is the caller an admin?
--     is_admin_user(uuid)         -> boolean   DEFINER  is that user an admin?
--     current_customer_id()       -> uuid      DEFINER  auth.uid() -> customer_id
--     get_admin_user_ids()        -> setof     DEFINER  admin auth ids
--
--   APPLICATION RPCs
--     get_booked_slots(date,date) -> table     DEFINER  db/002. Availability for
--         the menu builder. Returns date and time window only -- nothing
--         identifying -- capped at 400 days.
--     create_menu_order(...)      -> uuid      INVOKER  db/003. Order plus line
--         items in one transaction. INVOKER on purpose: RLS still applies, so
--         this buys atomicity, not privilege.
--     get_calendar_events(date,date) -> table  DEFINER  Returns every order's
--         date, window and event type. No caller in the app references it.
--
--   TRIGGER FUNCTIONS
--     set_updated_at()            -> trigger   INVOKER  maintains updated_at
--     handle_new_user()           -> trigger   DEFINER  provisions a profile row
--                                                       on auth.users insert
--     rls_auto_enable()           -> event_trigger      DEFINER. Enables RLS on
--         newly created tables automatically. This is why every table in this
--         schema has RLS on -- do not assume a new table is unprotected, but
--         do confirm it has POLICIES, which this does not create.
--
-- Grants after db/004: only is_admin() is executable by anon (the testimonials
-- policy needs it). Everything else is authenticated-or-tighter.


-- =============================================================================
-- 7. ROW LEVEL SECURITY
-- =============================================================================
-- Source: pg_policies. RLS is ENABLED on all 17 tables.
--
-- Permissive policies are OR'd together: a row is visible if ANY policy allows
-- it. One broad policy therefore defeats every narrow one on the same
-- table/role/action. Bear that in mind when adding policies.
--
-- table                policy                                  roles   cmd     expression
-- -------------------- --------------------------------------- ------- ------- ----------------------------------------
-- admin                admins can view admin table             auth    SELECT  is_admin()
-- admin                admin can update own row                auth    UPDATE  user_id = auth.uid()
-- category             anyone can view categories              anon+   SELECT  true
-- category             admins manage categories                auth    ALL     is_admin()
-- consultations        customer can view own consultations      auth    SELECT  own OR is_admin()
-- consultations        customer can request a consultation      auth    INSERT  customer_id = current_customer_id()
-- consultations        admin manages consultations              auth    UPDATE  is_admin()
-- consultations        admin deletes consultations              auth    DELETE  is_admin()
-- customer             customer can view own row                auth    SELECT  own OR is_admin()
-- customer             customer can create own row              auth    INSERT  user_id = auth.uid()
-- customer             customer can update own row              auth    UPDATE  own OR is_admin()
-- customer_menu_items  customer can view own custom menu items  auth    SELECT  is_admin() OR owns parent order
-- customer_menu_items  customer can add own custom menu items   auth    INSERT  owns parent order
-- customer_menu_items  customer/admin can remove own ...        auth    DELETE  is_admin() OR owns parent order
-- enquiries            Allow public read on enquiries           public  SELECT  true          <-- SEE SECTION 8
-- enquiries            admins can view enquiries                auth    SELECT  is_admin()
-- enquiries            customer can view own enquiries          auth    SELECT  own OR is_admin()
-- enquiries            Allow public insert                      public  INSERT  true          <-- redundant
-- enquiries            anyone can submit an enquiry             anon+   INSERT  true
-- enquiries            admins can update enquiries              auth    UPDATE  is_admin()
-- enquiries            admins can delete enquiries              auth    DELETE  is_admin()
-- event_type           anyone can view event types              anon+   SELECT  true
-- event_type           admins manage event types                auth    ALL     is_admin()
-- invoices             customer can view own invoices           auth    SELECT  is_admin() OR own consultation
-- invoices             admin manages invoices                   auth    INSERT  is_admin()
-- invoices             admin updates invoices                   auth    UPDATE  is_admin()
-- invoices             admin deletes invoices                   auth    DELETE  is_admin()
-- menu_item            anyone can view menu items               anon+   SELECT  true
-- menu_item            admins manage menu items                 auth    ALL     is_admin()
-- notifications        user can view own notifications          auth    SELECT  user_id = auth.uid()
-- notifications        admin can create notifications           auth    INSERT  is_admin() AND sender is self
-- notifications        customer can create notification         auth    INSERT  sender is self AND recipient is admin
-- notifications        user can update own notifications        auth    UPDATE  user_id = auth.uid()
-- notifications        user can delete own notifications        auth    DELETE  own OR is_admin()
-- order_items          customer can view own order items        auth    SELECT  is_admin() OR owns parent order
-- order_items          customer can add items to own orders     auth    INSERT  owns parent order
-- order_items          admin manages order items                auth    UPDATE  is_admin()
-- order_items          admin deletes order items                auth    DELETE  is_admin() OR owns parent order
-- orders               customer can view own orders             auth    SELECT  own OR is_admin()
-- orders               customer can create own orders           auth    INSERT  customer_id = current_customer_id()
-- orders               customer can update own orders, admin any auth   UPDATE  own OR is_admin()
-- orders               admin can delete orders                  auth    DELETE  is_admin()
-- payments             customer can view own payments           auth    SELECT  is_admin() OR own invoice chain
-- payments             admin manages payments                   auth    INSERT  is_admin()
-- payments             admin updates payments                   auth    UPDATE  is_admin()
-- payments             admin deletes payments                   auth    DELETE  is_admin()
-- premade_menu         anyone can view premade menus            anon+   SELECT  true
-- premade_menu         admins manage premade menus              auth    ALL     is_admin()
-- premade_menu_items   anyone can view premade menu items       anon+   SELECT  true
-- premade_menu_items   admins manage premade menu items         auth    ALL     is_admin()
-- services             anyone can view services                 anon+   SELECT  true
-- services             admins manage services                   auth    ALL     is_admin()
-- testimonials         anyone can view approved testimonials    anon+   SELECT  status='approved' OR is_admin()
-- testimonials         customer can submit own testimonial      auth    INSERT  customer_id = current_customer_id()
-- testimonials         admin manages testimonials               auth    UPDATE  is_admin()
-- testimonials         customer can edit own pending testimonial auth   UPDATE  own AND status='pending'
-- testimonials         customer or admin can delete own/any ...  auth    DELETE  own OR is_admin()
--
--   auth   = authenticated       anon+  = anon and authenticated
--   public = the PUBLIC role, which INCLUDES anon -- broader than "anon+"


-- =============================================================================
-- 8. KNOWN ISSUES
-- =============================================================================
-- Recorded here so the next person does not have to rediscover them. Neither
-- is fixed as of the generation date.
--
-- (a) `enquiries` IS READABLE BY ANYONE.  Severity: high.
--     The policy "Allow public read on enquiries" is granted to the PUBLIC
--     role with USING (true). Because permissive policies are OR'd, it
--     overrides "customer can view own enquiries" and "admins can view
--     enquiries" completely. Verified by querying as the anon role: all rows
--     are returned, including name, email, phone and message.
--
--     It cannot simply be dropped -- two public components depend on it:
--       app/sections/EnquiryForm.jsx
--       app/components/contact/SessionDropDown.jsx
--     Both read only `session` where event_date = X and status = 'confirmed',
--     i.e. availability, not personal data.
--
--     The fix is the pattern db/002 already established for `orders`: a narrow
--     SECURITY DEFINER function returning just the booked sessions for a date,
--     granted to anon, with the blanket policy dropped and both components
--     switched to .rpc(). "Allow public insert" should go at the same time --
--     it duplicates "anyone can submit an enquiry".
--
-- (b) `orders.event_range` GOES STALE ON UPDATE.  Severity: medium.
--     It is a plain column with a DEFAULT, not a generated column, and no
--     trigger recomputes it. So it is correct on INSERT and wrong afterwards if
--     event_date, start_time or end_time change. Since orders_no_overlap
--     excludes on event_range, a rescheduled booking is checked for conflicts
--     against its OLD time -- so a customer using "customer can update own
--     orders" can move a booking onto an already-taken slot without tripping
--     the constraint. Either make it a generated column or maintain it in a
--     BEFORE UPDATE trigger.
--
-- (c) 44 policies call is_admin() / current_customer_id() unwrapped.
--     Severity: low now, grows with the tables.
--     Writing `is_admin()` rather than `(select is_admin())` makes Postgres
--     re-evaluate the function once per row scanned instead of once per query.
--     Supabase's performance advisor only flags the `auth.*` form, so its
--     warning count understates this by about 4x.
