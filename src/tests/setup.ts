import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// jsdom doesn't provide these globally, but react-router v7 needs them
const g = globalThis as unknown as { TextEncoder?: typeof TextEncoder; TextDecoder?: typeof TextDecoder };
if (typeof g.TextEncoder === "undefined") {
  g.TextEncoder = TextEncoder;
}
if (typeof g.TextDecoder === "undefined") {
  g.TextDecoder = TextDecoder;
}