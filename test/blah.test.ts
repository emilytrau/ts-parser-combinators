import { parse, list1, union } from '../src';
import { char, character, string } from '../src/string';

const a = char('a');

const aaParser = function*() {
  yield* a();
  yield* a();
  return 'aa';
};

console.log(parse(aaParser, 'aabb'));

const abParser = function*() {
  yield* a();
  yield* char('b')();
  return 'ab';
};

console.log(parse(abParser, 'aa'));

list1(char('a'));

describe('blah', () => {
  it('works', () => {
    expect(parse(character, 'aaaa')).toEqual({
      success: true,
      value: 'a',
      rest: 'aaa',
    });
  });
});

// const x = union();

const y = union(string('world'), string('hello'));
const z = parse(y, null);
