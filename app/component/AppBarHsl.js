import PropTypes from 'prop-types';
import React from 'react';
import i18next from 'i18next';
import { matchShape, routerShape } from 'found';

import SiteHeader from '@hsl-fi/site-header';

const initLanguage = language => {
  i18next.init({ lang: language, resources: {} });
  i18next.changeLanguage(language);
  if (language === 'fi') {
    i18next.addResourceBundle('fi', 'translation', {
      traveling_name: 'Matkustaminen',
      traveling_url: '/matkustaminen/',
      tickets_and_fares_name: 'Liput ja hinnat',
      tickets_and_fares_url: '/liput-ja-hinnat/',
      information_name: 'Asiakaspalvelu',
      information_url: '/asiakaspalvelu/',
      hsl_name: 'HSL',
      hsl_url: '/hsl/',
      search_url: '/haku/',
      change_language: 'Vaihda kieli',
    });
  }
  if (language === 'sv') {
    i18next.addResourceBundle('sv', 'translation', {
      traveling_name: 'Resor',
      traveling_url: '/resor/',
      tickets_and_fares_name: 'Biljetter och priser',
      tickets_and_fares_url: '/biljetter-och-priser/',
      information_name: 'Information',
      information_url: '/information-sv/',
      hsl_name: 'HRT',
      hsl_url: '/hsl/',
      search_url: '/sok/',
      change_language: 'Välj språk',
    });
  }
  if (language === 'en') {
    i18next.addResourceBundle('en', 'translation', {
      traveling_name: 'Traveling',
      traveling_url: '/traveling/',
      tickets_and_fares_name: 'Tickets and fares',
      tickets_and_fares_url: '/tickets-and-fares/',
      information_name: 'Information',
      information_url: '/information-en/',
      hsl_name: 'HSL',
      hsl_url: '/hsl/',
      search_url: '/search/',
      change_language: 'Change language',
    });
  }
};

const AppBarHsl = ({ lang }, { match }) => {
  const { location } = match;

  initLanguage(lang);

  const navigation = {
    startPage: '/',
    menu: [
      {
        name: i18next.t('traveling_name'),
        url: i18next.t('traveling_url'),
        selected: false,
      },
      {
        name: i18next.t('tickets_and_fares_name'),
        url: i18next.t('tickets_and_fares_url'),
        selected: false,
      },
      {
        name: i18next.t('information_name'),
        url: i18next.t('information_url'),
        selected: false,
      },
      {
        name: i18next.t('hsl_name'),
        url: i18next.t('hsl_url'),
        selected: false,
      },
    ],
    searchPage: i18next.t('search_url'),
    languages: [
      { name: 'fi', url: `/fi${location.pathname}`, selected: lang === 'fi' },
      { name: 'sv', url: `/sv${location.pathname}`, selected: lang === 'sv' },
      { name: 'en', url: `/en${location.pathname}`, selected: lang === 'en' },
    ],
    breadcrumb: [],
  };
  const { startPage, menu, searchPage, languages } = navigation;
  const localizations = {
    mainNavigationLabel: 'main',
    changeLanguageButtonLabel: i18next.t('change_language'),
  };

  return (
    <SiteHeader
      startPage={startPage}
      menu={menu}
      searchPage={searchPage}
      languages={languages}
      localizations={localizations}
    />
  );
};

AppBarHsl.contextTypes = {
  router: routerShape.isRequired,
  match: matchShape.isRequired,
  config: PropTypes.object.isRequired,
};

AppBarHsl.propTypes = {
  lang: PropTypes.string,
};

AppBarHsl.defaultProps = {
  lang: 'fi',
};

export { AppBarHsl as default, AppBarHsl as Component };
