import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage, intlShape } from 'react-intl';
import { graphql, ReactRelayContext, QueryRenderer } from 'react-relay';
import { matchShape, routerShape } from 'found';
import connectToStores from 'fluxible-addons-react/connectToStores';
import Modal from '@hsl-fi/modal';
import DTAutoSuggest from '@digitransit-component/digitransit-component-autosuggest';
import DTIcon from '@digitransit-component/digitransit-component-icon';
import distance from '@digitransit-search-util/digitransit-search-util-distance';
import Icon from './Icon';
import DesktopView from './DesktopView';
import MobileView from './MobileView';
import withBreakpoint, { DesktopOrMobile } from '../util/withBreakpoint';
import { otpToLocation } from '../util/otpStrings';
import Loading from './Loading';
import {
  checkPositioningPermission,
  startLocationWatch,
  showGeolocationDeniedMessage,
} from '../action/PositionActions';
import DisruptionBanner from './DisruptionBanner';
import StopsNearYouSearch from './StopsNearYouSearch';
import {
  getSavedGeolocationPermission,
  setSavedGeolocationPermission,
} from '../store/localStorage';
import withSearchContext from './WithSearchContext';
import { PREFIX_NEARYOU } from '../util/path';

const DTAutoSuggestWithSearchContext = withSearchContext(DTAutoSuggest);

class StopsNearYouPage extends React.Component { // eslint-disable-line
  static contextTypes = {
    config: PropTypes.object.isRequired,
    executeAction: PropTypes.func.isRequired,
    headers: PropTypes.object.isRequired,
    getStore: PropTypes.func,
    intl: intlShape.isRequired,
  };

  static propTypes = {
    breakpoint: PropTypes.string.isRequired,
    loadingPosition: PropTypes.bool,
    content: PropTypes.node,
    map: PropTypes.node,
    relayEnvironment: PropTypes.object,
    position: PropTypes.shape({
      lat: PropTypes.number,
      lon: PropTypes.number,
      status: PropTypes.string,
      hasLocation: PropTypes.bool,
      address: PropTypes.string,
    }),
    lang: PropTypes.string.isRequired,
    isModalNeeded: PropTypes.bool,
    queryString: PropTypes.string,
    router: routerShape.isRequired,
    match: matchShape.isRequired,
  };

  constructor(props) {
    super(props);

    this.state = {
      startPosition: null,
      updatedLocation: null,
      geolocationPermission: {
        loading: true,
        state: undefined,
        closingModal: false,
      },
    };

    this.checkGeolocation();
  }

  checkGeolocation = async () => {
    try {
      this.setState({
        geolocationPermission: {
          loading: true,
          state: 'unknown',
        },
      });
      const result = await checkPositioningPermission();
      setSavedGeolocationPermission('state', result.state);
      this.setState({
        geolocationPermission: {
          loading: false,
          state: result.state,
        },
      });
    } catch (e) {
      this.setState({
        geolocationPermission: {
          loading: false,
          state: 'error',
        },
      });
    }
  };

  static getDerivedStateFromProps = (nextProps, prevState) => {
    if (
      !prevState.startPosition &&
      nextProps.position &&
      nextProps.position.lat &&
      nextProps.position.lon
    ) {
      return {
        startPosition: nextProps.position,
        updatedLocation: nextProps.position,
      };
    }
    if (
      !prevState.startPosition ||
      (!prevState.startPosition.address &&
        nextProps.position &&
        nextProps.position.address)
    ) {
      return {
        startPosition: nextProps.position,
        updatedLocation: nextProps.position,
      };
    }
    return null;
  };

  getQueryVariables = () => {
    const { startPosition } = this.state;
    const { mode } = this.props.match.params;
    let placeTypes = 'STOP';
    let modes = [mode];
    if (mode === 'CITYBIKE') {
      placeTypes = 'BICYCLE_RENT';
      modes = ['BICYCLE'];
    }
    const lat =
      startPosition && startPosition.lat
        ? startPosition.lat
        : this.context.config.defaultEndpoint.lat;
    const lon =
      startPosition && startPosition.lon
        ? startPosition.lon
        : this.context.config.defaultEndpoint.lon;
    return {
      lat,
      lon,
      maxResults: this.context.config.maxNearbyStopAmount,
      first: this.context.config.maxNearbyStopAmount,
      maxDistance: this.context.config.maxNearbyStopDistance,
      filterByModes: modes,
      filterByPlaceTypes: placeTypes,
      omitNonPickups: this.context.config.omitNonPickups,
    };
  };

