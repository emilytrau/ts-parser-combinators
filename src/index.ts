export * from './parsers';

export type ParserFunction<T, U> = (input: T) => [U, T];
export type Parser<T, U> = () => Generator<T | null, U, T | null>;
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

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class UnexpectedEofError extends ParseError {
  constructor() {
    super('Unexpected EoF encountered');
  }
}

export function parser<T, U>(p: ParserFunction<T, U>): Parser<T, U> {
  return function*() {
    const input = yield null;
    const [result, rest] = p(input!);
    yield rest;
    return result;
  }
}

export function parse<T, U>(parser: Parser<T, U>, input: T): ParseOutput<T, U> {
  try {
    let remainingInput = input;
    const p = parser();
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

