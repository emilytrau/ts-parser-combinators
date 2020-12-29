export type Parser<T, U> = (input: T) => ParseOutput<T, U>;

/**
 * T: Input type
 * U: Output type
 * V: Inner parser output type
 */
export type ParserWrapper<T, U, V> = () => Generator<Parser<T, V>, ParseWrapperOutput<U>, ParseOutput<T, V>>;


export type ParseResult<T, U> = {
  error: false
  value: U,
  rest: T,
};

export type ParseError = {
  error: true,
  message: string,
};

export type ParseOutput<T, U> = ParseResult<T, U> | ParseError;

export type ParseWrapperResult<U> = {
  error: false,
  value: U,
};

export type ParseWrapperOutput<U> = ParseWrapperResult<U> | ParseError;

export function result<T, U>(r: U, rest: T): ParseOutput<T, U> {
  return {
    error: false,
    value: r,
    rest,
  };
}

export function error<T, U>(message: string): ParseOutput<T, U> {
  return {
    error: true,
    message,
  };
}

export function parser<T, U, V>(p: ParserWrapper<T, U, V>): Parser<T, U> {
  return (input: T) => {
    const iterator = p();
    let currentParser = iterator.next();
    let currentInput = input;
    while (!currentParser.done) {
      const innerParser = currentParser.value;
      const output = innerParser(currentInput);
      if (output.error) {
        return output;
      }
      currentInput = output.rest;
      currentParser = iterator.next(output);
    }

    const finalOutput = currentParser.value;
    if (finalOutput.error) {
      return finalOutput;
    } 

    return result(finalOutput.value, currentInput);
  }
}

export const character = (input: string) => {
  if (input[0] !== '') {
    return result(input[0], input.slice(1));
  }
  return error<string, string>('unexpected eof');
}

export const char = (c: string) => {
  function* charParser() {
    const aCharacter: string = yield character;
    if (aCharacter === c) {
      return <ParseWrapperOutput<string>>{ error: false, value: aCharacter };
    }
    return <ParseWrapperOutput<string>>{ error: true, message: 'unexpected char '};
  }
  return parser<string, string, string>(charParser)
};
