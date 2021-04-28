import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import moment from 'moment';
import { isNumber } from 'lodash';
import ComponentUsageExample from './ComponentUsageExample';
import { lang as exampleLang } from './ExampleData';

const makeValue = number => {
  return {
    sensorValue: number,
    sensorUnit: '°C',
  };
};

/*
0  = kein Niederschlag
60 = Regen
67 = Eisregen
69 = Schneeregen
70 = Schnee
90 = Hagel
 */
const translatePrecipitation = num => {
  const prefix = 'precipitation';
  switch (num) {
    case 0:
      return `${prefix}-none`;
    case 60:
      return `${prefix}-rain`;
    case 67:
      return `${prefix}-icy-rain`;
    case 69:
      return `${prefix}-sleet`;
    case 70:
      return `${prefix}-snow`;
    case 90:
      return `${prefix}-hail`;
    default:
      return `${prefix}-unknown`;
  }
};

/*
10 = Trocken
15 = Feucht
20 = Nass
25 = Feucht mit Salz
30 = Nass mit Salz
35 = Eis
40 = Schnee
45 = Frost/Reif
*/
const translateRoadCondition = num => {
  const prefix = 'road-condition';
  switch (num) {
    case 10:
      return `${prefix}-dry`;
    case 15:
      return `${prefix}-moist`;
    case 20:
      return `${prefix}-wet`;
    case 25:
      return `${prefix}-moist-salty`;
    case 30:
      return `${prefix}-wet-salty`;
    case 35:
      return `${prefix}-icy`;
    case 40:
      return `${prefix}-snowy`;
    case 45:
      return `${prefix}-frosty`;
    default:
      return `${prefix}-unknown`;
  }
};

const WeatherStationContent = ({
  airTemperatureC,
  roadTemperatureC,
  precipitationType,
  roadCondition,
  updatedAt,
}) => {
  const airTemperatureSensor = makeValue(airTemperatureC);
  const roadTemperatureSensor = makeValue(roadTemperatureC);
  return (
    <table className="component-list">
      <tbody>
        {airTemperatureSensor && (
          <tr>
            <td>
              <FormattedMessage
                id="air-temperature"
                defaultMessage="Air temperature"
              >
                {(...content) => `${content}:`}
              </FormattedMessage>
            </td>
            <td>
              {`${Math.round(airTemperatureSensor.sensorValue)}
              ${airTemperatureSensor.sensorUnit}`}
            </td>
          </tr>
        )}
        {roadTemperatureSensor && (
          <tr>
            <td>
              <FormattedMessage
                id="road-temperature"
                defaultMessage="Road temperature"
              >
                {(...content) => `${content}:`}
              </FormattedMessage>
            </td>
            <td>
              {`${Math.round(roadTemperatureSensor.sensorValue)}
              ${roadTemperatureSensor.sensorUnit}`}
            </td>
          </tr>
        )}
        {isNumber(precipitationType) && (
          <tr>
            <td>
              <FormattedMessage
                id="precipitation"
                defaultMessage="Precipitation"
              >
                {(...content) => `${content}:`}
              </FormattedMessage>
            </td>
            <td>
              <FormattedMessage
                id={translatePrecipitation(precipitationType)}
                defaultMessage={translatePrecipitation(precipitationType)}
              />
            </td>
          </tr>
        )}
        {isNumber(roadCondition) && (
          <tr>
            <td>
              <FormattedMessage id="condition" defaultMessage="Condition">
                {(...content) => `${content}:`}
              </FormattedMessage>
            </td>
            <td>
              <FormattedMessage
                id={translateRoadCondition(roadCondition)}
                defaultMessage={translateRoadCondition(roadCondition)}
              />
            </td>
          </tr>
        )}
        {updatedAt && (
          <tr>
            <td colSpan={2} className="last-updated">
              <FormattedMessage
                id="last-updated"
                defaultMessage="Last updated"
                values={{ time: moment(updatedAt).format('LT') || '' }}
              />
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
};

WeatherStationContent.displayName = 'WeatherStationContent';

WeatherStationContent.description = (
  <div>
    <p>RendTimeers content of a roadwork popup or modal</p>
    <ComponentUsageExample description="">
      <WeatherStationContent comment={exampleLang} />
    </ComponentUsageExample>
  </div>
);

WeatherStationContent.propTypes = {
  airTemperatureC: PropTypes.number,
  precipitationType: PropTypes.number,
  roadCondition: PropTypes.number,
  roadTemperatureC: PropTypes.number,
  updatedAt: PropTypes.string,
};

export default WeatherStationContent;
