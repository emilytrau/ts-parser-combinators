import {
  parserFunction,
  ParseError,
  UnexpectedEofError,
} from '.';

export class UnexpectedCharacterError extends ParseError {
  constructor(found: string, expected: string) {
    super(`Unexpected character "${found}" encountered, expected ${expected}`);
  }
}

export const eof = parserFunction((input: string) => {
  if (input !== '') {
    throw new UnexpectedCharacterError(input[0], '<EOF>');
  }
  return ['', ''];
})

export const character = parserFunction((input: string) => {
  if (input[0] === '') {
    throw new UnexpectedEofError();
  }
  return [input[0], input.slice(1)];
});

export const char = function*(c: string) {
  const aCharacter = yield* character();
  if (aCharacter === c) {
    return aCharacter;
  }
  throw new UnexpectedCharacterError(aCharacter, `"${c}"`);
}

export const digit = function*() {
  const c = yield* character();
  const n = parseInt(c, 10);
  if (isNaN(n)) {
    throw new UnexpectedCharacterError(c, 'a digit');
  }
  return n;
}
