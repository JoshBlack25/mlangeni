import {
  LayoutDashboard,
  ClipboardList,
  Bell,
  CreditCard,
  ShoppingCart,
  UtensilsCrossed,
  Send,
  Star,
  User,
  CalendarCheck,
  Receipt,
  Wrench,
  CircleHelp,
} from "lucide-react";

// Routes and labels are unchanged from the old navbars; only grouping is new.
export const NAV = {
  customer: {
    home: "/dashboard/customer",
    groups: [
      { label: null, items: [{ title: "Dashboard", icon: LayoutDashboard, href: "/dashboard/customer" }] },
      {
        label: "Plan an event",
        items: [
          { title: "Booking", icon: ShoppingCart, href: "/dashboard/customer/booking" },
          { title: "Menu", icon: UtensilsCrossed, href: "/dashboard/customer/menu" },
          { title: "Enquire", icon: Send, href: "/dashboard/customer/enquiry" },
        ],
      },
      {
        label: "Your events",
        items: [
          { title: "Orders", icon: ClipboardList, href: "/dashboard/customer/orders" },
          { title: "Payments", icon: CreditCard, href: "/dashboard/customer/payments" },
          { title: "Reviews", icon: Star, href: "/dashboard/customer/reviews" },
        ],
      },
      {
        label: "Account",
        // On desktop these live in the bell and account menus.
        desktopHidden: true,
        items: [
          { title: "Notifications", icon: Bell, href: "/dashboard/customer/notifications" },
          { title: "Profile", icon: User, href: "/dashboard/customer/profile" },
          { title: "Support", icon: CircleHelp, href: "/dashboard/customer/support", mobileOnly: true },
        ],
      },
    ],
    tabs: [
      "/dashboard/customer",
      "/dashboard/customer/booking",
      "/dashboard/customer/orders",
      "/dashboard/customer/payments",
    ],
  },
  admin: {
    home: "/dashboard/admin",
    groups: [
      {
        label: "Today",
        items: [
          { title: "Home", icon: LayoutDashboard, href: "/dashboard/admin" },
          { title: "Notifications", icon: Bell, href: "/dashboard/admin/notifications" },
        ],
      },
      {
        label: "Pipeline",
        items: [
          { title: "Enquiries", icon: Send, href: "/dashboard/admin/enquiries" },
          {
            title: "Consultations",
            icon: CalendarCheck,
            href: "/dashboard/admin/consultations",
            // Active meetings is reached from consultations and has no nav item.
            also: ["/dashboard/admin/active-meetings"],
          },
          { title: "Orders", icon: ClipboardList, href: "/dashboard/admin/orders" },
        ],
      },
      {
        label: "Money",
        items: [{ title: "Invoices", icon: Receipt, href: "/dashboard/admin/invoices" }],
      },
      {
        label: "Content",
        items: [
          { title: "Reviews", icon: Star, href: "/dashboard/admin/tools/testimonials" },
          { title: "Tools", icon: Wrench, href: "/dashboard/admin/tools" },
        ],
      },
      {
        label: "Account",
        items: [{ title: "Profile", icon: User, href: "/dashboard/admin/profile" }],
      },
    ],
    tabs: [
      "/dashboard/admin",
      "/dashboard/admin/enquiries",
      "/dashboard/admin/orders",
      "/dashboard/admin/invoices",
    ],
  },
};

export function allItems(role) {
  return NAV[role].groups.flatMap((g) => g.items.map((item) => ({ ...item, group: g.label })));
}
