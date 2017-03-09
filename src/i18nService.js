import _ from 'lodash';
import config from './config';

// mocked logger until publishing logger library
/* eslint-disable no-empty-function */
global.logger = new Proxy(function() {}, {
  get: function(target, name) {
    return function(...args) {
      console.log(...args);
    };
  },
  apply: function(target, thisArg, argumentsList) {},
});

/**
 * Replaces all occurrences of 'search' in 'string' with 'replace'
 * @param {string} string
 * @param {string|object} search string or object with search strings as keys and replaces strings as values
 * @param {string} replace
 * @return {string} string after replace
 */
function replaceAll(string, search, replace) {
  if (_.isPlainObject(search)) {
    return _.reduce(search, (result, replace, search) => {
      return replaceAll(result, search, replace);
    }, string);
  }
  return string.replace(new RegExp(search, 'g'), replace);
}

export const translatorFactory = {
  cachedTranslators: {},
  cachedState: null,

  /**
   * Creates translator and sets language and translations to those from state
   * @param {object} state - {languageCode: 'en', translations: {[key]: 'text'}}
   * @param {string} translatorNamespace
   * @return {object} translator
   */
  getTranslator(state, translatorNamespace) {
    // checking if translations changed, checking deep equality is too resource hungry
    if (
      translatorFactory.cachedState
      && state.languageCode === translatorFactory.cachedState.languageCode
    ) {
      if (translatorFactory.cachedTranslators[translatorNamespace]) {
        return translatorFactory.cachedTranslators[translatorNamespace];
      }
      logger.translations(`No translator cached for namespace '${translatorNamespace || null}' in language ${state.languageCode}`);
    } else {
      logger.translations(`Language changed from ${translatorFactory.cachedState ? translatorFactory.cachedState.languageCode : 'None'} to ${state.languageCode}. Requested namespace '${translatorNamespace || null}'. Clearing cache.`);
      translatorFactory.cachedTranslators = {};
      translatorFactory.cachedState = null;
    }


    const translator = {
      state: state,
      translatorNamespace: translatorNamespace,
      pluralMap: {
        default: number => number === 1 ? 0 : 1,
        pl: number => {
          const last = _.takeRight(number.toString().split(''), 1).join('');
          const lastTwo = _.takeRight(number.toString().split(''), 2).join('');
          if (number === 1) {
            return 0;
          }
          if ( (last === '2' || last === '3' || last === '4')
            && !(lastTwo === '12' || lastTwo === '13' || lastTwo === '14') ) {
            return 1;
          }
          return 2;
        },
        en: number => number === 1 ? 0 : 1,
      },

      /**
       * Replaces all occurrences of replace[keys] with replace[values]
       * @param {string} string
       * @param {object} replace
       * @return {string} replaced string
       */
      replace(string, replace) {
        const fixedReplaces = _.reduce(replace, (replaces, replace, search) => {
          replaces[`{{${search}}}`] = replace;
          return replaces;
        }, {});
        return replaceAll(string, fixedReplaces);
      },

      /**
       * Chooses proper form from array of forms based on the number provided
       * @param {number} number
       * @param {array} forms
       * @return {string} chosen form
       */
      getPlural(number, forms) {
        if (!_.isArray(forms)) {
          logger.translations(`${config.errors.i18n.pluralNotArray}`, {
            number,
            forms,
          });
          return forms;
        }
        if (!_.isNumber(number)) {
          logger.translations(`${config.errors.i18n.pluralNotNumber}`, {
            number,
            forms,
          });
          return forms[0];
        }
        const pluralMap = this.pluralMap[this.state.languageCode] || this.pluralMap.default;
        return forms[pluralMap(number)];
      },

      /**
       * Returns translations object optionally namespaced by path
       * @param {string} path - optional
       * @param {boolean} absolute - indicates if given path is absolute path and should not be preceded by translatorNamespace
       * @return {object|string} optionally namespaced translations
       */
      getTranslations(path, absolute = false) {
        let absolutePath = this.translatorNamespace && !absolute ? this.translatorNamespace : '';
        if (_.isString(path) && path) {
          if (absolutePath) {
            absolutePath = `${absolutePath}.${path}`;
          } else {
            absolutePath = path;
          }
        }
        if (absolutePath) {
          return _.get(this.state.translations, absolutePath);
        }
        return this.state.translations;
      },

      /**
       * Returns current language code
       * @return {string} language code
       */
      getLanguage() {
        return this.state.languageCode;
      },

      /**
       * Returns new instance of translator with part of the translations from given namespacePath
       * @param {string} namespacePath
       * @param {boolean} absolute - indicates if given namespace is absolute path and should not be preceded by translatorNamespace
       * @return {object} translator
       */
      namespace(namespacePath, absolute = false) {
        const absolutePath = this.translatorNamespace && !absolute ? `${this.translatorNamespace}.${namespacePath}` : namespacePath;
        if (_.isString(absolutePath) && absolutePath) {
          const namespacedTranslations = _.get(this.state.translations, absolutePath);
          if (!namespacedTranslations) {
            logger.translations(config.errors.i18n.namespaceNotFound, {
              language: this.state.languageCode,
              translatorNamespace: this.translatorNamespace,
              providedNamespace: namespacePath,
              absolute,
              absolutePath,
            });
          } else if (_.isString(namespacedTranslations)) {
            logger.translations(config.errors.i18n.namespaceNotObject, {
              language: this.state.languageCode,
              translatorNamespace: this.translatorNamespace,
              providedNamespace: namespacePath,
              absolute,
              absolutePath,
              foundNamespace: namespacedTranslations,
            });
          }
        }
        return translatorFactory.getTranslator(state, absolutePath);
      },
      n(namespacePath, absolute = false) {
        return this.namespace(namespacePath, absolute);
      },

      getTranslatedString(path, replace = null, number = null) {
        const filteredPath = _.filter([this.translatorNamespace, path], path => _.isString(path) && path);
        if (!filteredPath.length) {
          throw new Error(config.errors.i18n.PathNotProvided);
        }
        const joinedPath = filteredPath.join('.');
        let result = _.get(this.state.translations, joinedPath, false);
        if (result === false) {
          logger.translations(`${config.errors.i18n.translationNotFound}: "${joinedPath}"`, {
            language: this.state.languageCode,
            translatorNamespace: this.translatorNamespace,
            providedPath: path,
            absolutePath: joinedPath,
          });
          return { result, joinedPath };
        }
        if (_.isPlainObject(result)) {
          logger.translations(`${config.errors.i18n.translationNotString}`, {
            language: this.state.languageCode,
            translatorNamespace: this.translatorNamespace,
            providedPath: path,
            absolutePath: joinedPath,
            foundTranslation: result,
          });
          return { result, joinedPath };
        }
        if (_.isArray(result)) {
          result = this.getPlural(number, result);
        }
        if (!_.isString(result)) {
          throw new Error(config.errors.i18n.corruptedTranslations);
        }

        if (replace) {
          result = this.replace(result, replace);
        }

        return { result, joinedPath };
      },
      translateWithCallback(path, replace = null, number = null, cb = str => str) {
        const result = this.getTranslatedString(path, replace, number);
        if (result.result === false) {
          return result.joinedPath;
        }
        return cb(result.result);
      },

      /**
       * Translates given path
       * @param {string} path
       * @param {object} replace
       * @param {number} number
       * @return {string} translated text or path when not found
       */
      translate(path, replace = null, number = null) {
        const result = this.getTranslatedString(path, replace, number);
        if (result.result === false) {
          return result.joinedPath;
        }
        return result.result;
      },
    };
    translator.translate.capitalize
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.capitalize);

    translator.translate.toUpper
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.toUpper);

    translator.translate.toLower
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.toLower);

    translator.translate.camelCase
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.camelCase);

    translator.translate.lowerCase
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.lowerCase);

    translator.translate.lowerFirst
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.lowerFirst);

    translator.translate.snakeCase
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.snakeCase);

    translator.translate.kebabCase
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.kebabCase);

    translator.translate.startCase
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.startCase);

    translator.translate.titleCase
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.startCase);

    translator.translate.upperCase
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.upperCase);

    translator.translate.upperFirst
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.upperFirst);

    translator.translate.deburr
      = (path, replace = null, number = null) => translator.translateWithCallback(path, replace, number, _.deburr);

    translator.t = translator.translate;

    translatorFactory.cachedTranslators[translatorNamespace] = translator;
    translatorFactory.cachedState = state;
    return translator;
  },

};


export default translatorFactory.getTranslator;
