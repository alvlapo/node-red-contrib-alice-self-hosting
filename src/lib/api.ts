import axios, {AxiosError} from 'axios';
import {NodeServiceType} from './types';
import {inspect} from 'util';
import axiosRetry, {isRetryableError} from 'axios-retry';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Package: any = require('../../package.json');

// if someone will be read this code
// I say: "Yandex sorry for axiosRetry"
// i know, i fix 5xx from response (Yandex),
// but make more 5xx for other ...

axios.defaults.headers.common['User-Agent'] = `${Package.name.trim()}/${Package.version.trim()} Node-RED`;

const _error = function (error: AxiosError) {
  let text = `${error.response?.status} - ${error.message}`;
  if (error.response?.data && typeof error.response?.data === 'object') {
    text = `${error.response?.status} - ${inspect(error.response?.data)}`;
  }
  return text;
};

const _request = async function (options: any, retries: number, retryDelay: number) {
  axiosRetry(axios, {
    retries: retries,
    retryDelay: retryCount => retryCount * retryDelay,
    retryCondition: isRetryableError
  });

  try {
    return await axios.request(options);
  } catch (error: any) {
    throw new Error(_error(error));
  }
};

// https://yandex.ru/dev/id/doc/ru/user-information
export const login = async function (token: string | undefined) {
  const _options = {
    method: 'GET',
    url: 'https://login.yandex.ru/info',
    headers: {
      Authorization: `OAuth ${token}`
    }
  };

  return await _request(_options, 3, 150);
};

// https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-state.html
export const callback_state = async function (service: NodeServiceType, device: any) {
  const credentials: any = service.credentials;
  const ts: number = Date.now() / 1000;

  const _options = {
    method: 'POST',
    url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/state`,
    headers: {
      Authorization: `OAuth ${credentials.oauth_token}`,
      'Content-Type': 'application/json'
    },
    data: {
      ts: ts,
      payload: {
        user_id: service.id,
        devices: [device]
      }
    }
  };

  return await _request(_options, 8, 200);
};

// https://yandex.ru/dev/dialogs/smart-home/doc/reference-alerts/post-skill_id-callback-discovery.html
export const callback_discovery = async function (service: NodeServiceType) {
  const credentials: any = service.credentials;
  const ts: number = Date.now() / 1000;

  const _options = {
    method: 'POST',
    url: `https://dialogs.yandex.net/api/v1/skills/${credentials.skill_id}/callback/discovery`,
    headers: {
      Authorization: `OAuth ${credentials.oauth_token}`,
      'Content-Type': 'application/json'
    },
    data: {
      ts: ts,
      payload: {
        user_id: service.id
      }
    }
  };

  return await _request(_options, 5, 150);
};
