import { MapError, map, of } from "@lib";
import { RequestHandler } from "express";
import { left, right } from "fp-ts/lib/Either.js";
import { pipe } from "fp-ts/lib/function.js";

import { mockNext, mockRequest, mockResponse } from "./utils/index.js";

describe("map", () => {
  let isProtoSuccess = true;
  let leftValue: MapError | null = null;
  let result: number = 42;
  const handler: RequestHandler = (req, res, next) => {
    (req as any)["foo"] = result;
    next(isProtoSuccess ? void 0 : "proto test error");
  };
  const proto = of(handler, (req) => (req as any)["foo"], "fooMiddleware");
  const middleware = pipe(
    proto,
    map((number) =>
      leftValue
        ? left(leftValue)
        : right(number > 42 ? "over 42" : "not over 42")
    )
  );

  beforeEach(
    () => ((isProtoSuccess = true), (leftValue = null), (result = 42))
  );

  test("success case, branch one", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenLastCalledWith(void 0);
    expect(middleware.get(req)).toEqual("not over 42");
  });

  test("success case, branch two", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    result = 43;
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenLastCalledWith(void 0);
    expect(middleware.get(req)).toEqual("over 42");
  });

  test("prior failure", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    isProtoSuccess = false;
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenLastCalledWith("proto test error");
    expect(() => middleware.get(req)).toThrowError(/fooMiddleware/);
  });

  test("posterior failure (status code)", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    leftValue = 404;
    middleware(req, res, next);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenLastCalledWith(404);
    expect(next).not.toHaveBeenCalled();
    expect(() => middleware.get(req)).toThrowError(/fooMiddleware/);
  });

  test("posterior failure (manual reject)", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    leftValue = jest.fn((res, next) => {
      res.status(400);
    });
    middleware(req, res, next);
    expect(leftValue).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenLastCalledWith(400);
    expect(next).not.toHaveBeenCalled();
    expect(() => middleware.get(req)).toThrowError(/fooMiddleware/);
  });

  test("inherits name", () => {
    expect(middleware.displayName).toBe("fooMiddleware");
  });
});
