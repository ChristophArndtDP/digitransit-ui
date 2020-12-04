import PropTypes from 'prop-types';
import React from 'react';
import Relay from 'react-relay/classic';
import { intlShape } from 'react-intl';
import MarkerPopupBottom from '../MarkerPopupBottom';
import Card from '../../Card';
import CardHeader from '../../CardHeader';
import { station as exampleStation } from '../../ExampleData';
import ComponentUsageExample from '../../ComponentUsageExample';
import OSMOpeningHours from './OSMOpeningHours';

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
      <span className="inline-block padding-vertical-small">
        {this.getCarCapacity()}
        <br />
        {this.getWheelchairCapacity()}
      </span>
    );
  }

  getCarCapacity() {
    const { intl } = this.context;
    if (
      this.props.feature.properties &&
      typeof this.props.feature.properties.free === 'number'
    ) {
      return intl.formatMessage(
        {
          id: 'parking-spaces-available',
          defaultMessage: '{free} of {total} parking spaces available',
        },
        this.props.feature.properties,
      );
    }
    return intl.formatMessage(
      {
        id: 'parking-spaces-in-total',
        defaultMessage: 'Capacity: {total} parking spaces',
      },
      this.props.feature.properties,
    );
  }

  getWheelchairCapacity() {
    return this.context.intl.formatMessage(
      {
        id: 'wheelchair-parking-spaces-available',
        defaultMessage:
          '{free:wheelchair} of {total:wheelchair} wheelchair-accessible parking spaces available',
      },
      this.props.feature.properties,
    );
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
    const { properties } = this.feature;
    if (properties.notes) {
      return (
        <div className="large-text padding-vertical-small">
          {properties.notes[currentLanguage] || null}
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
            description={this.getCapacity()}
            descClass="padding-vertical-small"
            unlinked
            className="padding-medium"
            headingStyle="h2"
          />
          <div>
            {this.renderOpeningHours()}
            {this.getUrl()}
            {this.getNotes()}
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
