export function pickClosestTo(maxNum, nums) {
  if (nums.includes(maxNum)) return maxNum;

  const below = nums.filter((n) => n < maxNum);

  if (below.length === 0) return null;

  return Math.max(...below);
}
