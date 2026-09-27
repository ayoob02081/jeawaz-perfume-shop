import app from "./httpClient";
import { postContactMessage } from "@/utils/contactFormContract.mjs";

// -------------------------
// ارسال پیام تماس با ما
// POST /contact-messages
// Public
// -------------------------

export const createContactMessageApi = (payload) =>
  postContactMessage(app, payload);
