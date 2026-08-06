import { expect, test } from "vitest";
import { encodeNativeMessage, NativeMessageDecoder } from "./index.ts";

test("decodes a split Native Messaging frame", () => {
  const frame = encodeNativeMessage({ text: "hello" });
  const decoder = new NativeMessageDecoder();

  expect(decoder.push(frame.subarray(0, 5))).toEqual([]);
  expect(decoder.push(frame.subarray(5))).toEqual([{ text: "hello" }]);
});
