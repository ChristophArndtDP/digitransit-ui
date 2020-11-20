import PropTypes from 'prop-types';
import React from 'react';
import moment from 'moment';
import { FormattedMessage, intlShape } from 'react-intl';
import cx from 'classnames';
import Link from 'found/Link';
import Icon from './Icon';
import ComponentUsageExample from './ComponentUsageExample';
import { PREFIX_STOPS } from '../util/path';
import { addAnalyticsEvent } from '../util/analyticsUtils';
import { displayDistance } from '../util/geo-utils';
import { durationToString } from '../util/timeUtils';
import ItineraryCircleLine from './ItineraryCircleLine';
import {
  getCityBikeNetworkConfig,
  getCityBikeNetworkId,
  CityBikeNetworkType,
} from '../util/citybikes';
import { isKeyboardSelectionEvent } from '../util/browser';
import ItineraryCircleLineWithIcon from './ItineraryCircleLineWithIcon';
import StopCode from './StopCode';
import PlatformNumber from './PlatformNumber';
import { getServiceAlertDescription } from '../util/alertUtils';
import { AlertSeverityLevelType } from '../constants';
import ServiceAlertIcon from './ServiceAlertIcon';

function showStopCode(stopCode) {
  return stopCode && <StopCode code={stopCode} />;
}

