export type ParserFunction<T, U> = (input: T) => [U, T];
export type Parser<T, U> = Generator<T | null, U, T | null>;
export type ParseResult<T, U> = {
  success: true,
  value: U,
  rest: T,
};
export type ParseFail = {
  success: false,
  error: ParseError,
}
export type ParseOutput<T, U> = ParseResult<T, U> | ParseFail;

class ParseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class UnexpectedEofError extends ParseError {
  constructor() {
    super('Unexpected EoF encountered');
  }
}

class UnexpectedCharacterError extends ParseError {
  constructor(char: string) {
    super(`Unexpected character "${char}" encountered`);
  }
}

export function parserFunction<T, U>(p: ParserFunction<T, U>) {
  return function*(): Parser<T, U> {
    const input = yield null;
    const [result, rest] = p(input!);
    yield rest;
    return result;
  }
}

export function parse<T, U>(parser: Parser<T, U>, input: T): ParseOutput<T, U> {
  try {
    let remainingInput = input;
    const p = parser;
    let state = p.next();
    while (!state.done) {
      state = p.next(remainingInput);
      if (!state.done) {
        remainingInput = state.value!;
        state = p.next();
      }
    }
    return {
      success: true,
      value: state.value,
      rest: remainingInput,
    };
  } catch (error) {
    if (!(error instanceof ParseError)) {
      throw error;
    }
    return {
      success: false,
      error,
    };
  }
}

export const union = <T, U>(firstParser: Parser<T, U>, ...parsers: Parser<T, U>[]) => parserFunction((input: T) => {
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

export const character = parserFunction((input: string) => {
  if (input[0] !== '') {
    return [input[0], input.slice(1)];
  }
  throw new UnexpectedEofError();
});

export const char = function*(c: string) {
  const aCharacter = yield* character();
  if (aCharacter === c) {
    return aCharacter;
  }
  throw new UnexpectedCharacterError(aCharacter);
}

export const digit = function*() {
  const c = yield* character();
  const n = parseInt(c, 10);
  if (isNaN(n)) {
    throw new UnexpectedCharacterError(c);
  }
  return n;
}