  positionChanged = () => {
    const { updatedLocation } = this.state;

    if (
      updatedLocation &&
      updatedLocation.lat &&
      this.props.position &&
      this.props.position.lat
    ) {
      if (distance(updatedLocation, this.props.position) > 100) {
        return true;
      }
    }
    return false;
  };

  updateLocation = () => {
    this.setState({
      updatedLocation: this.props.position,
    });
  };

  renderContent = () => {
    const { mode } = this.props.match.params;
    const renderDisruptionBanner = mode !== 'CITYBIKE';
    const renderSearch = mode !== 'FERRY';
    const renderRefetchButton = this.positionChanged();
    return (
      <QueryRenderer
        query={graphql`
          query StopsNearYouPageContentQuery(
            $lat: Float!
            $lon: Float!
            $filterByPlaceTypes: [FilterPlaceType]
            $filterByModes: [Mode]
            $first: Int!
            $maxResults: Int!
            $maxDistance: Int!
            $omitNonPickups: Boolean
          ) {
            stopPatterns: viewer {
              ...StopsNearYouContainer_stopPatterns
              @arguments(
                lat: $lat
                lon: $lon
                filterByPlaceTypes: $filterByPlaceTypes
                filterByModes: $filterByModes
                first: $first
                maxResults: $maxResults
                maxDistance: $maxDistance
                omitNonPickups: $omitNonPickups
              )
            }
            alerts: alerts(severityLevel: [SEVERE]) {
              ...DisruptionBanner_alerts
            }
          }
        `}
        variables={this.getQueryVariables()}
        environment={this.props.relayEnvironment}
        render={({ props }) => {
          if (props) {
            return (
              <div className="stops-near-you-page">
                {renderDisruptionBanner && (
                  <DisruptionBanner
                    alerts={props.alerts || []}
                    mode={mode}
                    trafficNowLink={this.context.config.trafficNowLink}
                  />
                )}
                {renderSearch && (
                  <StopsNearYouSearch
                    mode={mode}
                    breakpoint={this.props.breakpoint}
                  />
                )}
                {renderRefetchButton && (
                  <div className="nearest-stops-update-container">
                    <FormattedMessage id="nearest-stops-updated-location" />
                    <button
                      aria-label={this.context.intl.formatMessage({
                        id: 'show-more-stops-near-you',
                        defaultMessage: 'Load more nearby stops',
                      })}
                      className="update-stops-button"
                      onClick={this.updateLocation}
                    >
                      <Icon img="icon-icon_update" />
                      <FormattedMessage
                        id="nearest-stops-update-location"
                        defaultMessage="Update stops"
                        values={{
                          mode: (
                            <FormattedMessage
                              id={`nearest-stops-${mode.toLowerCase()}`}
                            />
                          ),
                        }}
                      />
                    </button>
                  </div>
                )}
                {this.props.content &&
                  React.cloneElement(this.props.content, {
                    stopPatterns: props.stopPatterns,
                    // eslint-disable-next-line no-nested-ternary
                    position: this.state.updatedLocation
                      ? this.state.updatedLocation
                      : this.state.startPosition
                      ? this.state.startPosition
                      : this.context.config.defaultEndpoint,
                  })}
              </div>
            );
          }
          return undefined;
        }}
      />
    );
  };

  renderMap = () => {
    return (
      <QueryRenderer
        query={graphql`
          query StopsNearYouPageStopsQuery(
            $lat: Float!
            $lon: Float!
            $filterByPlaceTypes: [FilterPlaceType]
            $filterByModes: [Mode]
            $first: Int!
            $maxResults: Int!
            $maxDistance: Int!
            $omitNonPickups: Boolean
          ) {
            stops: viewer {
              ...StopsNearYouMap_stops
              @arguments(
                lat: $lat
                lon: $lon
                filterByPlaceTypes: $filterByPlaceTypes
                filterByModes: $filterByModes
                first: $first
                maxResults: $maxResults
                maxDistance: $maxDistance
                omitNonPickups: $omitNonPickups
              )
            }
          }
        `}
        variables={this.getQueryVariables()}
        environment={this.props.relayEnvironment}
        render={({ props }) => {
          if (props) {
            return (
              this.props.map &&
              React.cloneElement(this.props.map, {
                // eslint-disable-next-line no-nested-ternary
                position: this.state.updatedLocation
                  ? this.state.updatedLocation
                  : this.state.startPosition
                  ? this.state.startPosition
                  : this.context.config.defaultEndpoint,
                stops: props.stops,
              })
            );
          }
          return undefined;
        }}
      />
    );
  };

