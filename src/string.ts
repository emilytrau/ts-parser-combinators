import {
  fail,
  parser,
  Parser,
  unexpectedEof,
} from '.';

export const unexpectedCharacter = (found: string, expected: string) => fail(`Unexpected character "${found}" encountered, expected ${expected}`);

export const eof = parser((input: string) => {
  if (input !== '') {
    throw unexpectedCharacter(input[0], '<EOF>');
  }
  return ['', ''];
})

export const character = parser((input: string) => {
  if (input[0] === '') {
    throw unexpectedEof();
  }
  return [input[0], input.slice(1)];
});

export const char = (c: string): Parser<string, string> => function*() {
  const aCharacter = yield* character();
  if (aCharacter === c) {
    return aCharacter;
  }
  throw unexpectedCharacter(aCharacter, `"${c}"`);
}

export const digit: Parser<string, number> = function*() {
  const c = yield* character();
  const n = parseInt(c, 10);
  if (isNaN(n)) {
    throw unexpectedCharacter(c, 'a digit');
  }
  return n;
}
