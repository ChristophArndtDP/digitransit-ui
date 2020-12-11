import { VectorTile } from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import pick from 'lodash/pick';

import range from 'lodash-es/range';
import { isBrowser } from '../../../util/browser';
import { drawIcon } from '../../../util/mapIconUtils';
import glfun from '../../../util/glfun';

const getScale = glfun({
  base: 1,
  stops: [[13, 0.8], [20, 1.6]],
});

const IncidentType = {
  RoadClosed: 'ROAD_CLOSED',
};

const DirectionsType = {
  BothDirections: 'BOTH_DIRECTIONS',
};

class Roadworks {
  constructor(tile, config) {
    this.tile = tile;
    this.config = config;

    this.scaleratio = (isBrowser && window.devicePixelRatio) || 1;
    this.iconSize = 20 * this.scaleratio * getScale(this.tile.coords.z);

    this.promise = this.fetchWithAction(this.fetchAndDrawStatus);
  }

  fetchWithAction = actionFn =>
    fetch(
      `${this.config.URL.ROADWORKS_MAP}` +
        `${this.tile.coords.z + (this.tile.props.zoomOffset || 0)}/` +
        `${this.tile.coords.x}/${this.tile.coords.y}.pbf`,
    ).then(res => {
      if (res.status !== 200) {
        return undefined;
      }

      return res.arrayBuffer().then(
        buf => {
          const vt = new VectorTile(new Protobuf(buf));

          this.features = [];

          const layerData = vt.layers.cifs || { length: 0 };
          const { length } = layerData;

          this.features = range(length).map(index => {
            const feature = layerData.feature(index);
            [[feature.geom]] = feature.loadGeometry();
            return pick(feature, ['geom', 'properties']);
          });

          this.features.forEach(actionFn);
        },
        // eslint-disable-next-line no-console
        err => console.error(err),
      );
    });

  static getIconSuffix = properties => {
    let suffix = '';
    if (
      properties.type === IncidentType.RoadClosed &&
      properties['location.direction'] === DirectionsType.BothDirections
    ) {
      suffix = '-full-closure';
    } else if (properties.Halbseitige_Sperrung === 1) {
      suffix = '-oneway-closure';
    }
    return suffix;
  };

  fetchAndDrawStatus = ({ geom, properties }) => {
    const suffix = Roadworks.getIconSuffix(properties);
    return drawIcon(
      `icon-icon_roadworks${suffix}`,
      this.tile,
      geom,
      this.iconSize,
    );
  };

  onTimeChange = () => {
    if (this.tile.coords.z > this.config.roadworks.roadworksMinZoom) {
      this.fetchWithAction(this.fetchAndDrawStatus);
    }
  };

  static getName = () => 'roadworks';
}

export default Roadworks;
