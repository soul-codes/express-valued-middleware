import { Request, RequestHandler } from "express";

import { RequestHandlerWithName } from "./@types/RequestHandlerWithName.js";
import { ValuedMiddleware } from "./@types/ValueYieldingMiddleware.js";

/**
 * Lifts a "dirty" request-decorating middleware into a value-yielding
 * middleware by providing the extractor function that should extract the
 * value from the request object upon successful handling.
 * @param handler The "dirty" middleware
 * @param extractor Called only on a non-error `next()` of the `handler`,
 *   should return the value to save for querying later.
 */
export function of<T>(
  handler: RequestHandlerWithName,
  extractor: (req: Request) => T,
  displayName: string | (() => string) = "(unnamed middleware)"
): ValuedMiddleware<T> {
  const weakResults = new WeakMap<Request, T>();
  const getName =
    typeof displayName === "string" ? () => displayName : displayName;

  // Express detects the arity of the function to see whether it is a request
  // handler or an error handler, so we mislead Express by making the extra
  // arguments about name overriding "rest" (rest arguments don't count in the
  // function `length` property: see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length)
  const use: RequestHandler = (
    req,
    res,
    next,
    ...[maybeGetOverridenName]: [maybeGetOverridenName?: () => string]
  ) => {
    handler(
      req,
      res,
      (err: unknown) => {
        if (typeof err === "undefined") {
          weakResults.set(req, extractor(req));
        }
        next(err);
      },
      () => (maybeGetOverridenName || getName)()
    );
  };

  const get = (req: Request): T => {
    if (!weakResults.has(req)) {
      throw Error(
        `Middleware ${displayName} did not leave the value but one was required.`
      );
    }
    return weakResults.get(req)!;
  };
  return Object.assign(use, {
    get,
    get displayName() {
      return getName();
    },
  });
}
