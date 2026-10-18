export function formatConsultationDate(value) {
  if (!value) return "TBC";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "TBC";

  return date.toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Johannesburg",
  });
}

export function formatConsultationTime(value) {
  if (!value) return "TBC";
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "TBC"
    : date.toLocaleTimeString("en-ZA", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Africa/Johannesburg",
      });
}

export function getConsultationCustomerName(customer) {
  const name =
    `${customer?.first_name ?? ""} ${customer?.last_name ?? ""}`.trim();
  return name || customer?.email || "Customer";
}

export function isActiveConsultation(consultation) {
  return (
    consultation?.status === "requested" &&
    consultation?.order?.status !== "cancelled"
  );
}

export function consultationStatusLabel(consultation) {
  return isActiveConsultation(consultation)
    ? "Active Consultation"
    : "Meeting Scheduled";
}

export function getConsultationOrderItems(order) {
  const customItems = (order?.customer_menu_items ?? []).map((item) => ({
    id: item.custom_menu_id,
    name: item.menu_item?.name ?? "Menu item",
    quantity: item.quantity ?? 1,
    note: item.menu_item?.description ?? "Custom menu selection",
    price: item.menu_item?.price,
  }));

  if (customItems.length > 0) return customItems;

  return (order?.premade_menu?.premade_menu_items ?? []).map((item, index) => ({
    id: item.menu_item?.item_id ?? `package-${index}`,
    name: item.menu_item?.name ?? "Package item",
    quantity: 1,
    note: order.premade_menu.name,
    price: item.menu_item?.price,
  }));
}
