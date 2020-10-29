import PropTypes from 'prop-types';
import React from 'react';
import { intlShape } from 'react-intl';
import connectToStores from 'fluxible-addons-react/connectToStores';
import { routerShape } from 'found';
import suggestionToLocation from '@digitransit-search-util/digitransit-search-util-suggestion-to-location';
import AutoSuggest from '@digitransit-component/digitransit-component-autosuggest';
import FavouriteBar from '@digitransit-component/digitransit-component-favourite-bar';
import FavouriteModal from '@digitransit-component/digitransit-component-favourite-modal';
import FavouriteEditModal from '@digitransit-component/digitransit-component-favourite-editing-modal';
import DialogModal from '@digitransit-component/digitransit-component-dialog-modal';
import withSearchContext from './WithSearchContext';

import {
  saveFavourite,
  updateFavourites,
  deleteFavourite,
} from '../action/FavouriteActions';
import FavouriteStore from '../store/FavouriteStore';
import { addAnalyticsEvent } from '../util/analyticsUtils';

const AutoSuggestWithSearchContext = withSearchContext(AutoSuggest);

const favouriteShape = PropTypes.shape({
  type: PropTypes.string,
  address: PropTypes.string,
  gtfsId: PropTypes.string,
  gid: PropTypes.string,
  lat: PropTypes.number,
  lon: PropTypes.number,
  name: PropTypes.string,
  selectedIconId: PropTypes.string,
  favouriteId: PropTypes.string,
  layer: PropTypes.string,
});

class FavouritesContainer extends React.Component {
  static contextTypes = {
    intl: intlShape.isRequired,
    executeAction: PropTypes.func.isRequired,
    router: routerShape.isRequired,
    config: PropTypes.object.isRequired,
  };

  static propTypes = {
    favourites: PropTypes.arrayOf(favouriteShape),
    onClickFavourite: PropTypes.func.isRequired,
    lang: PropTypes.string,
    isMobile: PropTypes.bool,
    favouriteStatus: PropTypes.string,
    allowLogin: PropTypes.bool,
    isLoggedIn: PropTypes.bool,
  };

  static defaultProps = {
    favourites: [],
    isMobile: false,
    favouriteStatus: FavouriteStore.STATUS_FETCHING,
    allowLogin: false,
    isLoggedIn: false,
  };

  constructor(props) {
    super(props);
    this.state = {
      loginModalOpen: false,
      addModalOpen: false,
      editModalOpen: false,
      favourite: null,
    };
  }

  setLocationProperties = item => {
    const location =
      item.type === 'CurrentLocation' ? item : suggestionToLocation(item);
    this.setState(prevState => ({
      favourite: {
        ...location,
        name: (prevState.favourite && prevState.favourite.name) || '',
        defaultName: item.name || item.properties.name,
      },
    }));
  };

