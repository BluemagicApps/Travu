import { isValidPassport, isValidPhone } from "@/lib/constants/countries";
import { isCardValid } from "./card";

export interface TravellerInput {
  firstName: string;
  middleName: string;
  lastName: string;
  dobDay: string;
  dobMonth: string;
  dobYear: string;
  passportNumber: string;
  passportCountry: string;
}

export interface ContactInput {
  email: string;
  emailConfirmed: boolean;
  phoneCountry: string;
  phone: string;
}

export interface PaymentInput {
  nameOnCard: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  billingCountry: string;
  billingAddress1: string;
  billingAddress2: string;
  postalCode: string;
  city: string;
}

export interface WizardState {
  travellers: TravellerInput[];
  contact: ContactInput;
  payment: PaymentInput;
}

export const emptyTraveller: TravellerInput = {
  firstName: "",
  middleName: "",
  lastName: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  passportNumber: "",
  passportCountry: "NG",
};

export const emptyContact: ContactInput = {
  email: "",
  emailConfirmed: true,
  phoneCountry: "NG",
  phone: "",
};

export const emptyPayment: PaymentInput = {
  nameOnCard: "",
  cardNumber: "",
  expiry: "",
  cvc: "",
  billingCountry: "NG",
  billingAddress1: "",
  billingAddress2: "",
  postalCode: "",
  city: "",
};

export function initialState(passengers: number): WizardState {
  return {
    travellers: Array.from({ length: passengers }, () => ({ ...emptyTraveller })),
    contact: { ...emptyContact },
    payment: { ...emptyPayment },
  };
}

const PREFIX = "travu:wizard:";

export function storageKey(flightId: string, fareId: string): string {
  return PREFIX + flightId + ":" + fareId;
}

export function loadState(key: string, passengers: number): WizardState {
  if (typeof window === "undefined") return initialState(passengers);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return initialState(passengers);
    const parsed = JSON.parse(raw) as Partial<WizardState>;
    const base = initialState(passengers);
    return {
      travellers: Array.from({ length: passengers }, (_, i) => ({
        ...emptyTraveller,
        ...(parsed.travellers?.[i] ?? {}),
      })),
      contact: { ...base.contact, ...(parsed.contact ?? {}) },
      payment: { ...base.payment, ...(parsed.payment ?? {}) },
    };
  } catch {
    return initialState(passengers);
  }
}

export function saveState(key: string, state: WizardState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function clearState(key: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

const DOB_OK = (t: TravellerInput) =>
  /^\d{1,2}$/.test(t.dobDay) && /^\d{1,2}$/.test(t.dobMonth) && /^\d{4}$/.test(t.dobYear);

export function isTravellerComplete(t: TravellerInput): boolean {
  return Boolean(
    t.firstName.trim() &&
      t.lastName.trim() &&
      DOB_OK(t) &&
      t.passportCountry &&
      isValidPassport(t.passportCountry, t.passportNumber),
  );
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isContactComplete(c: ContactInput): boolean {
  return EMAIL_RE.test(c.email) && isValidPhone(c.phoneCountry, c.phone);
}

export function isPaymentComplete(p: PaymentInput): boolean {
  return (
    Boolean(p.nameOnCard.trim()) &&
    isCardValid(p.cardNumber) &&
    /^\d{2}\s*\/\s*\d{2}$/.test(p.expiry) &&
    /^\d{3,4}$/.test(p.cvc) &&
    Boolean(p.billingAddress1.trim() && p.postalCode.trim() && p.city.trim())
  );
}

export function dobToIso(t: TravellerInput): string {
  return `${t.dobYear}-${t.dobMonth.padStart(2, "0")}-${t.dobDay.padStart(2, "0")}`;
}
