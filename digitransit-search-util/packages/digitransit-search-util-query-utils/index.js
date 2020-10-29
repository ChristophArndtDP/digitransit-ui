/* eslint-disable no-param-reassign */
import take from 'lodash/take';
import flatten from 'lodash/flatten';
import uniq from 'lodash/uniq';
import compact from 'lodash/compact';
import moment from 'moment';
import { fetchQuery, graphql } from 'react-relay';
import routeNameCompare from '@digitransit-search-util/digitransit-search-util-route-name-compare';
import {
  mapRoute,
  isStop,
} from '@digitransit-search-util/digitransit-search-util-helpers';
import filterMatchingToInput from '@digitransit-search-util/digitransit-search-util-filter-matching-to-input';

let relayEnvironment = null;

const alertsQuery = graphql`
  query digitransitSearchUtilQueryUtilsAlertsQuery {
    alerts(severityLevel: [SEVERE]) {
      stop {
        vehicleMode
        patterns {
          route {
            mode
          }
        }
      }
      route {
        mode
        shortName
      }
      alertHeaderText
      effectiveStartDate
      effectiveEndDate
    }
  }
`;

const searchBikeRentalStationsQuery = graphql`
  query digitransitSearchUtilQueryUtilsSearchBikeRentalStationsQuery {
    bikeRentalStations {
      name
      stationId
      lon
      lat
    }
  }
`;

const searchRoutesQuery = graphql`
  query digitransitSearchUtilQueryUtilsSearchRoutesQuery(
    $feeds: [String!]!
    $name: String
    $modes: [Mode]
  ) {
    viewer {
      routes(feeds: $feeds, name: $name, transportModes: $modes) {
        gtfsId
        agency {
          name
        }
        shortName
        mode
        longName
        patterns {
          code
        }
      }
    }
  }
`;

const favouriteStationsQuery = graphql`
  query digitransitSearchUtilQueryUtilsFavouriteStationsQuery(
    $ids: [String!]!
  ) {
    stations(ids: $ids) {
      gtfsId
      lat
      lon
      name
    }
  }
`;

const favouriteStopsQuery = graphql`
  query digitransitSearchUtilQueryUtilsFavouriteStopsQuery($ids: [String!]!) {
    stops(ids: $ids) {
      gtfsId
      lat
      lon
      name
      code
    }
  }
`;

const favouriteRoutesQuery = graphql`
  query digitransitSearchUtilQueryUtilsFavouriteRoutesQuery($ids: [String!]!) {
    routes(ids: $ids) {
      gtfsId
      agency {
        name
      }
      shortName
      mode
      longName
      patterns {
        code
      }
    }
  }
`;

const favouriteBikeRentalQuery = graphql`
  query digitransitSearchUtilQueryUtilsFavouriteBikeRentalStationsQuery(
    $ids: [String!]!
  ) {
    bikeRentalStations(ids: $ids) {
      name
      stationId
    }
  }
`;

const stopsQuery = graphql`
  query digitransitSearchUtilQueryUtilsStopsQuery($ids: [String!]!) {
    stops(ids: $ids) {
      gtfsId
      lat
      lon
      name
      code
      vehicleMode
    }
  }
`;

const stationsQuery = graphql`
  query digitransitSearchUtilQueryUtilsStationsQuery($ids: [String!]!) {
    stations(ids: $ids) {
      gtfsId
      lat
      lon
      name
      code
      vehicleMode
    }
  }
`;

/** Verifies that the data for favourites is coherent and current and fixes errors */
const verify = (stopStationMap, favourites) => {
  const result = favourites
    .map(favourite => {
      const fromQuery = stopStationMap[favourite.gtfsId];
      if (fromQuery) {
        favourite.lat = fromQuery.lat;
        favourite.lon = fromQuery.lon;
        if (fromQuery.code) {
          favourite.code = fromQuery.code;
        }
        return favourite;
      }
      return null;
    })
    .filter(r => r !== null);
  return result;
};
/**
 * Set you Relay environment
 * @param {*} environment Your Relay environment
 *
 */
export function setRelayEnvironment(environment) {
  relayEnvironment = environment;
}

export const getModesWithAlerts = currentTime => {
  if (!relayEnvironment) {
    return Promise.resolve([]);
  }
  return fetchQuery(relayEnvironment, alertsQuery)
    .then(res => {
      const modes = res.alerts.map(i => {
        if (
          i.route &&
          i.route.mode &&
          i.effectiveStartDate <= currentTime &&
          i.effectiveEndDate >= currentTime
        ) {
          return i.route.mode;
        }
        return undefined;
      });
      return modes;
    })
    .then(compact)
    .then(uniq);
};
/**
 * Returns Stop and station objects .
 * @param {*} favourites
 */
export const getStopAndStationsQuery = favourites => {
  // TODO perhaps validate stops/stations through geocoding api instead of routing?
  if (!relayEnvironment || !Array.isArray(favourites)) {
    return Promise.resolve([]);
  }
  const queries = [];
  const stopIds = favourites
    .filter(item => item.type === 'stop')
    .map(item => item.gtfsId);
  if (stopIds.length > 0) {
    queries.push(
      fetchQuery(relayEnvironment, favouriteStopsQuery, {
        ids: stopIds,
      }),
    );
  }
  const stationIds = favourites
    .filter(item => item.type === 'station')
    .map(item => item.gtfsId);
  if (stationIds.length > 0) {
    queries.push(
      fetchQuery(relayEnvironment, favouriteStationsQuery, {
        ids: stationIds,
      }),
    );
  }
  if (queries.length === 0) {
    return Promise.resolve([]);
  }
  return Promise.all(queries)
    .then(qres =>
      qres.map(stopOrStation => {
        return stopOrStation.stops
          ? stopOrStation.stops
          : stopOrStation.stations;
      }),
    )
    .then(flatten)
    .then(result => result.filter(res => res !== null))
    .then(stopsAndStations => {
      // eslint-disable-next-line func-names
      const stopStationMap = stopsAndStations.reduce(function (
        map,
        stopOrStation,
      ) {
        // eslint-disable-next-line no-param-reassign
        map[stopOrStation.gtfsId] = stopOrStation;
        return map;
      },
      {});
      return verify(stopStationMap, favourites).map(stop => {
        const favourite = {
          type: 'FavouriteStop',
          ...stop,
          properties: {
            label: stop.name,
            layer: isStop(stop) ? 'favouriteStop' : 'favouriteStation',
          },
          geometry: {
            coordinates: [stop.lon, stop.lat],
          },
        };
        return favourite;
      });
    });
};

