import { of, rename } from "@lib";
import { pipe } from "fp-ts/lib/function.js";

import { mockNext, mockRequest, mockResponse } from "./utils/index.js";

describe("rename", () => {
  const testName = jest.fn((name) => {
    expect(name).toEqual("renamed middleware");
  });

  const proto = of(
    (req, res, next, name) => {
      testName(name());
      next();
    },
    (req) => (req as any)["foo"],
    "named middleware"
  );

  const middleware = pipe(
    proto,
    rename((name) => `re${name}`)
  );

  test.only("success case, branch one", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();
    debugger;
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(testName).toHaveBeenCalledTimes(1);
  });
});
