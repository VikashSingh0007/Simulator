import { ApiGateway } from './ApiGateway.js';
import { LoadBalancer } from './LoadBalancer.js';
import { Cache } from './Cache.js';
import { Database } from './Database.js';
import { MessageQueue } from './MessageQueue.js';
import { Service } from './Service.js';
import { COMPONENT_TYPES } from '../../utils/constants.js';

/**
 * ComponentFactory - Factory Pattern for creating simulation components.
 */
export class ComponentFactory {
  static create(id, type, config, metricsCollector) {
    switch (type) {
      case COMPONENT_TYPES.API_GATEWAY:
        return new ApiGateway(id, config, metricsCollector);
      case COMPONENT_TYPES.LOAD_BALANCER:
        return new LoadBalancer(id, config, metricsCollector);
      case COMPONENT_TYPES.CACHE:
        return new Cache(id, config, metricsCollector);
      case COMPONENT_TYPES.DATABASE:
        return new Database(id, config, metricsCollector);
      case COMPONENT_TYPES.MESSAGE_QUEUE:
        return new MessageQueue(id, config, metricsCollector);
      case COMPONENT_TYPES.SERVICE:
        return new Service(id, config, metricsCollector);
      default:
        throw new Error(`Unknown component type: ${type}`);
    }
  }
}
