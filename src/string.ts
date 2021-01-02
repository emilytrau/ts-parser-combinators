import {
  bind,
  fail,
  identity,
  parser,
  Parser,
  unexpectedEof,
} from '.';

export const unexpectedCharacter = (found: string) => fail(`Unexpected character "${found}" encountered`);

export const eof = parser((input: string) => {
  if (input !== '') {
    throw unexpectedCharacter(input[0]);
  }
  return ['', ''];
})

export const character = parser((input: string) => {
  if (input[0] === '') {
    throw unexpectedEof();
  }
  return [input[0], input.slice(1)];
});

export const satisfy = (condition: (i: string) => boolean): Parser<string, string> => function*() {
  const c = yield* character();
  if (!condition(c)) {
    throw unexpectedCharacter(c);
  }
  return c;
}

export const flatten = (p: Parser<string, string[]>): Parser<string, string> => function*() {
  let output = '';
  const strings = yield* p();
  for (let s of strings) {
    output += s;
  }
  return output;
}

export const char = (c: string) => satisfy((i) => i === c);

export const oneOf = (options: string) => satisfy((i) => options.indexOf(i) !== -1);

export const concat = (...parsers: Parser<string, string>[]) => function*() {
  let output = '';
  for (let p of parsers) {
    output += yield* p();
  }
  return output;
}

export const string = <T extends string>(s: T): Parser<string, T> => function*() {
  for (let letter of s) {
    yield* char(letter)();
  }
  return s;
}

export const literal = <U>(s: string, v: U) => bind(string(s), () => identity<string, U>(v));
