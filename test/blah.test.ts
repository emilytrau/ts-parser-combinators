import { parser, character } from '../src';


const aaParser = parser(function*() {
  yield char('a');
  yield char('a');
  return 'aa';
});

describe('blah', () => {
  it('works', () => {
    expect(character('aaaa')).toEqual({ error: false, value: 'a', rest: 'aaa' });
  });
});
