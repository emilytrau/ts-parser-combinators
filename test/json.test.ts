import { parse, Parser } from '../src';
import * as json from '../src/examples/json';

type Test<U> = {
  name: string;
  parser: Parser<string, U>;
  cases: { success: boolean; input: string; out: U }[];
};
const tests: Test<any>[] = [
  {
    name: 'parse string',
    parser: json.parseString,
    cases: [{ success: true, input: '"hello"', out: 'hello' }],
  },
  {
    name: 'parse number',
    parser: json.parseNumber,
    cases: [
      { success: true, input: '1', out: 1 },
      { success: true, input: '-1', out: -1 },
      { success: true, input: '1.2', out: 1.2 },
      { success: true, input: '1.2e3', out: 1.2e3 },
      { success: false, input: '01', out: null },
      { success: false, input: '1.', out: null },
      { success: false, input: '.1', out: null },
    ],
  },
  {
    name: 'parse true',
    parser: json.parseTrue,
    cases: [
      { success: true, input: 'true', out: true },
      { success: false, input: 'false', out: null },
    ],
  },
  {
    name: 'parse false',
    parser: json.parseFalse,
    cases: [
      { success: true, input: 'false', out: false },
      { success: false, input: 'true', out: null },
    ],
  },
  {
    name: 'parse null',
    parser: json.parseNull,
    cases: [{ success: true, input: 'null', out: null }],
  },
  {
    name: 'parse object',
    parser: json.parseObject,
    cases: [
      { success: true, input: '{}', out: {} },
      { success: true, input: '{ "hello": "world" }', out: { hello: 'world' } },
      {
        success: true,
        input: '{ "hello": "world", "one": "two" }',
        out: { hello: 'world', one: 'two' },
      },
    ],
  },
  {
    name: 'parse array',
    parser: json.parseArray,
    cases: [
      { success: true, input: '[]', out: [] },
      { success: true, input: '[1]', out: [1] },
      { success: true, input: '[1, 2]', out: [1, 2] },
    ],
  },
];

tests.forEach(({ name, parser, cases }) => {
  test(name, () => {
    cases.forEach(({ success, input, out }) => {
      const r = parse(parser, input);
      const didSucceed = r.success && r.rest === '';
      if (didSucceed !== success) {
        debugger;
        fail();
      } else {
        if (didSucceed && r.success) {
          expect(r.value).toEqual(out);
        }
      }
    });
  });
});