function renderLink(leg, legDescription) {
  if (leg && leg.from && leg.from.stop) {
    return (
      <div>
        <Link
          onClick={e => {
            e.stopPropagation();
            addAnalyticsEvent({
              category: 'Itinerary',
              action: 'OpenRouteFromItinerary',
              name: leg.from.stop.vehicleMode,
            });
          }}
          to={`/${PREFIX_STOPS}/${leg.from.stop.gtfsId}`}
        >
          {legDescription}
          <Icon
            img="icon-icon_arrow-collapse--right"
            className="itinerary-arrow-icon"
            color="#333"
          />
        </Link>
        <div className="stop-code-container">
          {showStopCode(leg.from.stop && leg.from.stop.code)}
          <PlatformNumber
            number={leg.from.stop.platformCode}
            short
            isRailOrSubway={
              leg.from.stop.vehicleMode.toLowerCase() === 'rail' ||
              leg.from.stop.vehicleMode.toLowerCase() === 'subway'
            }
          />
        </div>
      </div>
    );
  }
  return legDescription;
}
function BicycleLeg(
  { focusAction, index, leg, setMapZoomToLeg },
  { config, intl },
) {
  let stopsDescription;
  const distance = displayDistance(parseInt(leg.distance, 10), config);
  const duration = durationToString(leg.endTime - leg.startTime);
  let { mode } = leg;
  let legDescription = <span>{leg.from ? leg.from.name : ''}</span>;
  const firstLegClassName = index === 0 ? 'start' : '';
  let modeClassName = 'bicycle';
  const [address, place] = leg.from.name.split(/, (.+)/); // Splits the name-string to two parts from the first occurance of ', '
  const networkConfig =
    leg.rentedBike &&
    leg.from.bikeRentalStation &&
    getCityBikeNetworkConfig(
      getCityBikeNetworkId(leg.from.bikeRentalStation.networks),
      config,
    );
  const isFirstLeg = i => i === 0;
  const isScooter =
    networkConfig && networkConfig.type === CityBikeNetworkType.Scooter;
  let freeFloatAlert = null;

  if (leg.mode === 'WALK' || leg.mode === 'BICYCLE_WALK') {
    modeClassName = leg.mode.toLowerCase();
    stopsDescription = (
      <FormattedMessage
        id={
          isScooter
            ? 'scooterwalk-distance-duration'
            : 'cyclewalk-distance-duration'
        }
        values={{ distance, duration }}
        defaultMessage="Walk your bike {distance} ({duration})"
      />
    );
  } else {
    stopsDescription = (
      <FormattedMessage
        id={isScooter ? 'scooter-distance-duration' : 'cycle-distance-duration'}
        values={{ distance, duration }}
        defaultMessage="Cycle {distance} ({duration})"
      />
    );
  }

  if (leg.rentedBike === true) {
    const alerts = leg.alerts || [];
    [freeFloatAlert] = alerts.filter(
      a => a.alertId === 'bike_rental_free_floating_drop_off',
    );
    modeClassName = 'citybike';
    legDescription = (
      <FormattedMessage
        id={isScooter ? 'rent-scooter-at' : 'rent-cycle-at'}
        values={{ station: leg.from ? leg.from.name : '' }}
        defaultMessage="Rent a bike at {station} station"
      />
    );

    if (leg.mode === 'BICYCLE') {
      mode = 'CITYBIKE';
    }

    if (leg.mode === 'WALK') {
      mode = 'CITYBIKE_WALK';
    }
  }
  return (
    <div key={index} className="row itinerary-row">
      <span className="sr-only">
        {leg.rentedBike === true && legDescription}
        {(leg.mode === 'WALK' || leg.mode === 'BICYCLE_WALK') &&
          stopsDescription}
        <FormattedMessage
          id="itinerary-details.biking-leg"
          values={{
            time: moment(leg.startTime).format('HH:mm'),
            distance,
            origin: leg.from ? leg.from.name : '',
            destination: leg.to ? leg.to.name : '',
            duration,
          }}
        />
      </span>
      <div className="small-2 columns itinerary-time-column" aria-hidden="true">
        <div className="itinerary-time-column-time">
          {moment(leg.startTime).format('HH:mm')}
        </div>
      </div>
      {mode === 'BICYCLE' ? (
        <ItineraryCircleLineWithIcon
          index={index}
          modeClassName={modeClassName}
        />
      ) : (
        <ItineraryCircleLine index={index} modeClassName={modeClassName} />
      )}

      <div
        className={`small-9 columns itinerary-instruction-column ${firstLegClassName} ${mode.toLowerCase()}`}
      >
        <span className="sr-only">
          <FormattedMessage
            id="itinerary-summary.show-on-map"
            values={{ target: leg.from.name || '' }}
          />
          {!!freeFloatAlert && (
            <FormattedMessage id="itinerary-details.route-has-info-alert" />
          )}
        </span>
        {isFirstLeg(index) ? (
          <div
            className={cx('itinerary-leg-first-row', 'bicycle', 'first')}
            aria-hidden="true"
          >
            <div className="address-container">
              <div className="address">
                {address}
                {leg.from.stop && (
                  <Icon
                    img="icon-icon_arrow-collapse--right"
                    className="itinerary-arrow-icon"
                    color="#333"
                  />
                )}
              </div>
              <div className="place">{place}</div>
            </div>
            <div
              className="itinerary-map-action"
              onClick={focusAction}
              onKeyPress={e => isKeyboardSelectionEvent(e) && focusAction(e)}
              role="button"
              tabIndex="0"
            >
              <Icon
                img="icon-icon_show-on-map"
                className="itinerary-search-icon"
              />
            </div>
          </div>
        ) : (
          <div
            className={cx('itinerary-leg-first-row', { first: index === 0 })}
            aria-hidden="true"
          >
            {renderLink(leg, legDescription)}
            <div
              className="itinerary-map-action"
              onClick={focusAction}
              onKeyPress={e => isKeyboardSelectionEvent(e) && focusAction(e)}
              role="button"
              tabIndex="0"
            >
              <Icon
                img="icon-icon_show-on-map"
                className="itinerary-search-icon"
              />
            </div>
          </div>
        )}
        {freeFloatAlert && (
          <div className={`itinerary-alert-info ${mode.toLowerCase()}`}>
            <ServiceAlertIcon
              className="inline-icon"
              severityLevel={AlertSeverityLevelType.Info}
            />
            {getServiceAlertDescription(freeFloatAlert, intl.locale)}
          </div>
        )}
        <div className="itinerary-leg-action" aria-hidden="true">
          <div className="itinerary-leg-action-content">
            {stopsDescription}
            <div
              className="itinerary-map-action"
              onClick={setMapZoomToLeg}
              onKeyPress={e =>
                isKeyboardSelectionEvent(e) && setMapZoomToLeg(e)
              }
              role="button"
              tabIndex="0"
            >
              <Icon
                img="icon-icon_show-on-map"
                className="itinerary-search-icon"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const exampleLeg = t1 => ({
  duration: 120,
  startTime: t1 + 20000,
  endTime: t1 + 20000 + 120 * 1000,
  distance: 586.4621425755712,
  from: { name: 'Ilmattarentie' },
  to: { name: 'Kuusitie' },
  mode: 'BICYCLE',
  rentedBike: false,
});

const exampleLegWalkingBike = t1 => ({
  duration: 120,
  startTime: t1 + 20000,
  endTime: t1 + 20000 + 120 * 1000,
  distance: 586.4621425755712,
  from: { name: 'Ilmattarentie' },
  to: { name: 'Kuusitie' },
  mode: 'BICYCLE_WALK',
  rentedBike: false,
});

const exampleLegCitybike = t1 => ({
  duration: 120,
  startTime: t1 + 20000,
  endTime: t1 + 20000 + 120 * 1000,
  distance: 586.4621425755712,
  from: { name: 'Ilmattarentie' },
  to: { name: 'Kuusitie' },
  mode: 'BICYCLE',
  rentedBike: true,
});

const exampleLegCitybikeWalkingBike = t1 => ({
  duration: 120,
  startTime: t1 + 20000,
  endTime: t1 + 20000 + 120 * 1000,
  distance: 586.4621425755712,
  from: { name: 'Ilmattarentie' },
  to: { name: 'Kuusitie' },
  mode: 'WALK',
  rentedBike: true,
});

const exampleLegScooter = t1 => ({
  duration: 120,
  startTime: t1 + 20000,
  endTime: t1 + 20000 + 120 * 1000,
  distance: 586.4621425755712,
  from: {
    name: 'Ilmattarentie',
    bikeRentalStation: { bikesAvailable: 5, networks: ['samocat'] },
  },
  to: { name: 'Kuusitie' },
  mode: 'BICYCLE',
  rentedBike: true,
});

const exampleLegScooterWalkingScooter = t1 => ({
  duration: 120,
  startTime: t1 + 20000,
  endTime: t1 + 20000 + 120 * 1000,
  distance: 586.4621425755712,
  from: {
    name: 'Ilmattarentie',
    bikeRentalStation: { bikesAvailable: 5, networks: ['samocat'] },
  },
  to: { name: 'Kuusitie' },
  mode: 'WALK',
  rentedBike: true,
});

BicycleLeg.description = () => {
  const today = moment().hour(12).minute(34).second(0).valueOf();
  return (
    <div>
      <p>Displays an itinerary bicycle leg.</p>
      <ComponentUsageExample description="bicycle-leg-normal">
        <BicycleLeg leg={exampleLeg(today)} index={0} focusAction={() => {}} />
      </ComponentUsageExample>
      <ComponentUsageExample description="bicycle-leg-walking-bike">
        <BicycleLeg
          leg={exampleLegWalkingBike(today)}
          index={0}
          focusAction={() => {}}
        />
      </ComponentUsageExample>
      <ComponentUsageExample description="bicycle-leg-citybike">
        <BicycleLeg
          leg={exampleLegCitybike(today)}
          index={0}
          focusAction={() => {}}
        />
      </ComponentUsageExample>
      <ComponentUsageExample description="bicycle-leg-citybike-walking-bike">
        <BicycleLeg
          leg={exampleLegCitybikeWalkingBike(today)}
          index={1}
          focusAction={() => {}}
        />
      </ComponentUsageExample>
      <ComponentUsageExample description="bicycle-leg-scooter">
        <BicycleLeg
          leg={exampleLegScooter(today)}
          index={0}
          focusAction={() => {}}
        />
      </ComponentUsageExample>
      <ComponentUsageExample description="bicycle-leg-scooter-walking-scooter">
        <BicycleLeg
          leg={exampleLegScooterWalkingScooter(today)}
          index={1}
          focusAction={() => {}}
        />
      </ComponentUsageExample>
    </div>
  );
};

BicycleLeg.propTypes = {
  leg: PropTypes.shape({
    endTime: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    startTime: PropTypes.number.isRequired,
    distance: PropTypes.number.isRequired,
    from: PropTypes.shape({
      name: PropTypes.string.isRequired,
      bikeRentalStation: PropTypes.shape({
        bikesAvailable: PropTypes.number.isRequired,
        networks: PropTypes.array.isRequired,
      }),
      stop: PropTypes.object,
    }).isRequired,
    to: PropTypes.shape({
      name: PropTypes.string.isRequired,
    }).isRequired,
    mode: PropTypes.string.isRequired,
    rentedBike: PropTypes.bool.isRequired,
    alerts: PropTypes.array,
  }).isRequired,
  index: PropTypes.number.isRequired,
  focusAction: PropTypes.func.isRequired,
  setMapZoomToLeg: PropTypes.func.isRequired,
};

BicycleLeg.contextTypes = {
  config: PropTypes.object.isRequired,
  intl: intlShape.isRequired,
};

export default BicycleLeg;
