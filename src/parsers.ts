import {
  parse,
  parser,
  ParseError,
  Parser,
} from '.';

export const identity = <T, U>(value: U) => parser<T, U>((input: T) => [value, input]);

export const bind = <T, U, V>(p: Parser<T, U>, m: (x: U) => Parser<T, V>): Parser<T, V> => function*() {
  const v = yield* p();
  return yield* m(v)();
}

export const union = <T, U>(firstParser: Parser<T, U>, ...parsers: Parser<T, U>[]) => parser((input: T) => {
  let error: ParseError | undefined = undefined;
  for (let p of [firstParser, ...parsers]) {
    const result = parse(p, input);
    if (result.success) {
      return [result.value, result.rest];
    }
    if (!error) {
      error = result.error;
    }
  }
  throw error!;
});

export const list = <T, U>(p: Parser<T, U>): Parser<T, U[]> => union(list1(p), identity([]));

export const list1 = <T, U>(p: Parser<T, U>): Parser<T, U[]> => function*() {
  const first = yield* p();
  const rest = yield* list(p)();
  return [first, ...rest];
};

export const sepby = <T, U, V>(p: Parser<T, U>, s: Parser<T, V>): Parser<T, U[]> => union(sepby1(p, s), identity([]));

export const sepby1 = <T, U, V>(p: Parser<T, U>, s: Parser<T, V>): Parser<T, U[]> => function*() {
  const first = yield* p();
  const elements = yield* list(bind(s, () => p))();
  return [first, ...elements];
}

export const repeat = <T, U>(times: number, p: Parser<T, U>): Parser<T, U[]> => function*() {
  const results = [];
  for (let i = 0; i < times; i++) {
    results.push(yield* p());
  }
  return results;
}
