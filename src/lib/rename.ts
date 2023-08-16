import { ValuedMiddleware } from "./@types/ValueYieldingMiddleware";
import { of } from "./of";

export type RenameCombinator = <T>(
  m: ValuedMiddleware<T>
) => ValuedMiddleware<T>;

/**
 * Creates a value-yielding middleware combinator that changes the name of the
 * input middleware.
 */
export function rename<T>(
  newName: string | ((oldName: string) => string)
): RenameCombinator {
  return (m) => {
    const displayName =
      typeof newName === "function" ? newName(m.displayName) : newName;
    return of(m, m.get, displayName);
  };
}
