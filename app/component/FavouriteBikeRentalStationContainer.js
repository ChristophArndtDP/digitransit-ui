import PropTypes from 'prop-types';
import connectToStores from 'fluxible-addons-react/connectToStores';
import Favourite from './Favourite';
import { saveFavourite, deleteFavourite } from '../action/FavouriteActions';
import { addAnalyticsEvent } from '../util/analyticsUtils';

const FavouriteBikeRentalStationContainer = connectToStores(
  Favourite,
  ['FavouriteStore', 'UserStore', 'PreferencesStore'],
  (context, { bikeRentalStation }) => ({
    favourite: context
      .getStore('FavouriteStore')
      .isFavouriteBikeRentalStation(
        bikeRentalStation.stationId,
        bikeRentalStation.networks,
      ),
    addFavourite: () => {
      context.executeAction(saveFavourite, {
        lat: bikeRentalStation.lat,
        lon: bikeRentalStation.lon,
        networks: bikeRentalStation.networks,
        name: bikeRentalStation.name,
        stationId: bikeRentalStation.stationId,
        type: 'bikeStation',
      });
      addAnalyticsEvent({
        category: 'BikeRentalStation',
        action: 'MarkBikeRentalStationAsFavourite',
        name: !context
          .getStore('FavouriteStore')
          .isFavouriteBikeRentalStation(
            bikeRentalStation.stationId,
            bikeRentalStation.networks,
          ),
      });
    },
    deleteFavourite: () => {
      const bikeRentalStationToDelete = context
        .getStore('FavouriteStore')
        .getByStationIdAndNetworks(
          bikeRentalStation.stationId,
          bikeRentalStation.networks,
        );
      context.executeAction(deleteFavourite, bikeRentalStationToDelete);
      addAnalyticsEvent({
        category: 'BikeRentalStation',
        action: 'MarkBikeRentalStationAsFavourite',
        name: !context
          .getStore('FavouriteStore')
          .isFavouriteBikeRentalStation(
            bikeRentalStation.stationId,
            bikeRentalStation.networks,
          ),
      });
    },
    allowLogin: context.config.allowLogin,
    isLoggedIn:
      context.config.allowLogin &&
      context.getStore('UserStore').getUser().sub !== undefined,
    language: context.getStore('PreferencesStore').getLanguage(),
  }),
);

FavouriteBikeRentalStationContainer.contextTypes = {
  getStore: PropTypes.func.isRequired,
  executeAction: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export default FavouriteBikeRentalStationContainer;
