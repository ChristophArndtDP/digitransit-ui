import React from 'react';
import PropTypes from 'prop-types';
import { intlShape } from 'react-intl';
import getJson from '@digitransit-search-util/digitransit-search-util-get-json';
import suggestionToLocation from '@digitransit-search-util/digitransit-search-util-suggestion-to-location';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { addAnalyticsEvent } from '../util/analyticsUtils';
import {
  PREFIX_ITINERARY_SUMMARY,
  PREFIX_STOPS,
  PREFIX_ROUTES,
} from '../util/path';
import searchContext from '../util/searchContext';
import intializeSearchContext from '../util/DTSearchContextInitializer';
import SelectFromMapHeader from './SelectFromMapHeader';
import SelectFromMapPageMap from './map/SelectFromMapPageMap';
import DTModal from './DTModal';
import FromMapModal from './FromMapModal';

const PATH_OPTS = {
  stopsPrefix: PREFIX_STOPS,
  routesPrefix: PREFIX_ROUTES,
  itinerarySummaryPrefix: PREFIX_ITINERARY_SUMMARY,
};

export default function withSearchContext(WrappedComponent) {
  class ComponentWithSearchContext extends React.Component {
    static contextTypes = {
      config: PropTypes.object.isRequired,
      intl: intlShape.isRequired,
      executeAction: PropTypes.func.isRequired,
      getStore: PropTypes.func.isRequired,
    };

    static propTypes = {
      origin: PropTypes.object,
      destination: PropTypes.object,
      children: PropTypes.node,
      selectHandler: PropTypes.func.isRequired,
      locationState: PropTypes.object,
      fromMap: PropTypes.string,
      isMobile: PropTypes.bool,
    };

    constructor(props) {
      super(props);
      this.state = {
        // eslint-disable-next-line react/no-unused-state
        pendingCurrentLocation: false,
        isInitialized: false,
        positioningSelectedFrom: '',
        fromMap: this.props.fromMap,
      };
    }

    static getDerivedStateFromProps(nextProps, prevState) {
      if (prevState.isInitialized) {
        const locState = nextProps.locationState;
        if (
          (prevState.pendingCurrentLocation &&
            locState.status === 'found-address') ||
          locState.locationingFailed
        ) {
          return {
            pendingCurrentLocation: false,
            positioningSelectedFrom: null,
          };
        }
      }
      return null;
    }

    componentDidMount() {
      if (!this.state.isInitialized) {
        intializeSearchContext(this.context, searchContext);
        this.setState({ isInitialized: true });
      }
    }

    componentDidUpdate(prevProps, prevState) {
      if (
        prevState.pendingCurrentLocation !== this.state.pendingCurrentLocation
      ) {
        const locState = this.props.locationState;

        if (locState.status === 'found-address') {
          const location = {
            type: 'CurrentLocation',
            lat: locState.lat,
            lon: locState.lon,
            gid: locState.gid,
            name: locState.name,
            layer: locState.layer,
            address:
              locState.address ||
              this.context.intl.formatMessage({
                id: 'own-position',
                defaultMessage: 'Own Location',
              }),
          };
          this.onSuggestionSelected(
            location,
            prevState.positioningSelectedFrom,
          );
        }
      }
    }

    storeReference = ref => {
      this.setState(prevState => ({ refs: [...prevState.refs, ref] }));
    };

    saveOldSearch = (item, type, id) => {
      if (
        item.type !== 'FutureRoute' &&
        item.type !== 'CurrentLocation' &&
        item.type !== 'SelectFromMap' &&
        item.type.indexOf('Favourite') === -1 &&
        id.indexOf('favourite') === -1 &&
        (!item.properties ||
          !item.properties.layer ||
          item.properties.layer.indexOf('favourite') === -1)
      ) {
        this.context.executeAction(searchContext.saveSearch, {
          item,
          type,
        });
      }
    };

    onSuggestionSelected = (item, id) => {
      if (item.type === 'SelectFromMap') {
        this.setState({ fromMap: id });
      } else if (id !== 'stop-route-station' && item.type !== 'FutureRoute') {
        let location;
        if (item.type === 'CurrentLocation') {
          // item is already a location.
          location = item;
          if (
            item.properties &&
            item.properties.layer === 'currentPosition' &&
            !item.properties.lat
          ) {
            // eslint-disable-next-line react/no-unused-state
            this.setState(
              { pendingCurrentLocation: true, positioningSelectedFrom: id },
              this.context.executeAction(searchContext.startLocationWatch),
            );
          }
        } else {
          location = suggestionToLocation(item);
        }
        this.props.selectHandler(location, id);
      } else {
        this.props.selectHandler(item, id);
      }
    };

    // top level onSelect callback manages search history
    onSelect = (item, id) => {
      // type for storing old searches. 'endpoint' types are available in itinerary search
      let type = 'endpoint';
      switch (item.type) {
        case 'Route':
          type = 'search'; // can't be used as location
          break;
        default:
      }
      if (item.type === 'OldSearch' && item.properties.gid) {
        getJson(this.context.config.URL.PELIAS_PLACE, {
          ids: item.properties.gid,
        }).then(res => {
          const newItem = { ...item };
          if (res.features != null && res.features.length > 0) {
            // update only position. It is surprising if, say, the name changes at selection.
            const geom = res.features[0].geometry;
            newItem.geometry.coordinates = geom.coordinates;
          }
          this.saveOldSearch(newItem, type, id);
          this.onSuggestionSelected(item, id);
        });
      } else {
        this.saveOldSearch(item, type, id);
        this.onSuggestionSelected(item, id);
      }
    };

    confirmMapSelection = (type, mapLocation) => {
      this.setState({ fromMap: undefined });
      this.props.selectHandler(mapLocation, type);
    };

    renderSelectFromMapModal = id => {
      let titleId = 'select-from-map-no-title';

      if (id === 'origin') {
        titleId = 'select-from-map-origin';
      }

      if (id === 'destination') {
        titleId = 'select-from-map-destination';
      }

      if (!this.props.isMobile) {
        return (
          <FromMapModal
            onClose={() => this.setState({ fromMap: undefined })}
            titleId={titleId}
          >
            <SelectFromMapPageMap
              type={id}
              onConfirm={this.confirmMapSelection}
            />
          </FromMapModal>
        );
      }

      return (
        <DTModal show>
          <SelectFromMapHeader
            titleId={titleId}
            onBackBtnClick={() => this.setState({ fromMap: undefined })}
            hideCloseBtn
          />
          <SelectFromMapPageMap
            type={id}
            onConfirm={this.confirmMapSelection}
          />
        </DTModal>
      );
    };

    render() {
      const { fromMap } = this.state;

      if (fromMap) {
        return this.renderSelectFromMapModal(fromMap);
      }

      return (
        <WrappedComponent
          appElement="#app"
          searchContext={searchContext}
          addAnalyticsEvent={addAnalyticsEvent}
          onSelect={this.onSelect}
          {...this.props}
          pathOpts={PATH_OPTS}
        />
      );
    }
  }
  const componentWithPosition = connectToStores(
    ComponentWithSearchContext,
    ['PositionStore'],
    context => ({
      locationState: context.getStore('PositionStore').getLocationState(),
    }),
  );
  return componentWithPosition;
}
