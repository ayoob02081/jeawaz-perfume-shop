import app from "./httpClient";
import {
  fetchAdminContactMessage,
  fetchAdminContactMessages,
  patchAdminContactMessageStatus,
} from "@/utils/adminContactMessagesContract.mjs";

// -------------------------
// لیست پیام‌های تماس با ما
// GET /admin/contact-messages?page&limit&status
// Admin
// -------------------------

export const getAdminContactMessagesApi = (query) =>
  fetchAdminContactMessages(app, query);

// -------------------------
// جزئیات پیام (بدون تغییر وضعیت)
// GET /admin/contact-messages/:id
// Admin
// -------------------------

export const getAdminContactMessageByIdApi = (id) =>
  fetchAdminContactMessage(app, id);

// -------------------------
// تغییر وضعیت پیام
// PATCH /admin/contact-messages/:id/status
// Admin
// -------------------------

export const updateContactMessageStatusApi = ({ id, status }) =>
  patchAdminContactMessageStatus(app, { id, status });