export const getAllBikeRentalStations = () => {
  if (!relayEnvironment) {
    return Promise.resolve([]);
  }
  return fetchQuery(relayEnvironment, searchBikeRentalStationsQuery);
};
/**
 * Returns Stop and station objects filtered by given mode .
 * @param {*} stopsToFilter
 * @param {String} mode
 */
export const filterStopsAndStationsByMode = (stopsToFilter, mode) => {
  const ids = compact(stopsToFilter.map(s => s.gtfsId));
  const queries = [];
  queries.push(
    fetchQuery(relayEnvironment, stopsQuery, {
      ids,
    }),
  );
  queries.push(
    fetchQuery(relayEnvironment, stationsQuery, {
      ids,
    }),
  );

  return Promise.all(queries)
    .then(qres =>
      qres.map(stopOrStation => {
        return stopOrStation.stops
          ? stopOrStation.stops
          : stopOrStation.stations;
      }),
    )
    .then(flatten)
    .then(result => result.filter(res => res !== null))
    .then(data =>
      data.map(stop => {
        const oldStop = stopsToFilter.find(s => s.gtfsId === stop.gtfsId);
        const newStop = {
          ...oldStop,
          mode: stop.vehicleMode,
        };
        if (newStop.mode === mode) {
          return newStop;
        }
        return undefined;
      }),
    )
    .then(compact);
};
/**
 * Returns Favourite Route objects depending on input
 * @param {String} input Search text, if empty no objects are returned
 * @param {*} favourites
 */
export function getFavouriteRoutesQuery(favourites, input) {
  if (
    !relayEnvironment ||
    !Array.isArray(favourites) ||
    favourites.length === 0
  ) {
    return Promise.resolve([]);
  }
  return fetchQuery(relayEnvironment, favouriteRoutesQuery, { ids: favourites })
    .then(data => data.routes.map(mapRoute))
    .then(routes => routes.filter(route => !!route))
    .then(routes =>
      routes.map(favourite => ({
        ...favourite,
        properties: { ...favourite.properties, layer: 'favouriteRoute' },
        type: 'FavouriteRoute',
      })),
    )
    .then(routes =>
      filterMatchingToInput(routes, input, [
        'properties.shortName',
        'properties.longName',
      ]),
    )
    .then(routes =>
      routes.sort((x, y) => routeNameCompare(x.properties, y.properties)),
    );
}
/**
 * Returns Favourite BikeRentalStation objects depending on input
 * @param {String} input Search text, if empty no objects are returned
 * @param {*} favourites
 */
export function getFavouriteBikeRentalStationsQuery(favourites, input) {
  if (
    !relayEnvironment ||
    !Array.isArray(favourites) ||
    favourites.length === 0
  ) {
    return Promise.resolve([]);
  }
  const favouriteIds = favourites.map(station => station.stationId);
  return fetchQuery(relayEnvironment, favouriteBikeRentalQuery, {
    ids: favouriteIds,
  })
    .then(data => data.bikeRentalStations)
    .then(stations => stations.filter(station => !!station))
    .then(stations =>
      stations.map(favourite => ({
        properties: {
          name: favourite.name,
          labelId: favourite.stationId,
          layer: 'favouriteBikeRentalStation',
        },
        type: 'FavouriteBikeRentalStation',
      })),
    )
    .then(stations =>
      filterMatchingToInput(stations, input, ['properties.name']),
    )
    .then(stations => stations.sort());
}
/**
 * Returns Route objects depending on input
 * @param {String} input Search text, if empty no objects are returned
 * @param {*} feedIds
 * @param {String} transportMode Filter routes with a transport mode, e.g. route-BUS
 */
export function getRoutesQuery(input, feedIds, transportMode) {
  if (!relayEnvironment) {
    return Promise.resolve([]);
  }
  if (typeof input !== 'string' || input.trim().length === 0) {
    return Promise.resolve([]);
  }
  const number = input.match(/^\d+$/);
  if (number && number[0].length > 3) {
    return Promise.resolve([]);
  }
  let modes;
  if (transportMode) {
    [, modes] = transportMode.split('-');
  }
  return fetchQuery(relayEnvironment, searchRoutesQuery, {
    feeds: Array.isArray(feedIds) && feedIds.length > 0 ? feedIds : null,
    name: input,
    modes: transportMode ? modes : null,
  })
    .then(data =>
      data.viewer.routes
        .map(mapRoute)
        .filter(route => !!route)
        .sort((x, y) => routeNameCompare(x.properties, y.properties)),
    )
    .then(suggestions => take(suggestions, 100));
}

export const withCurrentTime = location => {
  const query = (location && location.query) || {};
  return {
    ...location,
    query: {
      ...query,
      time: query.time ? query.time : moment().unix(),
    },
  };
};
