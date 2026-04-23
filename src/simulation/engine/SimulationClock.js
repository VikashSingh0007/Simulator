/**
 * SimulationClock - Virtual time management for the simulation.
 * Singleton per simulation run.
 */
export class SimulationClock {
  constructor() {
    this.currentTime = 0; // in milliseconds (virtual)
    this.startTime = 0;
    this.speed = 1;
  }

  get now() {
    return this.currentTime;
  }

  reset() {
    this.currentTime = 0;
    this.startTime = 0;
  }

  advance(ms) {
    this.currentTime += ms;
  }

  setTime(ms) {
    this.currentTime = ms;
  }

  setSpeed(speed) {
    this.speed = speed;
  }

  // Duration since simulation start, in seconds
  elapsedSeconds() {
    return (this.currentTime - this.startTime) / 1000;
  }
}