  addHome = () => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'AddHome',
      name: null,
    });
    this.setState({
      addModalOpen: true,
      favourite: {
        name: this.context.intl.formatMessage({
          id: 'location-home',
          defaultMessage: 'Home',
        }),
        selectedIconId: 'icon-icon_home',
      },
    });
  };

  addWork = () => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'AddWork',
      name: null,
    });
    this.setState({
      addModalOpen: true,
      favourite: {
        name: this.context.intl.formatMessage({
          id: 'location-work',
          defaultMessage: 'Work',
        }),
        selectedIconId: 'icon-icon_work',
      },
    });
  };

  saveFavourite = favourite => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'SaveFavourite',
      name: null,
    });
    this.context.executeAction(saveFavourite, favourite);
  };

  deleteFavourite = favourite => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'DeleteFavourite',
      name: null,
    });
    this.context.executeAction(deleteFavourite, favourite);
  };

  updateFavourites = favourites => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'UpdateFavourite',
      name: null,
    });
    this.context.executeAction(updateFavourites, favourites);
  };

  editFavourite = currentFavourite => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'EditFavourite',
      name: null,
    });
    this.setState({
      favourite: currentFavourite,
      editModalOpen: false,
      addModalOpen: true,
    });
  };

  renderLoginModal = () => {
    const login = this.context.intl.formatMessage({
      id: 'login',
      defaultMessage: 'Log in',
    });
    const cancel = this.context.intl.formatMessage({
      id: 'cancel',
      defaultMessage: 'cancel',
    });
    const headerText = this.context.intl.formatMessage({
      id: 'login-header',
      defautlMessage: 'Log in first',
    });

    const dialogContent = this.context.intl.formatMessage({
      id: 'login-content',
      defautlMessage: 'Log in first',
    });

    return (
      <DialogModal
        appElement="#app"
        headerText={headerText}
        dialogContent={dialogContent}
        handleClose={() => this.setState({ loginModalOpen: false })}
        lang={this.props.lang}
        isModalOpen={this.state.loginModalOpen}
        primaryButtonText={login}
        href="/login"
        primaryButtonOnClick={() => {
          addAnalyticsEvent({
            category: 'Favourite',
            action: 'login',
            name: null,
          });

          this.setState({
            loginModalOpen: false,
          });
        }}
        secondaryButtonText={cancel}
        secondaryButtonOnClick={() => {
          addAnalyticsEvent({
            category: 'Favourite',
            action: 'login cancelled',
            name: null,
          });
          this.setState({
            loginModalOpen: false,
          });
        }}
      />
    );
  };

  addPlace = () => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'AddPlace',
      name: null,
    });

    this.setState({
      addModalOpen: true,
    });
  };

  editPlace = () => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'EditPlace',
      name: null,
    });

    this.setState({
      editModalOpen: true,
    });
  };

  closeModal = isAddModal => {
    if (isAddModal) {
      addAnalyticsEvent({
        category: 'Favourite',
        action: 'CloseAddModal',
        name: null,
      });
      this.setState({
        addModalOpen: false,
      });
    } else {
      addAnalyticsEvent({
        category: 'Favourite',
        action: 'CloseEditModal',
        name: null,
      });
      this.setState({
        editModalOpen: false,
        favourite: null,
      });
    }
    // Modal close animation lasts 250ms
    setTimeout(() => {
      this.setState({ favourite: null });
    }, 250);
  };

  cancelSelected = () => {
    addAnalyticsEvent({
      category: 'Favourite',
      action: 'CancelUpdate',
      name: null,
    });
    this.setState({
      addModalOpen: false,
      editModalOpen: true,
    });
    // Modal close animation lasts 250ms
    setTimeout(() => {
      this.setState({ favourite: null });
    }, 250);
  };

  render() {
    const isLoading =
      this.props.favouriteStatus === FavouriteStore.STATUS_FETCHING_OR_UPDATING;
    const { allowLogin, isLoggedIn } = this.props;
    return (
      <React.Fragment>
        <FavouriteBar
          favourites={this.props.favourites}
          onClickFavourite={this.props.onClickFavourite}
          onAddPlace={() =>
            !allowLogin || isLoggedIn
              ? this.setState({ addModalOpen: true })
              : this.setState({ loginModalOpen: true })
          }
          onEdit={() =>
            !allowLogin || isLoggedIn
              ? this.setState({ editModalOpen: true })
              : this.setState({ loginModalOpen: true })
          }
          onAddHome={() =>
            !allowLogin || isLoggedIn
              ? this.addHome()
              : this.setState({ loginModalOpen: true })
          }
          onAddWork={() =>
            !allowLogin || isLoggedIn
              ? this.addWork()
              : this.setState({ loginModalOpen: true })
          }
          lang={this.props.lang}
          isLoading={isLoading}
        />
        <FavouriteModal
          appElement="#app"
          isModalOpen={this.state.addModalOpen}
          handleClose={() => this.closeModal(true)}
          saveFavourite={this.saveFavourite}
          cancelSelected={this.cancelSelected}
          favourite={this.state.favourite}
          lang={this.props.lang}
          isMobile={this.props.isMobile}
          autosuggestComponent={
            <AutoSuggestWithSearchContext
              appElement="#app"
              sources={['History', 'Datasource']}
              targets={['Locations', 'CurrentPosition']}
              id="favourite"
              icon="search"
              placeholder="search-address-or-place"
              value={
                (this.state.favourite && this.state.favourite.address) || ''
              }
              onFavouriteSelected={this.setLocationProperties}
              lang={this.props.lang}
              isMobile={this.props.isMobile}
            />
          }
        />
        <FavouriteEditModal
          appElement="#app"
          isModalOpen={this.state.editModalOpen}
          favourites={this.props.favourites}
          updateFavourites={this.updateFavourites}
          handleClose={() => this.closeModal(false)}
          saveFavourite={this.saveFavourite}
          deleteFavourite={this.deleteFavourite}
          onEditSelected={this.editFavourite}
          lang={this.props.lang}
          isMobile={this.props.isMobile}
          isLoading={isLoading}
        />
        {this.renderLoginModal()}
      </React.Fragment>
    );
  }
}

const connectedComponent = connectToStores(
  FavouritesContainer,
  ['FavouriteStore', 'UserStore'],
  context => ({
    favourites: context
      .getStore('FavouriteStore')
      .getFavourites()
      .filter(item => item.type === 'place'),
    favouriteStatus: context.getStore('FavouriteStore').getStatus(),
    allowLogin: context.config.allowLogin || false,
    isLoggedIn:
      context.config.allowLogin &&
      context.getStore('UserStore').getUser().sub !== undefined,
  }),
);

connectedComponent.contextTypes = {
  getStore: PropTypes.func.isRequired,
  config: PropTypes.object.isRequired,
};

export { connectedComponent as default, FavouritesContainer as Component };
