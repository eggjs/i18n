import { Context } from '@eggjs/core';

export default class I18nContext extends Context {
  /**
   * get current request locale
   * @member Context#locale
   * @return {String} lower case locale string, e.g.: 'zh-cn', 'en-us'
   */
  get locale(): string {
    return this.__getLocale();
  }

  set locale(l: string) {
    this.__setLocale(l);
  }
}
