import { Request, Response } from "express";
import { Either } from "fp-ts/lib/Either";

import { RequestHandlerWithName } from "./@types/RequestHandlerWithName";
import { ValuedMiddleware } from "./@types/ValueYieldingMiddleware";
import { of } from "./of";

/**
 * Creates a value-yielding middleware combinator that maps the result value of
 * the middleware into another.
 *
 * @param fn Converts the result value into another value with the `Right`
 * structure, or signal a conversion failure with the `Left` structure.
 * The conversion failure may be:
 * - An error status code, which would be sent by Express.
 * - A tuple of error status code and response payload, which would be sent
 *   by Express.
 * - A response function that manually sends the error response.
 * - A tuple of response function and the explicit error to be sent to the
 *   `next()` callback.
 * Returning a `Left` structure always causes the middleware to call `next`
 * with an error.
 */
export function map<A, B>(
  fn: (value: A) => Either<MapError, B>
): MapCombinator<A, B> {
  return (fa) => {
    const resultMap = new WeakMap<Request, B>();
    const handler: RequestHandlerWithName = (req, res, next, getName) => {
      fa(req, res, (err: unknown) => {
        if (typeof err !== "undefined") return next(err);
        const a = fa.get(req);
        const either = fn(a);
        if (either._tag === "Right") {
          resultMap.set(req, either.right);
          return void next();
        }

        const error = either.left;
        if (typeof error === "number") {
          res.sendStatus(error);
          return void next(
            new Error(
              `Middleware ${getName()}'s value could not be transformed. A status code ${error} was returned.`
            )
          );
        }
        if (typeof error === "function") {
          error(res);
          return void next(
            new Error(
              `Middleware ${getName()}'s value could not be transformed.`
            )
          );
        }
        if (typeof error[0] === "function") {
          const [handleError, nextError] = error;
          handleError(res);
          return void next(nextError);
        }
        const [statusCode, payload] = error;
        res.status(statusCode).send(payload);
        return void next(
          new Error(
            `Middleware ${getName()}'s value could not be transformed. A status code ${statusCode} was returned.`
          )
        );
      });
    };

    return of(handler, (req) => resultMap.get(req)!, fa.displayName);
  };
}

export type MapError =
  | number
  | readonly [status: number, output: number]
  | ((res: Response) => void)
  | readonly [handleError: (res: Response) => void, nextError: unknown];

export type MapCombinator<A, B> = (
  fa: ValuedMiddleware<A>
) => ValuedMiddleware<B>;