  createBckBtnUrl = () => {
    const { position } = this.props;
    const { place } = this.props.match.params;
    const { search } = this.props.match.location || '';
    if (place === 'POS' && !position) {
      const location = this.context.config.defaultEndpoint;
      return `/${encodeURIComponent(
        `${location.address}::${location.lat},${location.lon}`,
      )}/-${search}`;
    }
    if (place === 'POS' && position && position.hasLocation) {
      return `/${encodeURIComponent(
        `${position.address}::${position.lat},${position.lon}`,
      )}/-${search}`;
    }
    return `/${place}/-${search}`;
  };

  handleClose = () => {
    setSavedGeolocationPermission('choice', 'rejected');
    const { geolocationPermission } = this.state;
    this.setState({
      geolocationPermission: {
        ...geolocationPermission,
        loading: false,
        closingModal: true,
      },
    });
  };

  handleGrantGeolocation = () => {
    setSavedGeolocationPermission('choice', 'granted');
    this.context.executeAction(startLocationWatch);
    const { geolocationPermission } = this.state;
    this.setState({
      geolocationPermission: {
        ...geolocationPermission,
        loading: false,
        closingModal: true,
      },
    });
  };

  renderAutoSuggestField = () => {
    const isMobile = this.props.breakpoint !== 'large';
    return (
      <DTAutoSuggestWithSearchContext
        appElement="#app"
        icon="search"
        sources={['History', 'Datasource', isMobile ? 'Favourite' : '']}
        targets={['Locations', !isMobile ? 'SelectFromOwnLocations' : '']}
        id="origin-stop-near-you"
        placeholder="origin"
        value=""
        lang={this.props.lang}
        mode={this.props.match.params.mode}
        isMobile={isMobile}
      />
    );
  };

  renderDialogModal = savedChoice => {
    return (
      <Modal
        appElement="#app"
        contentLabel="content label"
        closeButtonLabel={this.context.intl.formatMessage({
          id: 'close',
        })}
        variant="small"
        isOpen
        onCrossClick={this.handleClose}
      >
        <div className="modal-desktop-container">
          <div className="modal-desktop-top">
            <div className="modal-desktop-header">
              <FormattedMessage id="stop-near-you-modal-header" />
            </div>
          </div>
          <div className="modal-desktop-text">
            <FormattedMessage id="stop-near-you-modal-info" />
          </div>
          <div className="modal-desktop-text title">
            <FormattedMessage id="origin" />
          </div>
          <div className="modal-desktop-main">
            <div className="modal-desktop-location-search">
              {this.renderAutoSuggestField()}
            </div>
          </div>
          <div className="modal-desktop-text title2">
            <FormattedMessage id="stop-near-you-modal-grant-permission" />
          </div>
          {savedChoice !== 'denied' && (
            <div className="modal-desktop-buttons">
              <button
                type="submit"
                className="modal-desktop-button save"
                onClick={() => this.handleGrantGeolocation()}
              >
                <DTIcon img="locate" height={1.375} width={1.375} />
                <FormattedMessage id="use-own-position" />
              </button>
            </div>
          )}
          {savedChoice === 'denied' && (
            <div className="modal-desktop-text info">
              <FormattedMessage id="stop-near-you-modal-grant-permission-info" />
            </div>
          )}
        </div>
      </Modal>
    );
  };

