# Term 3 – Individual Submission

**Name:** Yaseen Kannemeyer
**Student Number:** _[your student number]_
**Project:** Mlangeni Catering – Booking & Menu Management System
**Group Members:** _[names]_
**My Role:** Menu Editor & Menu Builder, Testimonials, PayFast Payment Integration

> **How to use this template:** Anything in _[square brackets]_ or in a 📸 box is a placeholder. Replace it with your screenshot or text, then delete the instruction. For every screenshot, write one or two sentences underneath it saying what it shows.

---

## 1. Coding Progress

My part of the system is everything to do with the menu, plus customer testimonials and online payment. The menu has three parts that all read from the same Supabase data. The **Admin Menu Editor** is where the business owner manages the food. The **Customer Menu Builder** is where customers put together a menu for their event. The **public menu** is what visitors see. Because all three use the same `menu_item` and `category` tables, a change the admin makes in the editor shows up straight away in the builder and on the public menu, with no extra work.

### 1.1 Admin Menu Editor
The admin can create, edit and delete menu items. Each item has a name, description, price, category, an alcoholic flag and an availability toggle. Item images are uploaded to a Supabase Storage bucket (`menu-images`), and the image's public URL is saved on the menu item. The admin can also manage **premade packages**, which are ready-made menus made up of several items (`premade_menu` and `premade_menu_items`).

### 1.2 Customer Menu Builder
The Menu Builder is a step-by-step flow: **Event Details → Menu Selection → Beverages → Quote**. It shows a progress bar, a cart sidebar with a live running total, and a pop-up with the details of each item. On the event details step it checks the chosen date against existing bookings. It does this through a secure database function (`get_booked_slots`), so customers can't double-book a date or session, and it also enforces advance-booking rules. When the customer submits, the order is written straight to the `orders` table through the `create_menu_order` function, and a quote email is sent.

In my most recent work I refactored the booking and enquiry handling:
- I made the availability logic (`useAvailability.js`) easier to read and maintain.
- I expanded the validation (`validation.js`) to cover the advance-booking rules and session checks.
- The Menu Builder now detects when a customer already has a booking in progress and tells them, so they don't create a duplicate.
- The Enquiry Form now gets booked-session data through a secure RPC, so it doesn't read the table directly.
- I reverted an earlier database change (migration 006) so the Menu Builder writes directly to `orders` again, while keeping the security fixes from that change.
- I renamed `enquiryId` to `orderId` in the email templates and validation, so the naming is consistent across the app.

### 1.3 Testimonials
Customers can leave a review with a star rating and a message, but only for an event that actually happened (a non-cancelled order whose event date is in the past). The database enforces this rule, not just the front end. New reviews come in as **pending**. The admin then uses the Testimonials tool to approve or reject them, mark them as **featured** and set their **display order**. The homepage only shows approved testimonials, and it gets them through a function that only returns safe information, so no customer emails or phone numbers are ever exposed.

