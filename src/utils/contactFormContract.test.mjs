import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  CONTACT_FAILURE_MESSAGE,
  CONTACT_INVALID_MESSAGE,
  CONTACT_MESSAGES_PATH,
  CONTACT_NETWORK_MESSAGE,
  CONTACT_RATE_LIMIT_MESSAGE,
  CONTACT_SUCCESS_MESSAGE,
  buildContactMessagePayload,
  contactFormDefaultValues,
  contactFormRules,
  createContactSubmitter,
  getContactErrorMessage,
  getContactSuccessMessage,
  normalizeContactPhone,
  postContactMessage,
} from "./contactFormContract.mjs";

const source = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const form = source("../app/(user)/page/_components/ContactUsForm.jsx");
const page = source("../app/(user)/page/contact-us/page.jsx");
const service = source("../services/contactServices.js");
const hook = source("../hooks/useContactMessages.js");

const filled = {
  fullName: "  علی حسنی  ",
  phoneNumber: "09123456789",
  message: "  سلام، درباره ارسال سفارش سؤال دارم.  ",
  website: "",
};

const httpError = (status, message) => {
  const error = new Error(`Request failed with status code ${status}`);
  error.response = { status, data: { success: false, statusCode: status, message } };
  return error;
};

function fakeClient(result) {
  const calls = [];
  return {
    calls,
    post: async (url, body) => {
      calls.push({ url, body });
      if (result instanceof Error) throw result;
      return { status: 201, data: result };
    },
  };
}

// A form stand-in: `reset` records what the form would be reset to.
function fakeForm(values) {
  const state = { values: { ...values }, resets: 0 };
  return {
    state,
    reset: (next) => {
      state.resets += 1;
      state.values = { ...next };
    },
  };
}

const validate = (field, value) => {
  const rule = contactFormRules[field];
  if (value === "" || value === undefined) return rule.required;
  return rule.validate(value);
};

// ---------- API integration ----------

test("posts exactly the four string fields to POST /contact-messages", async () => {
  const client = fakeClient({ success: true, message: CONTACT_SUCCESS_MESSAGE });

  const data = await postContactMessage(client, buildContactMessagePayload(filled));

  assert.equal(CONTACT_MESSAGES_PATH, "/contact-messages");
  assert.deepEqual(client.calls, [{
    url: "/contact-messages",
    body: {
      fullName: "علی حسنی",
      phoneNumber: "09123456789",
      message: "سلام، درباره ارسال سفارش سؤال دارم.",
      website: "",
    },
  }]);
  assert.deepEqual(data, { success: true, message: CONTACT_SUCCESS_MESSAGE });
});

test("payload has only backend fields, all strings, and an empty honeypot by default", () => {
  const payload = buildContactMessagePayload({
    ...contactFormDefaultValues,
    fullName: "علی",
    phoneNumber: 9123456789,
    message: "متن پیام آزمایشی",
    email: "x@example.com",
    userId: 5,
  });

  assert.deepEqual(Object.keys(payload), ["fullName", "phoneNumber", "message", "website"]);
  for (const value of Object.values(payload)) assert.equal(typeof value, "string");
  assert.equal(payload.phoneNumber, "9123456789");
  assert.equal(payload.website, "");
  assert.deepEqual(contactFormDefaultValues, {
    fullName: "", phoneNumber: "", message: "", website: "",
  });
  assert.equal(Object.isFrozen(contactFormDefaultValues), true);
});

test("a filled honeypot is still submitted unchanged (the backend decides)", () => {
  assert.equal(buildContactMessagePayload({ ...filled, website: "http://spam" }).website, "http://spam");
});

