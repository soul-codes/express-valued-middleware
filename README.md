# Non-polluting express middleware

## Motivation

An `express` middleware often adds extra properties to the request object.
For example:

```ts
const middleware = (req, res, next) => {
  // ... does something and obtain a value somehow
  req["some_property"] = some_value;
  next();
}
```

By doing this, you assume that `some_property` is going to be available. If
you're using TypeScript, you also need to use some TypeScript magic such as
interface augmentation to make `some_property` available on the request
object. But it may or may not be there.

`express-valued-middleware` encourages you not to do this, but instead offers
a different pattern where you can use `middleware.get(req)` to extract the value
from your middleware.

## Usage

### Creation

To do this, you use the `of` function to "lift" a middleware implementation
by provide the "value extractor" function. If you're lifting a third-party
middleware, you can, in a localized manner, access their magic property on the
request (say, `req.body` or whatever). If you're writing your own middleware,
you could avoid polluting the request object altogether by using things like
WeakMaps or privately scoped `Symbol` keys.

```ts
import * as mw from "express-valued-middleware";

const middlewareState = new WeakMap()
const middleware = mw.of(
  (req, res, next) => {
    // ... does something and obtain a value somehow
    // store a value, for instance, you could use a weakmap
    middlewareState.set(req, some_value)
    next();
  },
  req => middlewareState.get(req)
)
```

This creates a "valued middleware".

To get a value of the middleware (this will throw if the middleware was not used):

```ts
// in some downstream handler
middleware.get(req) // throws if the middleware was never used.
```

TypeScript-wise, this will also be typed correctly based on the extractor function
you provided.

### Transforming values

You can also derive a valued middleware's value by using `map` to create a new
valued middleware. The `map` function relies on
[`fp-ts`](https://www.npmjs.com/package/fp-ts)'s `Either` interface as a
convention for returning success and failure

```ts
import { Either, left, right } from "fp-ts/lib/Either"
import * as mw from "express-valued-middleware";

// assume "middleware"

const middlewareAsNumber = mw.map(
  value => right(Number(value))
)(middleware)
```

`map` returns a middleware combinator that you can use with `fp-ts`'s `pipe`
pipeline:

```ts
import { pipe } from "fp-ts/lib/function"
import { Either, left, right } from "fp-ts/lib/Either"
import * as mw from "express-valued-middleware";

// assume "middleware"

const middlewareAsNumber = pipe(
  middleware,
  mw.map(value => right(Number(value)))
)
```

`map` can also accept the following `Left` values:

```ts
// 1. Sending a status code
value => left(400) // Equivalent to req.sendStatus(400)

// 2. Sending a status code and a response
value => left([400, `${value} is not valid`]) // Equivalent to req.status(400).send(...)

// 3. Custom error behavior
value => left((req, next) => {
  req.status(400).send(`{value is not valid}`)
  next()
})
```

### Aggregating values

Multiple middlewares may also be aggregated using `aggregate()`:

```ts
import * as mw from "express-valued-middleware";

// assume "middleware1" and "middleware2"
const aggregatedMiddleware = mw
  .aggregate(middleware1, middleware2)
  .all((result1, result2) => ({ result1, result2 }));
```

`aggregate()` creates an intermediate and with `all()` you specify how the
values of the aggregated middleware should be combined. The resulting valued
middleware runs the provided middlewares simultaneously. If any of the
provided middleware throws with `next(error)`, that error is propagated
and the merge function is not called.

## Future work

This package was created without incorporating other useful functional
programming ideas such as sequencing and traversing. A future (likely breaking)
change may include aligning the API of this package more closely with the
conventions of `fp-ts`.
