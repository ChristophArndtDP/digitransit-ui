const fetch = require('node-fetch');
const moment = require('moment');

const postCarpoolOffer = options => {
  const body = {
    Contactmobile: '015129117999',
    Currency: 'EUR',
    Enterdate: moment().unix(),
    IDuser: '830d39a4-3584-6f04-a178-25176353b359',
    Places: '3',
    Privacy: {
      Name: '1',
      Mobile: '1',
      Email: '1',
      Landline: '1',
      Licenseplate: '1',
      Car: '1',
    },
    Relevance: '10',
    Reoccur: {},
    Routings: [
      {
        RoutingID: null,
        Origin: {
          Address: options.origin.label,
          CountryName: 'Deutschland',
          CountryCode: 'Deutschland',
          Latitude: options.origin.lat,
          Longitude: options.origin.lng,
        },
        Destination: {
          Address: options.destination.label,
          CountryName: 'Deutschland',
          CountryCode: 'Deutschland',
          Latitude: options.destination.lat,
          Longitude: options.destination.lng,
        },
        RoutingIndex: 0,
      },
    ],
    Smoker: 'no',
    Startdate: '20200315',
    Starttime: '1700',
    Triptype: 'offer',
  };

  const headers = {
    apikey: process.env.FAHRGEMEINSCHAFT_API_KEY,
    authkey: process.env.FAHRGEMEINSCHAFT_AUTH_KEY,
    'content-type': 'application/json',
  };

  return fetch('https://service.live.ride2go.com/trip', {
    method: 'post',
    body: JSON.stringify(body),
    headers,
  }).then(res => res.json());
};

module.exports.postCarpoolOffer = postCarpoolOffer;
