// Font Awesome kit removal. The footer social links were the kit's last
// users; they now render local PNGs, so the external script must not return.
// Narrow source checks: there is no DOM test environment.

import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const rootLayout = read("./layout.jsx");
const footer = read("./Footer.jsx");

test("the root layout no longer loads the Font Awesome kit", () => {
  assert.doesNotMatch(rootLayout, /fontawesome/i);
  assert.doesNotMatch(rootLayout, /next\/script/);
});

test("no source file uses Font Awesome classes or the kit", () => {
  const root = new URL("../", import.meta.url);
  const users = readdirSync(root, { recursive: true })
    .filter((file) => /\.(jsx?|mjs|css)$/.test(file) && !file.endsWith(".test.mjs"))
    .filter((file) =>
      /fontawesome|\bfa-(?:brands|solid|regular|xl|lg)\b/i.test(
        readFileSync(new URL(file.replaceAll("\\", "/"), root), "utf8"),
      ),
    )
    .map((file) => file.replaceAll("\\", "/"));
  assert.deepEqual(users, []);
});

test("footer social links render existing local icons", () => {
  for (const name of ["whatsapp", "telegram", "instagram"]) {
    assert.match(footer, new RegExp(`src="/images/${name}\\.png"`), name);
    assert.ok(existsSync(new URL(`../../public/images/${name}.png`, import.meta.url)), name);
  }
  assert.match(footer, /href="https:\/\/t\.me\/jeaawazperfume"/);
  assert.match(footer, /href="https:\/\/www\.instagram\.com\/jeawaz_perfume\/"/);
});
