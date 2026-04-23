// Utility functions

export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

// Calculate percentile from sorted array
export function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const index = Math.ceil((p / 100) * sortedArr.length) - 1;
  return sortedArr[Math.max(0, index)];
}

// Insert into sorted array (binary search insertion)
export function sortedInsert(arr, value) {
  let low = 0;
  let high = arr.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (arr[mid] < value) low = mid + 1;
    else high = mid;
  }
  arr.splice(low, 0, value);
  return arr;
}

// Poisson random number (for traffic generation)
export function poissonRandom(lambda) {
  let L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

// Exponential random number (for inter-arrival times)
export function exponentialRandom(rate) {
  return -Math.log(1 - Math.random()) / rate;
}

// Gaussian random (for latency jitter)
export function gaussianRandom(mean, stddev) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mean + z * stddev;
}

// Clamp a value between min and max
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

// Format large numbers
export function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(0);
}

// Format duration in ms
export function formatMs(ms) {
  if (ms >= 1000) return (ms / 1000).toFixed(1) + 's';
  return ms.toFixed(1) + 'ms';
}

// Throttle function
export function throttle(fn, delay) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

// Deep clone
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
