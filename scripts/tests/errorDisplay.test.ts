// The components use the classic JSX runtime, which reads the global React.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
(globalThis as { React?: unknown }).React = require("react");

import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FileInfoDisplay } from "../../src/components/DonorOffers/FileInfoDisplay";
import { ErrorDisplay } from "../../src/components/DonorOffers/ErrorDisplay";

const ERRORS = [
  "Error validating donor offer item on row 4: Column 'weight': Expected number, received nan",
  "Error validating donor offer item on row 6: Column 'initialQuantity': Expected number, received nan",
  "Error validating donor offer item on row 7: Column 'initialQuantity': Required",
];

// React escapes text content when rendering, so raw strings cannot be matched
// against the markup. Compare against the encoded form instead.
const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

const countOccurrences = (haystack: string, needle: string) =>
  needle ? haystack.split(needle).length - 1 : 0;

const card = (overrides: Partial<Parameters<typeof FileInfoDisplay>[0]> = {}) =>
  renderToStaticMarkup(
    React.createElement(FileInfoDisplay, {
      fileName: "x-create-offer-mistakes.csv",
      fileSize: 1024,
      fileErrorMessage: ERRORS[0],
      onReset: () => {},
      ...overrides,
    })
  );

const list = (errors: string[]) =>
  renderToStaticMarkup(React.createElement(ErrorDisplay, { errors }));

test("single fileErrorMessage keeps the inline error detail", () => {
  const html = card();
  assert.match(html, /inline mr-1/);
  assert.equal(countOccurrences(html, escapeHtml(ERRORS[0])), 1);
});

test("no-file card renders validation errors in the No File Uploaded branch", () => {
  // Mirrors create/page.tsx when the four required fields are missing: the
  // upload was rejected, so fileName is empty but the errors must still show.
  const html = card({
    fileName: "",
    fileSize: 0,
    fileErrorMessage: null,
    errorMessages: [
      "Donor offer name is required.",
      "Donor name is required.",
      "Partner request deadline is required.",
      "Donor request deadline is required.",
    ],
  });
  assert.match(html, /No File Uploaded/);
  for (const message of [
    "Donor offer name is required.",
    "Donor name is required.",
    "Partner request deadline is required.",
    "Donor request deadline is required.",
  ]) {
    assert.equal(countOccurrences(html, escapeHtml(message)), 1, message);
  }
  assert.equal((html.match(/inline mr-1/g) || []).length, 4);
  assert.match(html, /border-red-500 bg-red-50/);
});

test("errorMessages renders every line inside the card, once, in order", () => {
  const html = card({ errorMessages: ERRORS, fileErrorMessage: null });
  for (const error of ERRORS) {
    assert.equal(countOccurrences(html, escapeHtml(error)), 1, error);
  }
  const positions = ERRORS.map((error) => html.indexOf(escapeHtml(error)));
  assert.deepEqual(
    positions,
    [...positions].sort((a, b) => a - b),
    "errors must stay in order"
  );
  assert.equal((html.match(/inline mr-1/g) || []).length, ERRORS.length);
  assert.match(html, /border-red-500 bg-red-50/);
  assert.doesNotMatch(html, /kb/);
});

test("errorMessages takes precedence over fileErrorMessage to avoid duplicates", () => {
  const html = card({ errorMessages: ERRORS });
  for (const error of ERRORS) {
    assert.equal(countOccurrences(html, escapeHtml(error)), 1, error);
  }
});

test("finalize-page composition (single line) is unchanged", () => {
  const html = card() + list(ERRORS.slice(1));
  assert.equal(countOccurrences(html, escapeHtml(ERRORS[0])), 1);
  assert.equal(countOccurrences(html, escapeHtml(ERRORS[1])), 1);
  assert.equal(countOccurrences(html, escapeHtml(ERRORS[2])), 1);
});

test("ErrorDisplay still renders its own list when used directly", () => {
  const html = list(ERRORS);
  for (const error of ERRORS) {
    assert.equal(countOccurrences(html, escapeHtml(error)), 1, error);
  }
  assert.equal(
    (html.match(/bg-red-50 border font-light border-red-500/g) || []).length,
    ERRORS.length
  );
});
