import PropTypes from 'prop-types';
import React from 'react';
import Relay from 'react-relay/classic';
import { FormattedMessage, intlShape } from 'react-intl';
import MarkerPopupBottom from '../MarkerPopupBottom';
import Card from '../../Card';
import CardHeader from '../../CardHeader';
import { station as exampleStation } from '../../ExampleData';
import ComponentUsageExample from '../../ComponentUsageExample';
import OSMOpeningHours from './OSMOpeningHours';
import DynamicParkingLots from '../tile-layer/DynamicParkingLots';

class DynamicParkingLotsPopup extends React.Component {
  static contextTypes = {
    getStore: PropTypes.func.isRequired,
    intl: intlShape.isRequired,
  };

  static description = (
    <div>
      <p>Renders a citybike popup.</p>
      <ComponentUsageExample description="">
        <DynamicParkingLotsPopup
          context="context object here"
          station={exampleStation}
        >
          Im content of a citybike card
        </DynamicParkingLotsPopup>
      </ComponentUsageExample>
    </div>
  );

  static displayName = 'ParkingLotPopup';

  static propTypes = {
    feature: PropTypes.object.isRequired,
    lat: PropTypes.number.isRequired,
    lon: PropTypes.number.isRequired,
  };

  getCapacity() {
    return (
      <div className="capacity">
        {this.getCarCapacity()}
        {this.getClosed()}
        <br />
        {this.getWheelchairCapacity()}
      </div>
    );
  }

  getCarCapacity() {
    const { intl } = this.context;
    const props = this.props.feature.properties;

    if (props && typeof props.free === 'number') {
      return intl.formatMessage(
        {
          id: 'parking-spaces-available',
          defaultMessage: '{free} of {total} parking spaces available',
        },
        props,
      );
    }

    if (props && typeof props.total === 'number') {
      return intl.formatMessage(
        {
          id: 'parking-spaces-in-total',
          defaultMessage: 'Capacity: {total} parking spaces',
        },
        props,
      );
    }
    return null;
  }

  getClosed() {
    const { properties } = this.props.feature;
    if (properties.state === 'closed') {
      return (
        <span>
          {' '}
          (<FormattedMessage id="closed" defaultMessage="closed" />)
        </span>
      );
    }
    return null;
  }

  getWheelchairCapacity() {
    const { properties } = this.props.feature;
    return properties['free:disabled'] !== undefined &&
      properties['total:disabled'] !== undefined
      ? this.context.intl.formatMessage(
          {
            id: 'disabled-parking-spaces-available',
            defaultMessage:
              '{free:disabled} of {total:disabled} wheelchair-accessible parking spaces available',
          },
          properties,
        )
      : null;
  }

  getUrl() {
    const { intl } = this.context;
    if (this.props.feature.properties && this.props.feature.properties.url) {
      return (
        <div className="padding-vertical-small">
          <a
            href={this.props.feature.properties.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {intl.formatMessage({
              id: 'extra-info',
              defaultMessage: 'More information',
            })}
          </a>
        </div>
      );
    }
    return null;
  }

  getNotes() {
    const currentLanguage = this.context.intl.locale;
    const { properties } = this.props.feature;
    if (properties.notes) {
      const notes = JSON.parse(properties.notes);
      return (
        <div className="large-text padding-vertical-small">
          {notes[currentLanguage] || null}
        </div>
      );
    }
    return null;
  }

  renderOpeningHours() {
    const {
      feature: { properties },
    } = this.props;
    const openingHours = properties.opening_hours;
    if (openingHours) {
      return <OSMOpeningHours openingHours={openingHours} displayStatus />;
    }
    return null;
  }

  render() {
    return (
      <Card>
        <div className="padding-normal">
          <CardHeader
            name={this.props.feature.properties.name}
            descClass="padding-vertical-small"
            unlinked
            className="padding-medium"
            icon={`icon-icon_${DynamicParkingLots.getIcon(
              this.props.feature.properties.lot_type,
            )}`}
            headingStyle="h2"
          />
          <div>
            {this.getCapacity()}
            {this.renderOpeningHours()}
            {this.getNotes()}
            {this.getUrl()}
          </div>
        </div>
        <MarkerPopupBottom
          location={{
            address: this.props.feature.properties.name,
            lat: this.props.lat,
            lon: this.props.lon,
          }}
        />
      </Card>
    );
  }
}

export default Relay.createContainer(DynamicParkingLotsPopup, {
  fragments: {},
});
