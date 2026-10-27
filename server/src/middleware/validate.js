/** Parses req[source] with a zod schema and replaces it with the parsed, typed value. */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source] ?? {});
    if (!result.success) return next(result.error);
    // Express 5 exposes req.query as a getter, so parsed query values are stored separately.
    if (source === 'query') req.validQuery = result.data;
    else req[source] = result.data;
    next();
  };
}