  render() {
    let showModal = true;
    let proceed = false;
    let savedChoice;
    const { loadingPosition, position, isModalNeeded } = this.props;
    const { params } = this.props.match;
    const queryString = this.props.queryString || '';
    const { mode } = this.props.match.params;

    if (isModalNeeded !== undefined && !isModalNeeded && position) {
      showModal = false;
      proceed = true;
    } else {
      const { geolocationPermission } = this.state;
      if (!geolocationPermission.loading) {
        if (!geolocationPermission.state) {
          setSavedGeolocationPermission('state', geolocationPermission.state);
        }
        if (geolocationPermission.state === 'granted') {
          this.context.executeAction(startLocationWatch);
          showModal = false;
          proceed = true;
        } else if (params.origin) {
          this.props.router.replace(
            `/${PREFIX_NEARYOU}/${params.mode}/${params.origin}${queryString}`,
          );
        }

        if (!proceed) {
          if (position) {
            if (position.status) {
              setSavedGeolocationPermission('choice', 'granted');
            } else if (
              getSavedGeolocationPermission().choice !== '' &&
              getSavedGeolocationPermission().choice !== 'rejected'
            ) {
              setSavedGeolocationPermission('choice', 'rejected');
              proceed = true;
              showModal = false;
            }
          }
        }
        if (!proceed) {
          if (geolocationPermission.state !== 'granted') {
            const savedPermission = getSavedGeolocationPermission();
            savedChoice =
              geolocationPermission.state === 'denied'
                ? geolocationPermission.state
                : savedPermission.choice || undefined;
            if (savedPermission.choice === 'granted') {
              this.context.executeAction(startLocationWatch);
              showModal = false;
            } else if (
              !position &&
              savedPermission.choice === 'rejected' &&
              geolocationPermission.closingModal
            ) {
              this.context.executeAction(showGeolocationDeniedMessage);
              showModal = false;
            }
          }
          showModal =
            showModal && geolocationPermission.closingModal ? false : showModal;
          proceed = true;
        }
      }
    }

    if (!proceed && loadingPosition) {
      return <Loading />;
    }
    if (!showModal) {
      return (
        <DesktopOrMobile
          desktop={() => (
            <DesktopView
              title={
                <FormattedMessage
                  id="nearest"
                  defaultMessage="Stops near you"
                  values={{
                    mode: (
                      <FormattedMessage
                        id={`nearest-stops-${mode.toLowerCase()}`}
                      />
                    ),
                  }}
                />
              }
              scrollable
              content={this.renderContent()}
              map={this.renderMap()}
              bckBtnColor={this.context.config.colors.primary}
              bckBtnUrl={
                this.context.config.URL.ROOTLINK
                  ? undefined
                  : this.createBckBtnUrl()
              }
            />
          )}
          mobile={() => (
            <MobileView
              content={this.renderContent()}
              map={this.renderMap()}
              bckBtnColor={this.context.config.colors.primary}
              bckBtnUrl={
                this.context.config.URL.ROOTLINK
                  ? undefined
                  : this.createBckBtnUrl()
              }
            />
          )}
        />
      );
    }
    return <div>{this.renderDialogModal(savedChoice)}</div>;
  }
}

const StopsNearYouPageWithBreakpoint = withBreakpoint(props => (
  <ReactRelayContext.Consumer>
    {({ environment }) => (
      <StopsNearYouPage {...props} relayEnvironment={environment} />
    )}
  </ReactRelayContext.Consumer>
));

const PositioningWrapper = connectToStores(
  StopsNearYouPageWithBreakpoint,
  ['PositionStore', 'PreferencesStore'],
  (context, props) => {
    const lang = context.getStore('PreferencesStore').getLanguage();
    const { params, location } = props.match;
    const { place } = params;
    if (place !== 'POS') {
      const position = otpToLocation(place);
      return {
        ...props,
        position,
        isModalNeeded: false,
        lang,
        params,
        queryString: location.search,
      };
    }
    const locationState = context.getStore('PositionStore').getLocationState();
    if (locationState.locationingFailed) {
      // Use default endpoint when positioning fails
      return {
        ...props,
        position: context.config.defaultEndpoint,
        loadingPosition: false,
        lang,
        params,
        queryString: location.search,
      };
    }

    if (
      !locationState.hasLocation &&
      (locationState.isLocationingInProgress ||
        locationState.isReverseGeocodingInProgress)
    ) {
      return {
        ...props,
        loadingPosition: true,
        lang,
        params,
        queryString: location.search,
      };
    }

    if (locationState.hasLocation) {
      return {
        ...props,
        position: locationState,
        loadingPosition: false,
        lang,
        queryString: location.search,
      };
    }
    return {
      ...props,
      position: undefined,
      loadingPosition: true,
      lang,
      params,
      queryString: location.search,
    };
  },
);

PositioningWrapper.contextTypes = {
  getStore: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export {
  PositioningWrapper as default,
  StopsNearYouPageWithBreakpoint as Component,
};
