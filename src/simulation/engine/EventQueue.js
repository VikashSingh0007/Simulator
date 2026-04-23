/**
 * EventQueue - Min-heap priority queue for discrete event simulation.
 * Events are ordered by timestamp (earliest first).
 * O(log n) insert, O(log n) extract-min.
 */
export class EventQueue {
  constructor() {
    this.heap = [];
    this.eventCounter = 0;
  }

  get size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  /**
   * Insert an event into the queue.
   * @param {Object} event - { timestamp, type, payload, source, target }
   */
  enqueue(event) {
    event.id = event.id || ++this.eventCounter;
    event.insertOrder = this.eventCounter;
    this.heap.push(event);
    this._bubbleUp(this.heap.length - 1);
  }

  /**
   * Extract the event with the smallest timestamp.
   * @returns {Object|null} The next event, or null if empty.
   */
  dequeue() {
    if (this.heap.length === 0) return null;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  /**
   * Peek at the next event without removing it.
   */
  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  clear() {
    this.heap = [];
    this.eventCounter = 0;
  }

  _bubbleUp(idx) {
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      if (this._compare(this.heap[idx], this.heap[parentIdx]) < 0) {
        [this.heap[idx], this.heap[parentIdx]] = [this.heap[parentIdx], this.heap[idx]];
        idx = parentIdx;
      } else {
        break;
      }
    }
  }

  _sinkDown(idx) {
    const length = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < length && this._compare(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }
      if (right < length && this._compare(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== idx) {
        [this.heap[idx], this.heap[smallest]] = [this.heap[smallest], this.heap[idx]];
        idx = smallest;
      } else {
        break;
      }
    }
  }

  _compare(a, b) {
    if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    return a.insertOrder - b.insertOrder;
  }
}
