import { aggregate, of } from "@lib";

import { mockNext, mockRequest, mockResponse } from "./utils";

describe("aggregate", () => {
  let isFooSuccess = true;
  let isBarSuccess = true;

  const protoFoo = of(
    (req, res, next) => {
      (req as any)["foo"] = 42;
      next(isFooSuccess ? void 0 : "foo error");
    },
    (req) => (req as any)["foo"],
    "fooMiddleware"
  );
  const protoBar = of(
    (req, res, next) => {
      (req as any)["bar"] = 55;
      next(isFooSuccess ? void 0 : "bar error");
    },
    (req) => (req as any)["bar"],
    "barMiddleware"
  );

  const middleware = aggregate(protoFoo, protoBar).all(
    (foo, bar) => ({ foo, bar }),
    "foobarMiddleware"
  );

  test("success", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenLastCalledWith(void 0);
    expect(middleware.get(req)).toEqual({ foo: 42, bar: 55 });
  });

  test("one branch fails", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    isFooSuccess = false;
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).not.toBeUndefined();
    expect(() => middleware.get(req)).toThrowError(/foobarMiddleware/);
  });

  test("both branches fail", () => {
    const req = mockRequest();
    const res = mockResponse();
    const next = mockNext();

    isFooSuccess = false;
    isBarSuccess = false;
    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next.mock.calls[0][0]).not.toBeUndefined();
    expect(() => middleware.get(req)).toThrowError(/foobarMiddleware/);
  });
});
