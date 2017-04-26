import _ from 'lodash';
import debug from 'debug';
import config from './config';

// Setting up logger
const logger = {
  info(...args) {
    debug('mi18n-redux:info')(...args);
  },
  error(...args) {
    debug('mi18n-redux:error')(...args);
  },
  namespaceError(...args) {
    debug('mi18n-redux:namespace-error')(...args);
  }
};

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
      logger.info(`No translator cached for namespace '${translatorNamespace || null}' in language ${state.languageCode}`);
    } else {
      logger.info(`Language changed from ${translatorFactory.cachedState ? translatorFactory.cachedState.languageCode : 'None'} to ${state.languageCode}. Requested namespace '${translatorNamespace || null}'. Clearing cache.`);
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
          logger.error(`${config.errors.i18n.pluralNotArray}`, {
            number,
            forms,
          });
          return forms;
        }
        if (!_.isNumber(number)) {
          logger.error(`${config.errors.i18n.pluralNotNumber}`, {
            number,
            forms,
          });
          return forms[0];
        }
        const pluralMap = translator.pluralMap[translator.state.languageCode] || translator.pluralMap.default;
        return forms[pluralMap(number)];
      },

      /**
       * Returns translations object optionally namespaced by path
       * @param {string} path - optional
       * @param {boolean} absolute - indicates if given path is absolute path and should not be preceded by translatorNamespace
       * @return {object|string} optionally namespaced translations
       */
      getTranslations(path, absolute = false) {
        let absolutePath = translator.translatorNamespace && !absolute ? translator.translatorNamespace : '';
        if (_.isString(path) && path) {
          if (absolutePath) {
            absolutePath = `${absolutePath}.${path}`;
          } else {
            absolutePath = path;
          }
        }
        if (absolutePath) {
          return _.get(translator.state.translations, absolutePath);
        }
        return translator.state.translations;
      },

      /**
       * Returns current language code
       * @return {string} language code
       */
      getLanguage() {
        return translator.state.languageCode;
      },

      /**
       * Returns new instance of translator with part of the translations from given namespacePath
       * @param {string} namespacePath
       * @param {boolean} absolute - indicates if given namespace is absolute path and should not be preceded by translatorNamespace
       * @return {object} translator
       */
      namespace(namespacePath, absolute = false) {
        const absolutePath = translator.translatorNamespace && !absolute ? `${translator.translatorNamespace}.${namespacePath}` : namespacePath;
        if (_.isString(absolutePath) && absolutePath) {
          const namespacedTranslations = _.get(translator.state.translations, absolutePath);
          if (!namespacedTranslations) {
            logger.namespaceError(config.errors.i18n.namespaceNotFound, {
              language: translator.state.languageCode,
              translatorNamespace: translator.translatorNamespace,
              providedNamespace: namespacePath,
              absolute,
              absolutePath,
            });
          } else if (_.isString(namespacedTranslations)) {
            logger.namespaceError(config.errors.i18n.namespaceNotObject, {
              language: translator.state.languageCode,
              translatorNamespace: translator.translatorNamespace,
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
        return translator.namespace(namespacePath, absolute);
      },

      getTranslatedString(path, replace = null, number = null) {
        // checking if path is not provided
        if (!arguments.length) {
          logger.error(`${config.errors.i18n.PathNotProvided}: "${joinedPath}"`, {
            language: translator.state.languageCode,
            translatorNamespace: translator.translatorNamespace,
            providedPath: path,
            absolutePath: joinedPath,
          });
          throw new Error(config.errors.i18n.PathNotProvided);
        }

        // checking if provided falsy path (but not empty string)
        if (!path && path !== '') {
          logger.error(`${config.errors.i18n.PathFalsy}: ""`, {
            language: translator.state.languageCode,
            translatorNamespace: translator.translatorNamespace,
            providedPath: path,
            typeofProvidedPath: typeof path,
            absolutePath: '',
          });
          return { result: '', joinedPath: '' };
        }

        const filteredPath = _.filter([translator.translatorNamespace, path], path => _.isString(path) && path);
        if (!filteredPath.length) {
          throw new Error(config.errors.i18n.PathNotProvided);
        }
        const joinedPath = filteredPath.join('.');
        let result = _.get(translator.state.translations, joinedPath, false);
        if (result === false) {
          logger.error(`${config.errors.i18n.translationNotFound}: "${joinedPath}"`, {
            language: translator.state.languageCode,
            translatorNamespace: translator.translatorNamespace,
            providedPath: path,
            absolutePath: joinedPath,
          });
          return { result, joinedPath };
        }
        if (_.isPlainObject(result)) {
          logger.error(`${config.errors.i18n.translationNotString}`, {
            language: translator.state.languageCode,
            translatorNamespace: translator.translatorNamespace,
            providedPath: path,
            absolutePath: joinedPath,
            foundTranslation: result,
          });
          return { result, joinedPath };
        }
        if (_.isArray(result)) {
          result = translator.getPlural(number, result);
        }
        if (!_.isString(result)) {
          throw new Error(config.errors.i18n.corruptedTranslations);
        }

        if (replace) {
          result = translator.replace(result, replace);
        }

        return { result, joinedPath };
      },
      translateWithCallback(path, replace = null, number = null, cb = str => str) {
        const result = translator.getTranslatedString(path, replace, number);
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
        const result = translator.getTranslatedString(path, replace, number);
        if (result.result === false) {
          return result.joinedPath;
        }
        return result.result;
      },
    };

    // creating chainable translator with helper methods
    const getTranslatorCallback = flags => translatedString => {
      let transformedString = translatedString;
      _.forEach(flags, (flagName) => {
        transformedString = _[flagName](transformedString);
      });
      return transformedString;
    };
    const createChainableTranslator = (flags = []) => ({
      capitalize() {
        return createChainableTranslator([
          ...flags,
          'capitalize',
        ]);
      },
      toUpper() {
        return createChainableTranslator([
          ...flags,
          'toUpper',
        ]);
      },
      toLower() {
        return createChainableTranslator([
          ...flags,
          'toLower',
        ]);
      },
      camelCase() {
        return createChainableTranslator([
          ...flags,
          'camelCase',
        ]);
      },
      lowerCase() {
        return createChainableTranslator([
          ...flags,
          'lowerCase',
        ]);
      },
      lowerFirst() {
        return createChainableTranslator([
          ...flags,
          'lowerFirst',
        ]);
      },
      snakeCase() {
        return createChainableTranslator([
          ...flags,
          'snakeCase',
        ]);
      },
      kebabCase() {
        return createChainableTranslator([
          ...flags,
          'kebabCase',
        ]);
      },
      startCase() {
        return createChainableTranslator([
          ...flags,
          'startCase',
        ]);
      },
      titleCase() {
        return createChainableTranslator([
          ...flags,
          'startCase',
        ]);
      },
      upperCase() {
        return createChainableTranslator([
          ...flags,
          'upperCase',
        ]);
      },
      upperFirst() {
        return createChainableTranslator([
          ...flags,
          'upperFirst',
        ]);
      },
      deburr() {
        return createChainableTranslator([
          ...flags,
          'deburr',
        ]);
      },
      translate(path, replace = null, number = null) {
        return translator.translateWithCallback(path, replace, number, getTranslatorCallback(flags));
      },
      t(path, replace = null, number = null) {
        return translator.translateWithCallback(path, replace, number, getTranslatorCallback(flags));
      }
    });

    _.assign(translator, createChainableTranslator());

    translatorFactory.cachedTranslators[translatorNamespace] = translator;
    translatorFactory.cachedState = state;
    return translator;
  },

};


export default translatorFactory.getTranslator;
