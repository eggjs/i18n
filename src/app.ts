import path from 'node:path';
import { debuglog } from 'node:util';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import locales from 'koa-locales';
import { exists } from 'utility';
import { ILifecycleBoot, EggCore } from '@eggjs/core';

const debug = debuglog('@eggjs/i18n/app');

/**
 * I18n 国际化
 *
 * 通过设置 Plugin 配置 `i18n: true`，开启多语言支持。
 *
 * #### 语言文件存储路径
 *
 * 统一存放在 `config/locale/*.js` 下（ 兼容`config/locales/*.js` ），如包含英文，简体中文，繁体中文的语言文件：
 *
 * ```
 * - config/locale/
 *   - en-US.js
 *   - zh-CN.js
 *   - zh-TW.js
 * ```
 * @class I18n
 * @param {App} app Application object.
 * @example
 *
 * #### I18n 文件内容
 *
 * ```js
 * // config/locale/zh-CN.js
 * module.exports = {
 *   "Email": "邮箱",
 *   "Welcome back, %s!": "欢迎回来, %s!",
 *   "Hello %s, how are you today?": "你好 %s, 今天过得咋样？",
 * };
 * ```
 *
 * ```js
 * // config/locale/en-US.js
 * module.exports = {
 *   "Email": "Email",
 * };
 * ```
 * 或者也可以用 JSON 格式的文件:
 *
 * ```js
 * // config/locale/zh-CN.json
 * {
 *   "email": "邮箱",
 *   "login": "帐号",
 *   "createdAt": "注册时间"
 * }
 * ```
 */

export default class I18n implements ILifecycleBoot {
  private readonly app;

  constructor(app: EggCore & { locals: Record<string, any> }) {
    this.app = app;
  }

  async didLoad() {
    /**
     * 如果开启了 I18n 多语言功能，那么会出现此 API，通过它可以获取到当前请求对应的本地化数据。
     *
     * 详细使用说明，请查看 {@link I18n}
     * - `ctx.__ = function (key, value[, value2, ...])`: 类似 `util.format` 接口
     * - `ctx.__ = function (key, values)`: 支持数组下标占位符方式，如
     * - `__` 的别名是 `gettext(key, value)`
     *
     * > NOTE: __ 是两个下划线哦！
     * @function Context#__
     * @example
     * ```js
     * ctx.__('{0} {0} {1} {1}'), ['foo', 'bar'])
     * ctx.gettext('{0} {0} {1} {1}'), ['foo', 'bar'])
     * =>
     * foo foo bar bar
     * ```
     * ##### Controller 下的使用示例
     *
     * ```js
     * module.exports = function* () {
     *   this.body = {
     *     message: this.__('Welcome back, %s!', this.user.name),
     *     // 或者使用 gettext，如果觉得 __ 不好看的话
     *     // message: this.gettext('Welcome back, %s!', this.user.name),
     *     user: this.user,
     *   };
     * };
     * ```
     *
     * ##### View 文件下的使用示例
     *
     * ```html
     * <li>{{ __('Email') }}: {{ user.email }}</li>
     * <li>
     *   {{ __('Hello %s, how are you today?', user.name) }}
     * </li>
     * <li>
     *   {{ __('{0} {0} {1} {1}'), ['foo', 'bar']) }}
     * </li>
     * ```
     *
     * ##### locale 参数获取途径
     *
     * 优先级从上到下：
     *
     * - query: `/?locale=en-US`
     * - cookie: `locale=zh-TW`
     * - header: `Accept-Language: zh-CN,zh;q=0.5`
     */
    const functionName = '__';
    const i18nConfig = this.app.config.i18n;

    i18nConfig.dirs = Array.isArray(i18nConfig.dirs) ? i18nConfig.dirs : [];
    // 按 egg > 插件 > 框架 > 应用的顺序遍历 config/locale(config/locales) 目录，加载所有配置文件
    for (const unit of this.app.loader.getLoadUnits()) {
      let localePath = path.join(unit.path, 'config/locale');

      /**
       * 优先选择 `config/locale` 目录下的多语言文件，不存在时再选择 `config/locales` 目录
       * 避免 2 个目录同时存在时可能导致的冲突
       */
      if (!(await exists(localePath))) {
        localePath = path.join(unit.path, 'config/locales');
      }
      i18nConfig.dirs.push(localePath);
    }

    debug('app.config.i18n.dirs:', i18nConfig.dirs);

    locales(this.app, {
      ...i18nConfig,
      functionName,
    });

    /**
     * `ctx.__` 的别名。
     * @see {@link Context#__}
     * @function Context#gettext
     */
    this.app.context.gettext = this.app.context.__;

    const app = this.app;
    function gettextInContext(key: string, ...args: any[]) {
      const ctx = app.ctxStorage.getStore()!;
      return ctx.gettext(key, ...args);
    }
    // 在 view 中使用 __
    this.app.locals.gettext = gettextInContext;
    this.app.locals.__ = gettextInContext;
  }
}
