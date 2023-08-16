import { Request, RequestHandler } from "express";

import { ValuedMiddleware } from "./@types/ValueYieldingMiddleware";
import { of } from "./of";

interface MiddlewareAggregation<T extends any[]> {
  /**
   * Creates a value-yielding middleware that combines the values of all of the
   * given middlewares in a single merge functions. The middlewares will be
   * handled simultaneously, waiting for all `next()` functions to be called,
   * requiring that all are called without failure.
   */
  all: <U>(
    mergeFn: (...args: T) => U,
    displayName?: string
  ) => ValuedMiddleware<U>;
}

/**
 * Produces a middleware aggregation combinator interface from the given middlewares.
 */
export function aggregate<T extends any[]>(
  ...handlers: { [key in keyof T]: ValuedMiddleware<T[key]> }
): MiddlewareAggregation<T> {
  const all: MiddlewareAggregation<T>["all"] = <U>(
    mergeResults: (...args: T) => U,
    displayName?: string
  ) => {
    const resultMap = new WeakMap<Request, U>();
    const handler: RequestHandler = (req, res, next) => {
      let hasError = false;
      const intermediateResults = new Map<number, unknown>();
      const combineNext = (index: number) => (error: unknown) => {
        if (intermediateResults.has(index) || hasError) return;
        if (typeof error !== "undefined") {
          hasError = true;
          return void next(error);
        }

        intermediateResults.set(index, handlers[index].get(req));
        if (intermediateResults.size === handlers.length) {
          resultMap.set(
            req,
            mergeResults(
              ...(new Array(handlers.length)
                .fill(0)
                .map((_, index) => intermediateResults.get(index)) as T)
            )
          );
          next();
        }
      };
      handlers.map((handler, index) => handler(req, res, combineNext(index)));
    };
    return of(handler, (req) => resultMap.get(req)!, displayName);
  };

  return { all };
}
