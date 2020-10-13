import { of } from "@lib";
import { RequestHandler } from "express";

import { mockNext, mockRequest, mockResponse } from "./utils";

describe("of", () => {
  let isSuccess = true;
  const handler: RequestHandler = (req, res, next) => {
    (req as any)["foo"] = 42;
    next(isSuccess ? void 0 : "test error");
  };
  const middleware = of(handler, (req) => (req as any)["foo"], "fooMiddleware");

  beforeEach(() => (isSuccess = true));

  test("success case", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenLastCalledWith(void 0);
    expect(middleware.get(req)).toEqual(42);
  });

  test("failure case", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    isSuccess = false;
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenLastCalledWith("test error");
    expect(() => middleware.get(req)).toThrowError(/fooMiddleware/);
  });

  test("display name", () => {
    expect(middleware.displayName).toBe("fooMiddleware");
  });
});
