/**
 * A JSON parser based on the json.org spec (https://www.crockford.com/mckeeman.html)
 * It's reasonaly faithful to spec to demonstrate how easy it is to convert a grammar to parser-combinators
 * This is probably incomplete and should definitely not be used in production
 */

import {
  bind,
  identity,
  list,
  list1,
  Parser,
  repeat,
  sepby1,
  union,
} from '..';
import {
  char,
  concat,
  eof,
  flatten,
  literal,
  oneOf,
  satisfy,
} from '../string';

const cQuote = char('"');
const cLSBracket = char('[');
const cRSquareBracket = char(']');
const cLCurlyBracket = char('{');
const cRCurlyBracket = char('}');
const cColon = char(':');

type JsonValue = string | number | boolean | { [k: string]: JsonValue } | JsonValue[] | null;

export const parseWs = flatten(list(union(
  char('\u0020'),
  char('\u000A'),
  char('\u000D'),
  char('\u0009'),
)));

export const parseSign = union(
  char('+'),
  char('-'),
  identity(''),
);

export const parseOneNine = satisfy((i) => i >= '1' && i <= '9');

export const parseDigit = union(char('0'), parseOneNine);
export const parseDigits = flatten(list1(parseDigit));

export const parseExponent = union(
  concat(oneOf('eE'), parseSign, parseDigits),
  identity(''),
);

export const parseFraction = union(
  concat(char('.'), parseDigits),
  identity(''),
);

export const parseInteger = union(
  concat(parseOneNine, parseDigits),
  parseDigit,
  concat(char('-'), parseOneNine, parseDigits),
  concat(char('-'), parseDigits),
);

export const parseNumber = bind(
  concat(parseInteger, parseFraction, parseExponent),
  (s) => identity(parseFloat(s)),
);

export const parseHex = union(
  parseDigit,
  satisfy((i) => i >= 'a' && i <= 'f'),
  satisfy((i) => i >= 'A' && i <= 'F'),
);

export const parseEscape = union(
  oneOf('"\\/bfnrt'),
  concat(char('u'), flatten(repeat(4, parseHex))),
);

export const parseCharacter = union(
  satisfy((i) => i !== '"' && i !== '\\' && i >= '\u0020' && i <= '\u{10FFFF}'),
  concat(char('\\'), parseEscape),
);

export const parseCharacters = flatten(list(parseCharacter));

export const parseString = function*() {
  yield* cQuote();
  const s = yield* parseCharacters();
  yield* cQuote();
  return s;
}

export const parseElement = function*() {
  yield* parseWs();
  const value = yield* parseValue();
  yield* parseWs();
  return value;
}

export const parseElements = sepby1(parseElement, char(','));

export const parseArray = function*() {
  yield* cLSBracket();
  const values = yield* union(parseElements, identity([]))();
  yield* cRSquareBracket();
  return values;
}

export const parseMember = function*() {
  yield* parseWs();
  const key = yield* parseString();
  yield* parseWs();
  yield* cColon();
  const value = yield* parseElement();
  return [key, value] as const;
}

export const parseMembers = sepby1(parseMember, char(','));

export const parseObject = function*() {
  yield* cLCurlyBracket();
  const members = yield* union(parseMembers, identity([]))();
  yield* cRCurlyBracket();
  return Object.fromEntries(members);
}

export const parseTrue = literal('true', true);

export const parseFalse = literal('false', false);

export const parseNull = literal('null', null);

export const parseValue: Parser<string, JsonValue> = union<string, JsonValue>(
  parseObject,
  parseArray,
  parseString,
  parseNumber,
  parseTrue,
  parseFalse,
  parseNull,
);

export const json = function*() {
  const value = yield* parseElement();
  yield* eof();
  return value;
}
