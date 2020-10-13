import { NextFunction, Request, Response } from "express";
import * as core from "express-serve-static-core";

export type RequestHandlerWithName = (
  req: Request<core.ParamsDictionary, any, any, core.Query>,
  res: Response<any>,
  next: NextFunction,
  name: () => string
) => any;