test("the service uses the shared credentialed Axios client, not a new networking path", () => {
  assert.match(service, /import app from "\.\/httpClient";/);
  assert.match(service, /postContactMessage\(app, payload\)/);
  assert.doesNotMatch(service, /fetch\(|axios/);
});

// ---------- validation ----------

test("fullName mirrors the backend: required, trimmed 2–100, no control characters", () => {
  assert.equal(validate("fullName", ""), "نام و نام خانوادگی الزامی است");
  assert.equal(validate("fullName", "   "), "نام و نام خانوادگی الزامی است");
  assert.match(String(validate("fullName", " a ")), /بین 2 تا 100/);
  assert.match(String(validate("fullName", "ب".repeat(101))), /بین 2 تا 100/);
  assert.equal(validate("fullName", "علی\nحسنی"), "نام و نام خانوادگی شامل کاراکتر نامعتبر است");
  assert.equal(validate("fullName", "علی‮حسنی"), "نام و نام خانوادگی شامل کاراکتر نامعتبر است");
  assert.equal(validate("fullName", "ab"), true);
  assert.equal(validate("fullName", "ب".repeat(100)), true);
  assert.equal(validate("fullName", "محمد‌حسین"), true);
});

test("phoneNumber accepts the Iranian forms the backend normalizes", () => {
  for (const phone of [
    "09123456789", "9123456789", "989123456789", "+989123456789", "00989123456789",
    "0912 345 6789", "+98 912-345-6789", "۰۹۱۲۳۴۵۶۷۸۹", "٠٩١٢٣٤٥٦٧٨٩",
  ]) {
    assert.equal(normalizeContactPhone(phone), "989123456789", phone);
    assert.equal(validate("phoneNumber", phone), true, phone);
  }
  for (const phone of ["0912345678", "02112345678", "+09123456789", "abc"]) {
    assert.equal(normalizeContactPhone(phone), null, phone);
    assert.equal(validate("phoneNumber", phone), "شماره موبایل معتبر نیست", phone);
  }
  assert.equal(validate("phoneNumber", ""), "شماره موبایل الزامی است");
});

test("message mirrors the backend: required, trimmed 10–2000", () => {
  assert.equal(validate("message", ""), "متن پیام الزامی است");
  assert.equal(validate("message", "      "), "متن پیام الزامی است");
  assert.match(String(validate("message", "  کوتاه  ")), /بین 10 تا 2000/);
  assert.match(String(validate("message", "م".repeat(2001))), /بین 10 تا 2000/);
  assert.equal(validate("message", "م".repeat(10)), true);
  assert.equal(validate("message", "م".repeat(2000)), true);
});

// ---------- submission flow ----------

test("HTTP 201 resets fullName, phoneNumber and message", async () => {
  const client = fakeClient({ success: true, message: CONTACT_SUCCESS_MESSAGE });
  const formState = fakeForm(filled);
  const submit = createContactSubmitter({
    send: (payload) => postContactMessage(client, payload),
    reset: formState.reset,
  });

  const result = await submit(formState.state.values);

  assert.deepEqual(result, { ok: true });
  assert.equal(client.calls.length, 1);
  assert.equal(formState.state.resets, 1);
  assert.deepEqual(formState.state.values, contactFormDefaultValues);
});

test("success toast shows the backend message, with a Persian fallback", () => {
  assert.equal(getContactSuccessMessage({ success: true, message: "پیام شما با موفقیت ثبت شد" }),
    "پیام شما با موفقیت ثبت شد");
  assert.equal(getContactSuccessMessage({ success: true }), CONTACT_SUCCESS_MESSAGE);
  assert.equal(getContactSuccessMessage(undefined), CONTACT_SUCCESS_MESSAGE);
});

for (const [label, error] of [
  ["400 validation", httpError(400, ["شماره موبایل معتبر نیست"])],
  ["429 throttled", httpError(429, "ThrottlerException: Too Many Requests")],
  ["500 server", httpError(500, "Internal server error")],
  ["network", Object.assign(new Error("Network Error"), { code: "ERR_NETWORK" })],
]) {
  test(`${label} failure preserves the entered values and never rejects`, async () => {
    const formState = fakeForm(filled);
    const submit = createContactSubmitter({
      send: async () => { throw error; },
      reset: formState.reset,
    });

    const result = await submit(formState.state.values);

    assert.deepEqual(result, { ok: false });
    assert.equal(formState.state.resets, 0);
    assert.deepEqual(formState.state.values, filled);
  });
}

test("400 shows the backend's Persian field message, never English/internal text", () => {
  assert.equal(getContactErrorMessage(httpError(400, ["شماره موبایل معتبر نیست"])),
    "شماره موبایل معتبر نیست");
  assert.equal(getContactErrorMessage(httpError(400, ["property ip should not exist", "متن پیام باید بین 10 تا 2000 کاراکتر باشد"])),
    "متن پیام باید بین 10 تا 2000 کاراکتر باشد");
  assert.equal(getContactErrorMessage(httpError(400, ["property ip should not exist"])),
    CONTACT_INVALID_MESSAGE);
  assert.equal(getContactErrorMessage(httpError(400, undefined)), CONTACT_INVALID_MESSAGE);
});

test("429, server and network errors map to fixed Persian messages", () => {
  assert.equal(getContactErrorMessage(httpError(429, "ThrottlerException: Too Many Requests")),
    CONTACT_RATE_LIMIT_MESSAGE);
  assert.equal(getContactErrorMessage(httpError(500, "Internal server error")), CONTACT_FAILURE_MESSAGE);
  assert.equal(getContactErrorMessage(httpError(403, "Forbidden resource")), CONTACT_FAILURE_MESSAGE);
  assert.equal(getContactErrorMessage(new Error("Network Error")), CONTACT_NETWORK_MESSAGE);
  assert.equal(getContactErrorMessage(undefined), CONTACT_NETWORK_MESSAGE);
  for (const message of [CONTACT_RATE_LIMIT_MESSAGE, CONTACT_FAILURE_MESSAGE, CONTACT_NETWORK_MESSAGE]) {
    assert.match(message, /[؀-ۿ]/);
    assert.doesNotMatch(message, /Throttler|Error|status|\d{3}/);
  }
});

test("duplicate submits while one is in flight are ignored; the next one after completion is allowed", async () => {
  const sent = [];
  let finish;
  const formState = fakeForm(filled);
  const submit = createContactSubmitter({
    send: (payload) => {
      sent.push(payload);
      return new Promise((resolve) => { finish = resolve; });
    },
    reset: formState.reset,
  });

  const first = submit(formState.state.values);
  assert.deepEqual(await submit(formState.state.values), { ok: false, skipped: true });
  assert.deepEqual(await submit(formState.state.values), { ok: false, skipped: true });
  assert.equal(sent.length, 1);

  finish({ success: true, message: CONTACT_SUCCESS_MESSAGE });
  assert.deepEqual(await first, { ok: true });

  const second = submit({ ...filled, message: "پیام دوم برای بررسی ارسال" });
  finish({ success: true });
  assert.deepEqual(await second, { ok: true });
  assert.equal(sent.length, 2);
});

test("after a failure the form can be submitted again", async () => {
  let attempt = 0;
  const submit = createContactSubmitter({
    send: async () => {
      attempt += 1;
      if (attempt === 1) throw httpError(429, "Too Many Requests");
      return { success: true };
    },
    reset: () => {},
  });
  assert.deepEqual(await submit(filled), { ok: false });
  assert.deepEqual(await submit(filled), { ok: true });
});

// ---------- component wiring ----------

test("the form submits through react-hook-form, never natively via GET", () => {
  assert.match(form, /onSubmit=\{handleSubmit\(submitContactForm\)\}/);
  assert.doesNotMatch(form, /onSubmit=\{handleSubmit\}/);
  assert.match(form, /method="post"/);
  assert.doesNotMatch(form, /method="get"|action=/i);
});

test("fields are named for the backend contract; phone is type tel via the controlled field", () => {
  assert.match(form, /name: "fullName"/);
  assert.match(form, /name: "phoneNumber",[\s\S]*?type: "tel"/);
  assert.match(form, /name="message"/);
  assert.match(form, /control=\{control\}/);
  assert.doesNotMatch(form, /fullNmae|name: "value"|type: "number"|name="description"/);
  assert.doesNotMatch(form, /email|subject|userId|captcha/i);
});

test("honeypot is registered as website, hidden, unfocusable and hidden from assistive tech", () => {
  assert.match(form, /<div aria-hidden="true" className="sr-only">/);
  assert.match(form, /tabIndex=\{-1\}/);
  assert.match(form, /autoComplete="off"/);
  assert.match(form, /\{\.\.\.register\("website"\)\}/);
});

test("validation rules and errors use the existing RHF field components", () => {
  assert.match(form, /validationSchema=\{contactFormRules\[item\.name\]\}/);
  assert.match(form, /validationSchema=\{contactFormRules\.message\}/);
  assert.equal(form.match(/errors=\{errors\}/g)?.length, 2);
  assert.match(form, /defaultValues: contactFormDefaultValues/);
});

test("submit button is disabled with the existing loading convention while sending", () => {
  assert.match(form, /const isBusy = isSubmitting \|\| isSending;/);
  assert.match(form, /disabled=\{isBusy\}/);
  assert.match(form, /\{isBusy \? "در حال ارسال\.\.\." : "ارسال پیام"\}/);
  assert.match(form, /disabled:opacity-50/);
});

test("toasts come from the mutation hook through the root Toaster, not a second local one", () => {
  assert.doesNotMatch(form, /<Toaster/);
  assert.match(hook, /mutationFn: createContactMessageApi/);
  assert.match(hook, /toast\.success\(getContactSuccessMessage\(data\)/);
  assert.match(hook, /toast\.error\(getContactErrorMessage\(err\)/);
  assert.doesNotMatch(hook, /console\./);
});

test("visible labels, placeholders and form styling are preserved", () => {
  for (const text of [
    'label: "نام و نام خانوادگی"', 'placeholder: "علی حسنی"',
    'label: "شماره همراه"', 'placeholder: "۰۹۱۲۳۴۵۶۷۸۹"', 'label="پیام شما"',
    'placeholder="پیام خود را بنویسید ..."', "ارسال پیام یا سوال",
    'className="flex flex-col items-start justify-between gap-2 p-6 border border-stroke-250 rounded-2xl size-full"',
    'className="flex flex-col items-center justify-between gap-6 size-full"',
    'className="rounded-xl h-32"', 'textClassName="text-sm!"',
    "placeholder={`مثال: ${item.placeholder}`}",
  ]) {
    assert.ok(form.includes(text), text);
  }
});

test("the page keeps the desktop-only form section and the contact information unchanged", () => {
  assert.match(page, /<section className="grow max-md:hidden md:flex items-start h-full w-1\/2">\s*<ContactUsForm \/>\s*<\/section>/);
  assert.match(page, /import ContactUsForm from "\.\.\/_components\/ContactUsForm";/);
  assert.match(page, /tel:\+989302125151/);
  assert.match(page, /https:\/\/t\.me\/jeaawazperfume/);
});
