import { route } from './ItinerarySearchActions';
import config from '../config';

export function storeEndpoint(actionContext, { target, endpoint }, done) {
  actionContext.dispatch('setEndpoint', {
    target,
    value: {
      lat: endpoint.lat,
      lon: endpoint.lon,
      address: endpoint.address,
    },
  });

  return done();
}

export function setEndpoint(actionContext, payload) {
  return actionContext.executeAction(storeEndpoint, payload, e => {
    if (e) {
      // Todo: Show there shrow instead
      return console.error('Could not store endpoint: ', e);
    }
    return actionContext.executeAction(route, undefined, e2 => {
      if (e2) {
        return console.error('Could not route:', e2);
      }
      return undefined;
    });
  });
}

export function setUseCurrent(actionContext, target) {
  actionContext.dispatch('useCurrentPosition', target);
  return actionContext.executeAction(route);
}

export function swapEndpoints(actionContext) {
  actionContext.dispatch('swapEndpoints');

  return actionContext.executeAction(route, undefined, e => {
    if (e) {
      return console.error('Could not route:', e);
    }
    return undefined;
  });
}

export function clearOrigin(actionContext) {
  return actionContext.dispatch('clearOrigin');
}

export function clearDestination(actionContext) {
  return actionContext.dispatch('clearDestination');
}

export function clearGeolocation(actionContext) {
  return actionContext.dispatch('clearGeolocation');
}

export function setOriginToDefault(actionContext) {
  return actionContext.executeAction(setEndpoint, {
    target: 'origin',
    endpoint: config.defaultEndpoint,
  });
}
