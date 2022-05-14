import PropTypes from 'prop-types';
import React from 'react';

import { isBrowser } from '../../../util/browser';

const Popup = isBrowser ? require('react-leaflet').Popup : null; // eslint-disable-line global-require

export default function SelectedStopPopup({ lat, lon, children }, { config }) {
  return (
    <Popup
      position={{ lat: lat + 0.0001, lng: lon }}
      offset={[50, 15]}
      maxWidth={config.map.genericMarker.popup.maxWidth}
      autoPan={false}
      className="origin-popup"
    >
      {children}
    </Popup>
  );
}

SelectedStopPopup.propTypes = {
  lat: PropTypes.number.isRequired,
  lon: PropTypes.number.isRequired,
  children: PropTypes.node.isRequired,
};

SelectedStopPopup.contextTypes = {
  config: PropTypes.object.isRequired,
};

SelectedStopPopup.displayName = 'SelectedStopLabel';
