"use client";

import { createContext, useContext, useMemo, useReducer } from "react";
import { STEPS } from "./constants";

export const initialState = {
  step: 0,
  menu: null,
  eventTypes: [],
  authUser: null,
  existingCustomer: null,
  selections: { starters: [], mains: [], desserts: [], beverages: [] },
  beverageChoice: null,
  beverageTypeChoice: null,
  guests: "",
  /** A `Date` (or null) — never a string. See `availability.toDateKey`. */
  eventDate: null,
  eventTypeId: "",
  eventLocation: "",
  startTime: "09:00",
  endTime: "17:00",
  notes: "",
  quoteSent: false,
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  submitting: false,
  submitError: "",
  emailWarning: "",
};

export function reducer(state, action) {
  switch (action.type) {
    case "SET_MENU":
      return { ...state, menu: action.payload };
    case "SET_EVENT_TYPES":
      return { ...state, eventTypes: action.payload };
    case "SET_AUTH_USER":
      return {
        ...state,
        authUser: action.payload,
        // The quote is emailed to the account address, so seed it here rather
        // than leaving contactEmail permanently blank.
        contactEmail: action.payload?.email || state.contactEmail,
      };
    case "SET_EXISTING_CUSTOMER":
      return {
        ...state,
        existingCustomer: action.payload,
        contactName:
          (action.payload &&
            [action.payload.first_name, action.payload.last_name]
              .filter(Boolean)
              .join(" ")
              .trim()) ||
          state.contactName,
        contactPhone: action.payload?.phone_number || state.contactPhone,
        contactEmail: action.payload?.email || state.contactEmail,
      };
    case "NEXT_STEP":
      return { ...state, step: Math.min(state.step + 1, STEPS.length - 1) };
    case "PREV_STEP":
      return { ...state, step: Math.max(state.step - 1, 0) };
    case "GO_TO_STEP":
      return { ...state, step: action.payload };
    case "ADD_ITEM": {
      const cat = action.payload.category;
      if (
        state.selections[cat].find(
          (i) => i.item_id === action.payload.item.item_id,
        )
      )
        return state;
      return {
        ...state,
        selections: {
          ...state.selections,
          [cat]: [...state.selections[cat], action.payload.item],
        },
      };
    }
    case "REMOVE_ITEM": {
      const cat = action.payload.category;
      return {
        ...state,
        selections: {
          ...state.selections,
          [cat]: state.selections[cat].filter(
            (i) => i.item_id !== action.payload.id,
          ),
        },
      };
    }
    case "SET_BEVERAGE_CHOICE":
      // Clearing the basket matters: answering "yes", picking drinks, then
      // switching to "no" used to leave those drinks in the submitted order.
      return {
        ...state,
        beverageChoice: action.payload,
        beverageTypeChoice: null,
        selections: { ...state.selections, beverages: [] },
      };
    case "SET_BEVERAGE_TYPE": {
      // Narrowing the type keeps whatever is still valid rather than wiping
      // the lot — going from "both" to "alcoholic" shouldn't lose the wines.
      const keep = (item) => {
        if (action.payload === "both") return true;
        if (action.payload === "alcoholic") return !!item.is_alcoholic;
        return !item.is_alcoholic;
      };
      return {
        ...state,
        beverageTypeChoice: action.payload,
        selections: {
          ...state.selections,
          beverages: state.selections.beverages.filter(keep),
        },
      };
    }
    case "SET_GUESTS":
      return { ...state, guests: action.payload };
    case "SET_DATE":
      return { ...state, eventDate: action.payload };
    case "SET_EVENT_TYPE":
      return { ...state, eventTypeId: action.payload };
    case "SET_EVENT_LOCATION":
      return { ...state, eventLocation: action.payload };
    case "SET_START_TIME":
      return { ...state, startTime: action.payload };
    case "SET_END_TIME":
      return { ...state, endTime: action.payload };
    case "SET_NOTES":
      return { ...state, notes: action.payload };
    case "SET_CONTACT":
      return { ...state, [action.field]: action.payload };
    case "SET_SUBMITTING":
      return { ...state, submitting: action.payload };
    case "SET_SUBMIT_ERROR":
      return { ...state, submitError: action.payload, submitting: false };
    case "SET_EMAIL_WARNING":
      return { ...state, emailWarning: action.payload };
    case "SEND_QUOTE":
      return { ...state, quoteSent: true, submitting: false, submitError: "" };
    case "RESET":
      return {
        ...initialState,
        menu: state.menu,
        eventTypes: state.eventTypes,
        authUser: state.authUser,
        existingCustomer: state.existingCustomer,
        contactName: state.contactName,
        contactPhone: state.contactPhone,
        contactEmail: state.contactEmail,
      };
    default:
      return state;
  }
}

const MenuCtx = createContext(null);

/**
 * Owns the wizard state. Pass `value` only to drive the provider from outside
 * (tests, stories); normally just wrap the tree and use `useMenu()`.
 */
export function MenuProvider({ children, value }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ownValue = useMemo(() => ({ state, dispatch }), [state]);
  return (
    <MenuCtx.Provider value={value ?? ownValue}>{children}</MenuCtx.Provider>
  );
}

export function useMenu() {
  const ctx = useContext(MenuCtx);
  if (!ctx) {
    throw new Error("useMenu must be used inside a <MenuProvider>");
  }
  return ctx;
}
