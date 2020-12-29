import {
  assertIsParseError,
  parse,
  parser,
  ParseError,
  Parser,
} from '.';

export const identity = <T, U>(value: U) => parser<T, U>((input: T) => [value, input]);

export const union = <T, U>(firstParser: Parser<T, U>, ...parsers: Parser<T, U>[]) => parser((input: T) => {
  let error: ParseError | undefined = undefined;
  for (let p of [firstParser, ...parsers]) {
    const result = parse(p, input);
    if (result.success) {
      return [result.value, result.rest];
    }
    error = result.error;
  }
  throw error!;
});

export const list = <T, U>(p: Parser<T, U>): Parser<T, U[]> => function*() {
  const results = [];
  while (true) {
    try {
      results.push(yield* p());
    } catch (e) {
      assertIsParseError(e);
      break;
    }
  }
  return results;
}

export const list1 = <T, U>(p: Parser<T, U>): Parser<T, U[]> => function*() {
  const first = yield* p();
  const rest = yield* list(p)();
  return [first, ...rest];
};
