import PropTypes from 'prop-types';
import React from 'react';
import Icon from '../../Icon';
import { Marker } from 'react-leaflet';
import { useMap, useMapEvent } from 'react-leaflet';

import { isBrowser } from '../../../util/browser';

const position = [60.206961, 25.124262];

function TestLegCA() {
  const map = useMapEvent('click', () => {
    console.log('Karte geklickt');
  });
  return null;
}

export default TestLegCA;
