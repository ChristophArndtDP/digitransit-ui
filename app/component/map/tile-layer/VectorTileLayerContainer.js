import PropTypes from 'prop-types';
import React from 'react';

import TileLayerContainer from './TileLayerContainer';
import CityBikes from './CityBikes';
import DynamicParkingLots from './DynamicParkingLots';
import Covid19OpeningHours from './Covid19OpeningHours';
import Roadworks from './Roadworks';
import Stops from './Stops';
import ParkAndRide from './ParkAndRide';
import TicketSales from './TicketSales';

export default function VectorTileLayerContainer(props, { config }) {
  const layers = [];

  if (props.showStops) {
    layers.push(Stops);

    if (config.cityBike && config.cityBike.showCityBikes) {
      layers.push(CityBikes);
    }

    if (config.parkAndRide && config.parkAndRide.showParkAndRide) {
      layers.push(ParkAndRide);
    }

    if (config.ticketSales && config.ticketSales.showTicketSales) {
      layers.push(TicketSales);
    }

    if (
      config.dynamicParkingLots &&
      config.dynamicParkingLots.showDynamicParkingLots
    ) {
      layers.push(DynamicParkingLots);
    }

    if (config.roadworks && config.roadworks.showRoadworks) {
      layers.push(Roadworks);
    }
  }

  layers.push(Covid19OpeningHours);

  return (
    <TileLayerContainer
      key="tileLayer"
      layers={layers}
      hilightedStops={props.hilightedStops}
      tileSize={config.map.tileSize || 256}
      zoomOffset={config.map.zoomOffset || 0}
      disableMapTracking={props.disableMapTracking}
    />
  );
}

VectorTileLayerContainer.propTypes = {
  hilightedStops: PropTypes.arrayOf(PropTypes.string.isRequired).isRequired,
  disableMapTracking: PropTypes.func.isRequired,
  showStops: PropTypes.bool.isRequired,
};

VectorTileLayerContainer.contextTypes = {
  config: PropTypes.object.isRequired,
};