### 1.4 PayFast Payment Integration (Sandbox)
_[Describe your progress honestly, e.g. "Payment is integrated with the PayFast sandbox. When a customer chooses to pay for an order they are redirected to PayFast, and once payment is complete the payment is recorded in the `payments` table and the order is updated." If it isn't finished yet, say what is done and what remains.]_

### 1.5 Evidence of Commits

> 📸 **SCREENSHOT – GitHub commit history**
> Go to the GitHub repo → **Commits** and filter by your username. Take a screenshot showing your commits and merged pull requests (e.g. PR #49 "Refactor booking and enquiry handling").

> 📸 **SCREENSHOT – A pull request**
> Open one of your merged PRs and screenshot the description and the "Files changed" summary.

---

## 2. Improved User Interface Design (Implemented)

_[Write 2–3 sentences on what changed since your Term 2 design, e.g. a consistent colour scheme, a step-by-step builder in place of one long form, a live cart, a mobile layout, clearer error messages.]_

### 2.1 Public Menu
> 📸 **SCREENSHOT – Homepage menu / menu carousel** (`/`)
> Show the menu items with their images, loaded from the database.

### 2.2 Customer Menu Builder
> 📸 **SCREENSHOT – Step 1: Event Details** (`/dashboard/customer/booking/menubuilder`)
> Show the date picker and availability panel.

> 📸 **SCREENSHOT – Step 2: Menu Selection**
> Show the item cards, with the cart sidebar and running total visible.

> 📸 **SCREENSHOT – Item detail pop-up**
> Click an item and screenshot the modal.

> 📸 **SCREENSHOT – Step 3: Beverages**

> 📸 **SCREENSHOT – Step 4: Quote / Summary**
> Show the final quote before submitting.

> 📸 **SCREENSHOT – Menu Builder on a phone** (optional but recommended)
> In Chrome, press F12, turn on the device toolbar, choose iPhone and take the screenshot.

### 2.3 Customer Packages & Menu
> 📸 **SCREENSHOT – Packages page** (`/dashboard/customer/booking/packages`)

> 📸 **SCREENSHOT – Customer menu page** (`/dashboard/customer/menu`)

### 2.4 Admin Menu Editor
> 📸 **SCREENSHOT – Menu Editor list** (`/dashboard/admin/tools/menu-editor`)

> 📸 **SCREENSHOT – Add / Edit item form**
> Show the form with the image upload field.

> 📸 **SCREENSHOT – Package editor** (`/dashboard/admin/tools/menu-editor/packages`)

### 2.5 Testimonials
> 📸 **SCREENSHOT – Customer review form** (`/dashboard/customer/reviews`)

> 📸 **SCREENSHOT – Admin testimonials tool** (`/dashboard/admin/tools/testimonials`)
> Show the approve / reject / featured controls.

> 📸 **SCREENSHOT – Testimonials section on the homepage**

### 2.6 Payment (PayFast Sandbox)
> 📸 **SCREENSHOT – Pay button on the order / payments page** (`/dashboard/customer/payments`)

> 📸 **SCREENSHOT – PayFast sandbox checkout page**

> 📸 **SCREENSHOT – Payment success / return page**

---

## 3. Updated Data Design & Database Implementation

The system uses **Supabase (PostgreSQL)**. The tables below are the ones my features use. Row Level Security (RLS) is turned on, so customers can only see their own data, and anything sensitive goes through `SECURITY DEFINER` functions.

### 3.1 Entity Relationship Diagram
> 📸 **SCREENSHOT – Supabase Schema Visualizer**
> In Supabase go to **Database → Schema Visualizer**. Arrange the tables so `category`, `menu_item`, `premade_menu`, `premade_menu_items`, `orders`, `order_items`, `customer`, `testimonials` and `payments` are all visible with their relationships, then screenshot it.

### 3.2 Data Requirements (my tables)

| Table | Purpose | Key fields |
|---|---|---|
| `category` | Groups menu items (e.g. Mains, Desserts) | `category_id`, `name` |
| `menu_item` | Every food and drink item | `item_id`, `category_id` (FK), `name`, `description`, `price`, `is_alcoholic`, `image_url`, `available` |
| `premade_menu` | Ready-made packages | `premade_menu_id`, `name`, `description` |
| `premade_menu_items` | Links packages to items | `premade_menu_id` (FK), `item_id` (FK) |
| `orders` | A customer's event booking from the Menu Builder | `order_id`, `customer_id` (FK), `event_date`, session, `status` |
| `order_items` | The items chosen for an order | `order_id` (FK), `item_id` (FK), quantity |
| `testimonials` | Customer reviews | `testimonial_id`, `customer_id` (FK), `order_id` (FK), `rating`, `message`, `status`, `featured`, `display_order` |
| `payments` | PayFast payment records | _[fill in from Supabase]_ |

_[Check the columns against the Table Editor and correct anything that differs.]_

> 📸 **SCREENSHOT – `menu_item` table in the Table Editor** (showing real rows)

> 📸 **SCREENSHOT – `orders` table** (showing an order created by the Menu Builder)

> 📸 **SCREENSHOT – `testimonials` table** (showing the status / featured columns)

> 📸 **SCREENSHOT – `payments` table** (showing a sandbox payment row)

### 3.3 Database Functions (RPCs)

| Function | What it does |
|---|---|
| `create_menu_order` | Creates the order and its items in one step when the customer submits the Menu Builder |
| `get_booked_slots` | Returns which dates and sessions are taken, without exposing other customers' orders |
| `customer_may_review` | Checks that the customer has a past, non-cancelled order before they can review |
| `get_public_testimonials` | Returns approved testimonials with a safe display name for the homepage |

> 📸 **SCREENSHOT – Database → Functions** (list showing the functions above)

### 3.4 Security (RLS Policies)
_[Write 2–3 sentences, e.g. "Customers can only read and insert their own orders and testimonials. Only admins can edit menu items. Public visitors can't read the customer table at all; they only get data through the safe functions above."]_

> 📸 **SCREENSHOT – Authentication → Policies** for `menu_item` and `testimonials`

### 3.5 Storage
> 📸 **SCREENSHOT – Storage → `menu-images` bucket** showing the uploaded item images

---

## 4. Testing the System / Subsystem

**Testing approach:** _[e.g. "Manual functional testing of each feature in the browser, with the results checked in the Supabase Table Editor. PayFast was tested using the sandbox environment and test credentials."]_

For each test, put a screenshot of the result underneath. Where it makes sense, show **both** the app and the matching row in Supabase.

| # | Test | Steps | Expected Result | Pass / Fail |
|---|---|---|---|---|
| T1 | Admin adds a menu item | Menu Editor → Add item with image → Save | Item appears in the list, in `menu_item`, and on the public menu | |
| T2 | Admin edits price / availability | Change price, set to unavailable | Builder shows the new price; unavailable item is hidden | |
| T3 | Image upload | Upload an image in the editor | File appears in the `menu-images` bucket and shows on the item | |
| T4 | Menu Builder validation | Try to continue without an event date or guest count | Error message shown, can't continue | |
| T5 | Advance booking rule | Pick a date too close to today | Date is rejected with a message | |
| T6 | Double-booking prevention | Pick a date/session that is already booked | Shown as unavailable | |
| T7 | Active booking warning | Start the builder while a booking is already in progress | User is told they have an active booking | |
| T8 | Submit order | Complete all steps → Submit | New row in `orders` + `order_items`; quote email received | |
| T9 | Review without a past event | New customer tries to leave a review | Blocked | |
| T10 | Submit & approve review | Customer submits → Admin approves & features it | Shows on the homepage | |
| T11 | Rejected review hidden | Admin rejects a review | Not shown publicly | |
| T12 | PayFast sandbox payment | Pay for an order with sandbox test details | Redirects back as successful; row in `payments` | |
| T13 | Cancelled payment | Cancel on the PayFast page | Returns to the app; order stays unpaid | |
| T14 | Security check | Log in as a customer and try to open an admin tools URL | Access denied / redirected | |

### Test Evidence

**T1 – Admin adds a menu item**
> 📸 App: new item in the Menu Editor list
> 📸 Supabase: the new row in `menu_item`

**T4 – Menu Builder validation**
> 📸 App: the validation error message

**T6 – Double-booking prevention**
> 📸 App: the date/session shown as unavailable

**T8 – Submit order**
> 📸 App: the success / confirmation screen
> 📸 Supabase: the new row in `orders`
> 📸 Email inbox: the quote email

**T10 – Testimonial approved**
> 📸 Admin: the approve / featured controls
> 📸 Homepage: the testimonial displayed

**T12 – PayFast sandbox payment**
> 📸 PayFast sandbox checkout page
> 📸 App: payment success page
> 📸 Supabase: the row in `payments`

_[Add the rest of the tests in the same format.]_

### Bugs Found & Fixed
_[List 2–4 real issues you found while testing and how you fixed them. Example: "The Menu Builder allowed a customer to start a second booking while one was already in progress. I added an active-booking check that tells the user." Or: "The Enquiry Form was reading booked sessions directly from the table, so I moved it to a secure RPC."]_

---

## 5. Reflection / Next Steps
_[A short paragraph: what went well, what was challenging (for example, getting RLS right or PayFast callbacks), and what is still left to do before the final submission.]_
