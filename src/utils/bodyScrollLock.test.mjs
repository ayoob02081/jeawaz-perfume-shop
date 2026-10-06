import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  bodyScrollLockOwnerCount,
  createScrollLock,
  lockBodyScroll,
  unlockBodyScroll,
} from "./bodyScrollLock.mjs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");

// A fresh lock and body style per test.
function setup(style = { overflow: "", paddingRight: "" }) {
  return { lock: createScrollLock(), style };
}

test("the first owner locks and compensates for the scrollbar", () => {
  const { lock, style } = setup();
  let measured = 0;
  lock.lock("sidebar", style, () => {
    measured += 1;
    return 15;
  });

  assert.deepEqual(style, { overflow: "hidden", paddingRight: "15px" });
  assert.equal(lock.ownerCount, 1);
  assert.equal(measured, 1);
});

test("a second owner joins without re-measuring or re-snapshotting", () => {
  const { lock, style } = setup({ overflow: "scroll", paddingRight: "4px" });
  lock.lock("sidebar", style, () => 15);
  lock.lock("category", style, () => {
    throw new Error("not measured again");
  });

  assert.equal(lock.ownerCount, 2);
  assert.deepEqual(style, { overflow: "hidden", paddingRight: "15px" });

  lock.unlock("sidebar", style);
  lock.unlock("category", style);
  // Restored to the values from before the FIRST lock.
  assert.deepEqual(style, { overflow: "scroll", paddingRight: "4px" });
});

test("one owner closing keeps the page locked while another is open", () => {
  // SideBar closes underneath an open CategorySidebar.
  const { lock, style } = setup();
  lock.lock("sidebar", style, () => 0);
  lock.lock("category", style, () => 0);

  lock.unlock("sidebar", style);

  assert.equal(lock.ownerCount, 1);
  assert.equal(style.overflow, "hidden");
});

test("the last owner restores overflow and paddingRight exactly", () => {
  const { lock, style } = setup({ overflow: "", paddingRight: "12px" });
  lock.lock("category", style, () => 17);
  assert.equal(style.paddingRight, "17px");

  lock.unlock("category", style);

  assert.deepEqual(style, { overflow: "", paddingRight: "12px" });
  assert.equal(lock.ownerCount, 0);
});

test("release order does not matter", () => {
  for (const order of [
    ["a", "b", "c"],
    ["c", "b", "a"],
    ["b", "a", "c"],
  ]) {
    const { lock, style } = setup({ overflow: "auto", paddingRight: "" });
    for (const owner of ["a", "b", "c"]) lock.lock(owner, style, () => 9);
    for (const [index, owner] of order.entries()) {
      lock.unlock(owner, style);
      const last = index === order.length - 1;
      assert.equal(style.overflow, last ? "auto" : "hidden", order.join());
    }
    assert.equal(style.paddingRight, "");
  }
});

test("repeated lock or unlock of the same owner is harmless", () => {
  const { lock, style } = setup({ overflow: "clip", paddingRight: "1px" });
  lock.lock("a", style, () => 5);
  lock.lock("a", style, () => 99);
  assert.equal(lock.ownerCount, 1);
  assert.equal(style.paddingRight, "5px");

  lock.unlock("a", style);
  lock.unlock("a", style);
  lock.unlock("never-locked", style);

  assert.equal(lock.ownerCount, 0);
  assert.deepEqual(style, { overflow: "clip", paddingRight: "1px" });

  // A later lock snapshots the current values again.
  style.overflow = "visible";
  lock.lock("b", style, () => 0);
  lock.unlock("b", style);
  assert.equal(style.overflow, "visible");
});

test("the page lock applies to document.body and is a no-op without a DOM", () => {
  const body = { style: { overflow: "", paddingRight: "" } };
  const doc = { body, documentElement: { clientWidth: 385 } };
  const win = { innerWidth: 400 };
  const sidebar = {};
  const category = {};

  lockBodyScroll(sidebar, doc, win);
  lockBodyScroll(category, doc, win);
  assert.deepEqual(body.style, { overflow: "hidden", paddingRight: "15px" });
  assert.equal(bodyScrollLockOwnerCount(), 2);

  unlockBodyScroll(sidebar, doc);
  assert.equal(body.style.overflow, "hidden");
  unlockBodyScroll(category, doc);
  assert.deepEqual(body.style, { overflow: "", paddingRight: "" });
  assert.equal(bodyScrollLockOwnerCount(), 0);

  // Server rendering: nothing to lock.
  assert.doesNotThrow(() => lockBodyScroll({}, undefined, undefined));
  assert.doesNotThrow(() => unlockBodyScroll({}, undefined));
  assert.equal(bodyScrollLockOwnerCount(), 0);
});

test("the mobile reproduction keeps the page locked until CategorySidebar closes", () => {
  const { lock, style } = setup();
  // 1. SideBar opens. 2. CategorySidebar opens above it.
  lock.lock("SideBar", style, () => 0);
  lock.lock("CategorySidebar", style, () => 0);
  // 3. The first tap inside CategorySidebar closes SideBar.
  lock.unlock("SideBar", style);
  // 4–5. Still locked while the filters are open.
  assert.equal(style.overflow, "hidden");
  // 6. Closing CategorySidebar unlocks.
  lock.unlock("CategorySidebar", style);
  assert.equal(style.overflow, "");
});

test("Backdrop and SideBar share the lock and no longer write body styles", () => {
  const hook = read("../hooks/useBodyScrollLock.js");
  assert.match(hook, /lockBodyScroll\(owner\);\s*return \(\) => unlockBodyScroll\(owner\);/);

  for (const [path, flag] of [
    ["../ui/Backdrop.jsx", "isOpen"],
    ["../components/SideBar.jsx", "isSidebarOpen"],
  ]) {
    const source = read(path);
    assert.match(source, /import useBodyScrollLock from "@\/hooks\/useBodyScrollLock";/, path);
    assert.match(source, new RegExp(`useBodyScrollLock\\(${flag}\\);`), path);
    assert.doesNotMatch(source, /document\.body\.style/, path);
  }
});
