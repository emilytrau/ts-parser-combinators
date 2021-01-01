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
  oneOf,
  satisfy,
  string,
} from '../string';

type JsonValue = string | number | boolean | { [k: string]: JsonValue } | JsonValue[] | null;

const parseWs = flatten(list(union(
  char('\u0020'),
  char('\u000A'),
  char('\u000D'),
  char('\u0009'),
)));

const parseSign = union(
  char('+'),
  char('-'),
  identity('')
);

const parseOneNine = satisfy((i) => i >= '1' && i <= '9');

const parseDigit = union(char('0'), parseOneNine);
const parseDigits = flatten(list1(parseDigit));

const parseExponent = union(
  concat(oneOf('eE'), parseSign, parseDigits),
  identity(''),
);

const parseFraction = union(
  concat(char('.'), parseDigits),
  identity(''),
);

const parseInteger = union(
  parseDigit,
  concat(parseOneNine, parseDigits),
  concat(char('-'), parseDigits),
  concat(char('-'), parseOneNine, parseDigits),
);

const parseNumber = function*() {
  const s = yield* concat(parseInteger, parseFraction, parseExponent)();
  return parseFloat(s);
}

const parseHex = union(
  parseDigit,
  satisfy((i) => i >= 'a' && i <= 'f'),
  satisfy((i) => i >= 'A' && i <= 'F'),
);

const parseEscape = union(
  oneOf('"\\/bfnrt'),
  concat(char('u'), flatten(repeat(4, parseHex))),
);

const parseCharacter = union(
  satisfy((i) => i !== '*' && i !== '\\' && i >= '\u0020' && i <= '\u{10FFFF}'),
  concat(char('\\'), parseEscape),
);

const parseCharacters = flatten(list(parseCharacter));

const parseString = concat(char('"'), parseCharacters, char('"'));

const parseElement = function*() {
  yield* parseWs();
  const value = yield* parseValue();
  yield* parseWs();
  return value;
}

const parseElements = sepby1(parseElement, char(','));

const parseArray = function*() {
  yield* char('[')();
  const values = yield* union(parseElements, identity([]))();
  yield* char(']')();
  return values;
}

const parseMember = function*() {
  yield* parseWs();
  const key = yield* parseString();
  yield* parseWs();
  yield* char(':')();
  const value = yield* parseElement();
  return [key, value] as const;
}

const parseMembers = sepby1(parseMember, char(','));

const parseObject = function*() {
  yield* char('{')();
  const members = yield* union(parseMembers, identity([]))();
  yield* char('}')();
  return Object.fromEntries(members);
}

const parseTrue = bind(string('true'), () => identity<string, true>(true));

const parseFalse = bind(string('false'), () => identity<string, false>(false));

const parseNull = bind(string('null'), () => identity<string, null>(null));

const parseValue: Parser<string, JsonValue> = union<string, JsonValue>(
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
