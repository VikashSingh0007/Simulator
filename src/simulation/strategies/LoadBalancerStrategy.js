/**
 * Load Balancer Strategies - Strategy Pattern implementation.
 * Each strategy implements select(targets, request) → targetId
 */

export class RoundRobinStrategy {
  constructor() {
    this.index = 0;
  }

  select(targets) {
    if (targets.length === 0) return null;
    const target = targets[this.index % targets.length];
    this.index++;
    return target;
  }

  reset() {
    this.index = 0;
  }
}

export class WeightedRoundRobinStrategy {
  constructor() {
    this.index = 0;
    this.currentWeight = 0;
  }

  select(targets, _request, weights = {}) {
    if (targets.length === 0) return null;
    
    const maxWeight = Math.max(...targets.map(t => weights[t] || 1));
    const gcd = this._gcd(targets.map(t => weights[t] || 1));

    while (true) {
      this.index = (this.index + 1) % targets.length;
      if (this.index === 0) {
        this.currentWeight -= gcd;
        if (this.currentWeight <= 0) {
          this.currentWeight = maxWeight;
        }
      }
      if ((weights[targets[this.index]] || 1) >= this.currentWeight) {
        return targets[this.index];
      }
    }
  }

  _gcd(arr) {
    const gcd2 = (a, b) => b === 0 ? a : gcd2(b, a % b);
    return arr.reduce((a, b) => gcd2(a, b));
  }

  reset() {
    this.index = 0;
    this.currentWeight = 0;
  }
}

export class LeastConnectionsStrategy {
  select(targets, _request, _weights, activeConnections = {}) {
    if (targets.length === 0) return null;
    let minConn = Infinity;
    let selected = targets[0];
    for (const targetId of targets) {
      const conn = activeConnections[targetId] || 0;
      if (conn < minConn) {
        minConn = conn;
        selected = targetId;
      }
    }
    return selected;
  }

  reset() {}
}

export class RandomStrategy {
  select(targets) {
    if (targets.length === 0) return null;
    return targets[Math.floor(Math.random() * targets.length)];
  }

  reset() {}
}

// Factory to create strategies
export function createLoadBalancerStrategy(strategyName) {
  switch (strategyName) {
    case 'roundRobin': return new RoundRobinStrategy();
    case 'weightedRoundRobin': return new WeightedRoundRobinStrategy();
    case 'leastConnections': return new LeastConnectionsStrategy();
    case 'random': return new RandomStrategy();
    default: return new RoundRobinStrategy();
  }
}
