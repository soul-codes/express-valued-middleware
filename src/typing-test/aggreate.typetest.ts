import { ValuedMiddleware, aggregate } from "@lib";
import { ExactType, expectType } from "@soul-codes-dev/typetools/test";
import { Request } from "express";

declare const req: Request;

declare const params: ValuedMiddleware<{
  userId: string;
  objectId: string;
}>;

declare const queries: ValuedMiddleware<{
  sort: "asc" | "desc";
}>;

declare const body: ValuedMiddleware<{
  formula: string;
}>;

const combined = aggregate(params, queries, body).all(
  (params, queries, body) => ({
    params,
    queries,
    body,
    extra: "yay" as const,
  })
);

expectType(combined.get(req))
  .assert<{
    params: { userId: string; objectId: string };
    queries: { sort: "asc" | "desc" };
    body: { formula: string };
    extra: "yay";
  }>()
  .toBe(ExactType);
