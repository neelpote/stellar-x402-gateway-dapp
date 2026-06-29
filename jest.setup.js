import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "util";
const fetch = require("node-fetch");

if (typeof globalThis.TextDecoder === "undefined") {
  globalThis.TextDecoder = TextDecoder;
}

if (typeof globalThis.TextEncoder === "undefined") {
  globalThis.TextEncoder = TextEncoder;
}

// Polyfill fetch in Jest/JSDOM context
globalThis.fetch = fetch;
globalThis.Headers = fetch.Headers;
globalThis.Request = fetch.Request;
globalThis.Response = fetch.Response;
