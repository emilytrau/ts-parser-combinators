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

type UnwrapParserT<P> = P extends Parser<infer T, infer _> ? T : P;
type UnwrapParserU<P> = P extends Parser<infer _, infer U> ? U : P;
type NonEmptyArray<T> = [T, ...T[]];
type NotAUnion<T, U = T> = U extends any ? [T] extends [U] ? T : never : never;

export const union = <T, P extends NonEmptyArray<Parser<T, unknown>>>(...parsers: P) => parser((input: T) => {
  type Parsers = typeof parsers[number];
  type InputType = NotAUnion<UnwrapParserT<Parsers>>;
  type ResultTypes = UnwrapParserU<Parsers>;
  type UnionParser = Parser<InputType, ResultTypes>;

  let error: ParseError | undefined = undefined;
  for (let p of parsers) {
    let result = parse(p as UnionParser, input as InputType);
    if (result.success) {
      return [result.value, result.rest];
    }
    if (!error) {
      error = result.error;
    }
  }
  throw error!;
});

export const list = <T, U>(p: Parser<T, U>): Parser<T, U[]> => union(list1(p), identity<T, U[]>([]));

export const list1 = <T, U>(p: Parser<T, U>): Parser<T, U[]> => function*() {
  const first = yield* p();
  const rest = yield* list(p)();
  return [first, ...rest];
};

export const sepby = <T, U, V>(p: Parser<T, U>, s: Parser<T, V>): Parser<T, U[]> => union(sepby1(p, s), identity<T, U[]>([]));

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
