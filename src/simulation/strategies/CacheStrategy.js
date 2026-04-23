/**
 * Cache Strategies - LRU and LFU eviction implementations.
 * These are real, working data structures with proper time complexity.
 */

/**
 * LRU Cache - Doubly Linked List + HashMap
 * O(1) get, O(1) put
 */
export class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key → node
    this.head = { key: null, val: null, prev: null, next: null };
    this.tail = { key: null, val: null, prev: null, next: null };
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get(key) {
    if (this.map.has(key)) {
      const node = this.map.get(key);
      this._remove(node);
      this._addToFront(node);
      this.hits++;
      return node.val;
    }
    this.misses++;
    return null;
  }

  put(key, value) {
    let evicted = null;
    if (this.map.has(key)) {
      const node = this.map.get(key);
      node.val = value;
      this._remove(node);
      this._addToFront(node);
    } else {
      if (this.map.size >= this.capacity) {
        const lru = this.tail.prev;
        this._remove(lru);
        this.map.delete(lru.key);
        this.evictions++;
        evicted = lru.key;
      }
      const node = { key, val: value, prev: null, next: null };
      this._addToFront(node);
      this.map.set(key, node);
    }
    return evicted;
  }

  get size() {
    return this.map.size;
  }

  get hitRate() {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  getState() {
    const items = [];
    let node = this.head.next;
    while (node !== this.tail) {
      items.push(node.key);
      node = node.next;
    }
    return {
      items, // Most recent first
      size: this.map.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: this.hitRate,
    };
  }

  clear() {
    this.map.clear();
    this.head.next = this.tail;
    this.tail.prev = this.head;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  _remove(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  _addToFront(node) {
    node.next = this.head.next;
    node.prev = this.head;
    this.head.next.prev = node;
    this.head.next = node;
  }
}

/**
 * LFU Cache - Frequency-based eviction
 * O(1) get, O(1) put using frequency buckets
 */
export class LFUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map(); // key → { val, freq }
    this.freqMap = new Map(); // freq → Set of keys (insertion order)
    this.minFreq = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  get(key) {
    if (!this.map.has(key)) {
      this.misses++;
      return null;
    }
    this.hits++;
    const item = this.map.get(key);
    this._incrementFreq(key, item);
    return item.val;
  }

  put(key, value) {
    if (this.capacity <= 0) return null;
    let evicted = null;

    if (this.map.has(key)) {
      const item = this.map.get(key);
      item.val = value;
      this._incrementFreq(key, item);
    } else {
      if (this.map.size >= this.capacity) {
        evicted = this._evict();
      }
      this.map.set(key, { val: value, freq: 1 });
      if (!this.freqMap.has(1)) this.freqMap.set(1, new Set());
      this.freqMap.get(1).add(key);
      this.minFreq = 1;
    }
    return evicted;
  }

  get size() {
    return this.map.size;
  }

  get hitRate() {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  getState() {
    const items = [];
    for (const [key, item] of this.map) {
      items.push({ key, freq: item.freq });
    }
    items.sort((a, b) => b.freq - a.freq);
    return {
      items: items.map(i => `${i.key}(f:${i.freq})`),
      size: this.map.size,
      capacity: this.capacity,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRate: this.hitRate,
    };
  }

  clear() {
    this.map.clear();
    this.freqMap.clear();
    this.minFreq = 0;
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  _incrementFreq(key, item) {
    const oldFreq = item.freq;
    item.freq++;
    this.freqMap.get(oldFreq).delete(key);
    if (this.freqMap.get(oldFreq).size === 0) {
      this.freqMap.delete(oldFreq);
      if (this.minFreq === oldFreq) this.minFreq++;
    }
    if (!this.freqMap.has(item.freq)) this.freqMap.set(item.freq, new Set());
    this.freqMap.get(item.freq).add(key);
  }

  _evict() {
    const keys = this.freqMap.get(this.minFreq);
    const evictKey = keys.values().next().value;
    keys.delete(evictKey);
    if (keys.size === 0) this.freqMap.delete(this.minFreq);
    this.map.delete(evictKey);
    this.evictions++;
    return evictKey;
  }
}

export function createCacheStrategy(strategyName, capacity) {
  switch (strategyName) {
    case 'lru': return new LRUCache(capacity);
    case 'lfu': return new LFUCache(capacity);
    default: return new LRUCache(capacity);
  }
}
