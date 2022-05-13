import PropTypes from 'prop-types';
import React from 'react';
import { useMap } from 'react-leaflet';
import Icon from '../../Icon';

import { isBrowser } from '../../../util/browser';

/* eslint-disable global-require */

const Marker = isBrowser && require('react-leaflet/esm/Marker').default;
const L = isBrowser && require('leaflet');

/* eslint-enable global-require */

class LegMarker extends React.Component {
  static propTypes = {
    leg: PropTypes.object.isRequired,
    mode: PropTypes.string.isRequired,
    color: PropTypes.string,
    leaflet: PropTypes.shape({
      map: PropTypes.shape({
        latLngToLayerPoint: PropTypes.func.isRequired,
        on: PropTypes.func.isRequired,
        off: PropTypes.func.isRequired,
      }).isRequired,
    }).isRequired,
    zIndexOffset: PropTypes.number,
    wide: PropTypes.bool,
  };

  static defaultProps = {
    color: 'currentColor',
    zIndexOffset: undefined,
  };

  componentDidMount() {
    const mapInstance = useMap();
    mapInstance.on('zoomend', this.onMapZoom); //CA TODO: wie geht zommen mit den neuen Paket
    // this.props.leaflet.map.on('zoomend', this.onMapZoom);
  }

  componentWillUnmount = () => {
    const mapInstance = useMap();
    mapInstance.on('zoomend', this.onMapZoom);
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
    //const test = this.props.useMap.latLngToLayerPoint();
    const p1 = this.props.useMap.latLngToLayerPoint(this.props.leg.from);
    console.log('Test: ' + this.props.leg.from);
    const p2 = this.props.useMap.latLngToLayerPoint(this.props.leg.to);
    const distance = p1.distanceTo(p2);
    const minDistanceToShow = 64;

    return <div>{distance >= minDistanceToShow && this.getLegMarker()}</div>;
  }
}

export default LegMarker;
