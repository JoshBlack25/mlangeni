import assert from "node:assert/strict";
import test from "node:test";
import {
  consultationStatusLabel,
  getConsultationOrderItems,
  isActiveConsultation,
  formatConsultationDate,
  formatConsultationTime,
} from "./consultationPresentation.js";

test("requested consultations stay active while their booking is pending", () => {
  const consultation = { status: "requested", order: { status: "pending" } };
  assert.equal(isActiveConsultation(consultation), true);
  assert.equal(consultationStatusLabel(consultation), "Active Consultation");
});

test("event dates and meeting times use the event's South African timezone", () => {
  assert.equal(formatConsultationDate("2026-11-20"), "20 Nov 2026");
  assert.equal(formatConsultationTime("2026-10-20T08:00:00Z"), "10:00");
  assert.equal(formatConsultationTime("18:00:00"), "18:00");
});

test("scheduled and completed consultation records stay in meeting history", () => {
  for (const status of ["scheduled", "completed"]) {
    const consultation = { status, order: { status: "pending" } };
    assert.equal(isActiveConsultation(consultation), false);
    assert.equal(consultationStatusLabel(consultation), "Meeting Scheduled");
  }
  assert.equal(isActiveConsultation(null), false);
});

test("cancelled orders cannot leave an active consultation chat", () => {
  assert.equal(
    isActiveConsultation({
      status: "requested",
      order: { status: "cancelled" },
    }),
    false,
  );
});

test("custom items show only the selected order's saved quantities and prices", () => {
  const items = getConsultationOrderItems({
    customer_menu_items: [
      {
        custom_menu_id: "custom",
        quantity: 20,
        menu_item: { name: "Pasta", price: "80.00" },
      },
    ],
    premade_menu: { premade_menu_items: [{ menu_item: { name: "Cake" } }] },
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].name, "Pasta");
  assert.equal(items[0].quantity, 20);
  assert.equal(items[0].price, "80.00");
});

test("package contents use the same quantities and labels as the admin review", () => {
  const items = getConsultationOrderItems({
    number_of_guest: 30,
    premade_menu: {
      name: "Dinner",
      premade_menu_items: [
        { menu_item: { item_id: "cake", name: "Cake", price: "25" } },
      ],
    },
  });
  assert.equal(items[0].quantity, 1);
  assert.equal(items[0].note, "Dinner");
  assert.deepEqual(getConsultationOrderItems(null), []);
});
