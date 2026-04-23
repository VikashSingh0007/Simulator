import { exponentialRandom, generateId } from '../../utils/helpers.js';
import { EVENT_TYPES } from '../../utils/constants.js';

/**
 * TrafficGenerator - Generates simulated request events.
 * Uses Poisson process (exponential inter-arrival times) for realistic traffic.
 */
export class TrafficGenerator {
  constructor(config = {}) {
    this.rps = config.rps || 100;
    this.burstFactor = config.burstFactor || 1;
    this.burstInterval = config.burstInterval || 10; // seconds between bursts
    this.burstDuration = config.burstDuration || 2; // seconds per burst
    this.readWriteRatio = config.readWriteRatio || 80; // % reads
    this.enabled = true;
    this.requestCount = 0;
  }

  updateConfig(config) {
    if (config.rps !== undefined) this.rps = config.rps;
    if (config.burstFactor !== undefined) this.burstFactor = config.burstFactor;
    if (config.burstInterval !== undefined) this.burstInterval = config.burstInterval;
    if (config.burstDuration !== undefined) this.burstDuration = config.burstDuration;
    if (config.readWriteRatio !== undefined) this.readWriteRatio = config.readWriteRatio;
  }

  /**
   * Generate request events for a time window.
   * @param {number} startTime - Start of window (ms)
   * @param {number} duration - Duration of window (ms)
   * @param {string} entryComponentId - ID of the entry component (e.g. API gateway)
   * @returns {Array} Array of events
   */
  generateEvents(startTime, duration, entryComponentId) {
    const events = [];
    let currentTime = startTime;
    const endTime = startTime + duration;

    while (currentTime < endTime) {
      // Check if we're in a burst period
      const elapsedSec = currentTime / 1000;
      const inBurst = this.burstFactor > 1 &&
        (elapsedSec % this.burstInterval) < this.burstDuration;
      
      const effectiveRPS = inBurst ? this.rps * this.burstFactor : this.rps;
      
      // Exponential inter-arrival time
      const interArrival = exponentialRandom(effectiveRPS / 1000) ; // Convert to ms
      currentTime += Math.max(interArrival, 0.1); // Minimum 0.1ms between requests

      if (currentTime >= endTime) break;

      const isRead = Math.random() * 100 < this.readWriteRatio;
      this.requestCount++;

      events.push({
        type: EVENT_TYPES.REQUEST_ARRIVE,
        timestamp: currentTime,
        payload: {
          requestId: generateId(),
          type: isRead ? 'read' : 'write',
          key: `key_${Math.floor(Math.random() * 10000)}`,
          startTime: currentTime,
          path: [],
          retries: 0,
        },
        source: 'traffic_generator',
        target: entryComponentId,
      });
    }

    return events;
  }
}
