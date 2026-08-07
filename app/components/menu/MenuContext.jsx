"use client";

import { createContext, useContext, useReducer } from "react";
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
  eventDate: "",
  eventTypeId: "",
  eventLocation: "",
  startTime: "09:00",
  endTime: "17:00",
  notes: "",
  quoteSent: false,
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

export function reducer(state, action) {
  switch (action.type) {
    case "SET_MENU":
      return { ...state, menu: action.payload };
    case "SET_EVENT_TYPES":
      return { ...state, eventTypes: action.payload };
    case "SET_AUTH_USER":
      return { ...state, authUser: action.payload };
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
      return {
        ...state,
        beverageChoice: action.payload,
        beverageTypeChoice: null,
      };
    case "SET_BEVERAGE_TYPE":
      return { ...state, beverageTypeChoice: action.payload };
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
    case "SEND_QUOTE":
      return { ...state, quoteSent: true };
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

export function MenuProvider({ children, value }) {
  return <MenuCtx.Provider value={value}>{children}</MenuCtx.Provider>;
}

export const useMenu = () => useContext(MenuCtx);
