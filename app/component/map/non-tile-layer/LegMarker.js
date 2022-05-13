import PropTypes from 'prop-types';
import React from 'react';
import { useMap, useMapEvent } from 'react-leaflet';
import Icon from '../../Icon';

import { isBrowser } from '../../../util/browser';

/* eslint-disable global-require */

const Marker = isBrowser && require('react-leaflet').Marker;
const L = isBrowser && require('leaflet');

/* eslint-enable global-require */

class LegMarker extends React.Component {
  static propTypes = {
    leg: PropTypes.object.isRequired,
    mode: PropTypes.string.isRequired,
    color: PropTypes.string,
    zIndexOffset: PropTypes.number,
    wide: PropTypes.bool,
  };

  static defaultProps = {
    color: 'currentColor',
    zIndexOffset: undefined,
  };

  componentDidMount() {
<<<<<<< HEAD
    const mapInstance = useMap();
    mapInstance.on('zoomend', this.onMapZoom); //CA TODO: wie geht zommen mit den neuen Paket
=======
    useMapEvent('zoomend', this.onMapZoom);
>>>>>>> 1dae6fb42c856a74975b0ef1aa3c5aa6bdbe43b0
    // this.props.leaflet.map.on('zoomend', this.onMapZoom);
  }

  componentWillUnmount = () => {
    // TODO still required? or implicitly deregistered on unmount
    // useMapEvent('zoomend', this.onMapZoom);
    // this.props.leaflet.map.off('zoomend', this.onMapZoom);
  };

  onMapZoom = () => {
    this.forceUpdate();
  };

  getLegMarker() {
    const color = this.props.color ? this.props.color : 'currentColor';
    const className = this.props.wide ? 'wide' : '';
    return (
      <Marker
        key={`${this.props.leg.name}_text`}
        position={{
          lat: this.props.leg.lat,
          lng: this.props.leg.lon,
        }}
        interactive={false}
        icon={L.divIcon({
          html: `
            <div class="${className}" style="background-color: ${color}">
            ${Icon.asString({
              img: `icon-icon_${this.props.mode}`,
              className: 'map-route-icon',
              color,
            })}
              <span class="map-route-number">${this.props.leg.name}</span>
            </div>`,
          className: `legmarker ${this.props.mode}`,
          iconSize: null,
        })}
        zIndexOffset={this.props.zIndexOffset}
        keyboard={false}
      />
    );
  }

  render() {
    if (!isBrowser) {
      return '';
    }
<<<<<<< HEAD
    //const test = this.props.useMap.latLngToLayerPoint();
    const p1 = this.props.useMap.latLngToLayerPoint(this.props.leg.from);
    console.log('Test: ' + this.props.leg.from);
    const p2 = this.props.useMap.latLngToLayerPoint(this.props.leg.to);
=======

    const p1 = useMap().latLngToLayerPoint(this.props.leg.from);
    const p2 = useMap().latLngToLayerPoint(this.props.leg.to);
>>>>>>> 1dae6fb42c856a74975b0ef1aa3c5aa6bdbe43b0
    const distance = p1.distanceTo(p2);
    const minDistanceToShow = 64;

    return <div>{distance >= minDistanceToShow && this.getLegMarker()}</div>;
  }
}

export default LegMarker;
