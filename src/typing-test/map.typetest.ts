import { ValuedMiddleware, map } from "@lib";
import { ExactType, expectType } from "@soul-codes-dev/typetools/test.js";
import { Request } from "express";
import { left, right } from "fp-ts/lib/Either.js";
import { pipe } from "fp-ts/lib/function.js";

declare const useNumber: ValuedMiddleware<number>;
declare const req: Request;

const middleware = pipe(
  useNumber,
  map((val) =>
    val === 2 ? right(10) : left([(res) => res.send(200), "boo!"])
  ),
  map((val) => right({ importantValue: val }))
);

expectType(middleware.get(req))
  .assert<{ importantValue: number }>()
  .toBe(ExactType);
