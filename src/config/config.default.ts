import type { I18nConfig } from '../types.js';

export default {
  i18n: {
    defaultLocale: 'en_US',
    dirs: [],
    queryField: 'locale',
    cookieField: 'locale',
    cookieDomain: '',
    cookieMaxAge: '1y',
    localeAlias: {},
    writeCookie: true,
    dir: undefined,
  } as I18nConfig,
};
