import { Request, RequestHandler } from "express";

/**
 * Defines a value-yielding Express middleware type.
 */
export interface ValuedMiddleware<T> extends RequestHandler {
  /**
   * Gets the value yielded by the middleware on the request. This throws an
   * error if the middleware never processed this request.
   */
  get: (req: Request) => T;

  /**
   * A diagnostic name for the middleware.
   */
  displayName: string;
}
