export type ChartData = ReadonlyArray<readonly [tm: number, value: number]>;

export function fixContinuousReadings(
  val: readonly number[]
): readonly number[] {
  return val.reduce((result, input, idx, arr) => {
    const newResult = [...result, input];

    if (idx === 0) {
      return newResult;
    }
    if (input >= arr[idx - 1]) {
      return newResult;
    }
    const lastCorrectElIdx = result.findLastIndex((el) => el <= input);
    if (lastCorrectElIdx === -1) {
      // special case: last element is lower than all previous inputs
      // so replace all elements with the last one
      return Array(newResult.length).fill(input);
    }

    const lastCorrectEl = result[lastCorrectElIdx];

    const stepsCount = idx - lastCorrectElIdx;
    const step = (input - lastCorrectEl) / stepsCount;

    for (let i = 1; i < stepsCount; ++i) {
      const currentIndex = i + lastCorrectElIdx;
      newResult[currentIndex] = i * step + lastCorrectEl;
    }

    return newResult;
  }, [] as number[]);
}
