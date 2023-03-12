import { describe, it, expect } from "vitest";
import { fixContinuousReadings } from "./utils.js";

describe(`utils`, () => {
  describe(`fixContinuousReadings`, () => {
    it.each([
      [[]],
      [[0]],
      [[1]],
      [[1, 2, 3]],
      [[9, 9, 9, 9, 9]],
      [[1, 2, 3, 3, 3, 5, 7, 7, 7, 7, 7, 8]],
    ])(`return the same data for non-decreasing array: %p`, (val) => {
      expect(fixContinuousReadings(val)).toEqual(val);
    });

    it.each(
      // prettier-ignore
      [
        { val: [5, 1], expected: [1, 1] },
        { val: [1, 2, 1], expected: [1, 1, 1] },
        { val: [1, 3, 2], expected: [1, 1.5, 2] },
        { val: [1, 10, 7], expected: [1, 4, 7] },
        { val: [1, 2, 3, 2], expected: [1, 2, 2, 2] },
        { val: [1, 2, 4, 3], expected: [1, 2, 2.5, 3] },
        { val: [1, 2, 3, 4, 2], expected: [1, 2, 2, 2, 2] },
        { val: [1, 2, 3, 4, 2.5], expected: [1, 2, 2.1666666666666665, 2.3333333333333335, 2.5] },
        { val: [1, 2, 4, 5, 3], expected: [1, 2, 2.3333333333333335, 2.6666666666666665, 3] },
        { val: [1, 2, 3, 2, 3, 4, 3, 4, 5], expected: [1, 2, 2, 2, 3, 3, 3, 4, 5] },
        { val: [1, 2, 4, 5, 3, 4, 3.5, 4, 5], expected: [1, 2, 2.3333333333333335, 2.6666666666666665, 3, 3.25, 3.5, 4, 5] },
        { val: [299, 500, 711, 857, 876, 951, 951, 970, 1050, 970, 1150, 970, 1070, 1070, 1160, 1270, 1432, 1609], expected: [299, 500, 711, 857, 876, 951, 951, 970, 970, 970, 970, 970, 1070, 1070, 1160, 1270, 1432, 1609] },
      ]
    )(`interpolate for inconsistent data: %p`, ({ val, expected }) => {
      expect(fixContinuousReadings(val)).toEqual(expected);
    });
  });
});
