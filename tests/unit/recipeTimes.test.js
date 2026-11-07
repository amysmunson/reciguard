import { parseDuration, formatMinutes, resolveTotalMinutes } from '../../lib/recipeTimes';

describe('parseDuration', () => {
  test.each([
    ['PT15M', 15],
    ['PT1H30M', 90],
    ['P0DT1H', 60],
    ['PT90M', 90],
    ['P1DT2H', 1560],
    ['1 hour 30 minutes', 90],
    ['45 mins', 45],
    ['90', 90],
    [30, 30],
  ])('%p → %p', (raw, minutes) => expect(parseDuration(raw)).toBe(minutes));

  test.each([[null], [''], ['PT'], ['PT0M'], ['abc'], [0]])('%p → null (unset)', (raw) =>
    expect(parseDuration(raw)).toBeNull()
  );
});

test('formatMinutes', () => {
  expect(formatMinutes(45)).toBe('45 min');
  expect(formatMinutes(60)).toBe('1 hr');
  expect(formatMinutes(90)).toBe('1 hr 30 min');
  expect(formatMinutes(null)).toBe('');
});

test('resolveTotalMinutes: published/typed total wins, else prep + cook', () => {
  expect(resolveTotalMinutes({ prepMinutes: 10, cookMinutes: 20, totalMinutes: null })).toBe(30);
  expect(resolveTotalMinutes({ prepMinutes: 10, cookMinutes: 20, totalMinutes: 90 })).toBe(90);
  expect(resolveTotalMinutes({ prepMinutes: null, cookMinutes: null, totalMinutes: null })).toBeNull();
});
