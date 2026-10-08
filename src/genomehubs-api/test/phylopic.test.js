import assert from "node:assert/strict";
import test from "node:test";
import { toDataUri } from "../src/api/v2/routes/phylopic.js";

test("toDataUri converts image bytes to a same-origin data URL", () => {
  const bytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const uri = toDataUri({ buffer: bytes, mimeType: "image/png" });

  assert.match(uri, /^data:image\/png;base64,/);
  assert.equal(
    Buffer.from(uri.split(",")[1], "base64").toString("hex"),
    bytes.toString("hex"),
  );
});
