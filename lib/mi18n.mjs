import _ from 'lodash';
import debug from 'debug';

var config = {
  errors: {
    i18n: {
      namespaceNotFound: 'Namespace not found',
      namespaceNotObject: 'Provided namespace is path to translation. Provide path to object containing translations to set a namespace',
      translationNotFound: 'Translation not found',
      translationNotString: 'Provided path points to object not string. To create scoped translator use namespace() method instead',
      corruptedTranslations: 'Translations error. This is most likely caused by wrong type of data in translations object in redux state. Translation must always be string.',
      pluralNotArray: 'Forms parameter for getPlural method is not an array',
      pluralNotNumber: 'Number parameter for getPlural method is not a number',
      PathNotProvided: 'Path to translations has not been provided',
      PathFalsy: 'Path falsy'
    }
  }
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





















var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};



































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

// Setting up logger
var logger = {
  info: function info() {
    debug('mi18n-redux:info').apply(undefined, arguments);
  },
  error: function error() {
    debug('mi18n-redux:error').apply(undefined, arguments);
  },
  namespaceError: function namespaceError() {
    debug('mi18n-redux:namespace-error').apply(undefined, arguments);
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
    return _.reduce(search, function (result, replace, search) {
      return replaceAll(result, search, replace);
    }, string);
  }
  return string.replace(new RegExp(search, 'g'), replace);
}

var translatorFactory = {
  cachedTranslators: {},
  cachedState: null,

  /**
   * Creates translator and sets language and translations to those from state
   * @param {object} state - {languageCode: 'en', translations: {[key]: 'text'}}
   * @param {string} translatorNamespace
   * @return {object} translator
   */
  getTranslator: function getTranslator(state, translatorNamespace) {
    // checking if translations changed, checking deep equality is too resource hungry
    if (translatorFactory.cachedState && state.languageCode === translatorFactory.cachedState.languageCode) {
      if (translatorFactory.cachedTranslators[translatorNamespace]) {
        return translatorFactory.cachedTranslators[translatorNamespace];
      }
      logger.info('No translator cached for namespace \'' + (translatorNamespace || null) + '\' in language ' + state.languageCode);
    } else {
      logger.info('Language changed from ' + (translatorFactory.cachedState ? translatorFactory.cachedState.languageCode : 'None') + ' to ' + state.languageCode + '. Requested namespace \'' + (translatorNamespace || null) + '\'. Clearing cache.');
      translatorFactory.cachedTranslators = {};
      translatorFactory.cachedState = null;
    }

    var translator = {
      state: state,
      translatorNamespace: translatorNamespace,
      pluralMap: {
        default: function _default(number) {
          return number === 1 ? 0 : 1;
        },
        pl: function pl(number) {
          var last = _.takeRight(number.toString().split(''), 1).join('');
          var lastTwo = _.takeRight(number.toString().split(''), 2).join('');
          if (number === 1) {
            return 0;
          }
          if ((last === '2' || last === '3' || last === '4') && !(lastTwo === '12' || lastTwo === '13' || lastTwo === '14')) {
            return 1;
          }
          return 2;
        },
        en: function en(number) {
          return number === 1 ? 0 : 1;
        }
      },

      /**
       * Replaces all occurrences of replace[keys] with replace[values]
       * @param {string} string
       * @param {object} replace
       * @return {string} replaced string
       */
      replace: function replace(string, _replace) {
        var fixedReplaces = _.reduce(_replace, function (replaces, replace, search) {
          replaces['{{' + search + '}}'] = replace;
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
      getPlural: function getPlural(number, forms) {
        if (!_.isArray(forms)) {
          logger.error('' + config.errors.i18n.pluralNotArray, {
            number: number,
            forms: forms
          });
          return forms;
        }
        if (!_.isNumber(number)) {
          logger.error('' + config.errors.i18n.pluralNotNumber, {
            number: number,
            forms: forms
          });
          return forms[0];
        }
        var pluralMap = translator.pluralMap[translator.state.languageCode] || translator.pluralMap.default;
        return forms[pluralMap(number)];
      },


      /**
       * Returns translations object optionally namespaced by path
       * @param {string} path - optional
       * @param {boolean} absolute - indicates if given path is absolute path and should not be preceded by translatorNamespace
       * @return {object|string} optionally namespaced translations
       */
      getTranslations: function getTranslations(path) {
        var absolute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        var absolutePath = translator.translatorNamespace && !absolute ? translator.translatorNamespace : '';
        if (_.isString(path) && path) {
          if (absolutePath) {
            absolutePath = absolutePath + '.' + path;
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
      getLanguage: function getLanguage() {
        return translator.state.languageCode;
      },


      /**
       * Returns new instance of translator with part of the translations from given namespacePath
       * @param {string} namespacePath
       * @param {boolean} absolute - indicates if given namespace is absolute path and should not be preceded by translatorNamespace
       * @return {object} translator
       */
      namespace: function namespace(namespacePath) {
        var absolute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        var absolutePath = translator.translatorNamespace && !absolute ? translator.translatorNamespace + '.' + namespacePath : namespacePath;
        if (_.isString(absolutePath) && absolutePath) {
          var namespacedTranslations = _.get(translator.state.translations, absolutePath);
          if (!namespacedTranslations) {
            logger.namespaceError(config.errors.i18n.namespaceNotFound, {
              language: translator.state.languageCode,
              translatorNamespace: translator.translatorNamespace,
              providedNamespace: namespacePath,
              absolute: absolute,
              absolutePath: absolutePath
            });
          } else if (_.isString(namespacedTranslations)) {
            logger.namespaceError(config.errors.i18n.namespaceNotObject, {
              language: translator.state.languageCode,
              translatorNamespace: translator.translatorNamespace,
              providedNamespace: namespacePath,
              absolute: absolute,
              absolutePath: absolutePath,
              foundNamespace: namespacedTranslations
            });
          }
        }
        return translatorFactory.getTranslator(state, absolutePath);
      },
      n: function n(namespacePath) {
        var absolute = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

        return translator.namespace(namespacePath, absolute);
      },
      getTranslatedString: function getTranslatedString(path) {
        var replace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var number = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

        // checking if path is not provided
        if (!arguments.length) {
          logger.error(config.errors.i18n.PathNotProvided + ': "' + joinedPath + '"', {
            language: translator.state.languageCode,
            translatorNamespace: translator.translatorNamespace,
            providedPath: path,
            absolutePath: joinedPath
          });
          throw new Error(config.errors.i18n.PathNotProvided);
        }

        // checking if provided falsy path (but not empty string)
        if (!path && path !== '') {
          logger.error(config.errors.i18n.PathFalsy + ': ""', {
            language: translator.state.languageCode,
            translatorNamespace: translator.translatorNamespace,
            providedPath: path,
            typeofProvidedPath: typeof path === 'undefined' ? 'undefined' : _typeof(path),
            absolutePath: ''
          });
          return { result: '', joinedPath: '' };
        }

        var filteredPath = _.filter([translator.translatorNamespace, path], function (path) {
          return _.isString(path) && path;
        });
        if (!filteredPath.length) {
          throw new Error(config.errors.i18n.PathNotProvided);
        }
        var joinedPath = filteredPath.join('.');
        var result = _.get(translator.state.translations, joinedPath, false);
        if (result === false) {
          logger.error(config.errors.i18n.translationNotFound + ': "' + joinedPath + '"', {
            language: translator.state.languageCode,
            translatorNamespace: translator.translatorNamespace,
            providedPath: path,
            absolutePath: joinedPath
          });
          return { result: result, joinedPath: joinedPath };
        }
        if (_.isPlainObject(result)) {
          logger.error('' + config.errors.i18n.translationNotString, {
            language: translator.state.languageCode,
            translatorNamespace: translator.translatorNamespace,
            providedPath: path,
            absolutePath: joinedPath,
            foundTranslation: result
          });
          return { result: result, joinedPath: joinedPath };
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

        return { result: result, joinedPath: joinedPath };
      },
      translateWithCallback: function translateWithCallback(path) {
        var replace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var number = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
        var cb = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : function (str) {
          return str;
        };

        var result = translator.getTranslatedString(path, replace, number);
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
      translate: function translate(path) {
        var replace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
        var number = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

        var result = translator.getTranslatedString(path, replace, number);
        if (result.result === false) {
          return result.joinedPath;
        }
        return result.result;
      }
    };

    // creating chainable translator with helper methods
    var getTranslatorCallback = function getTranslatorCallback(flags) {
      return function (translatedString) {
        var transformedString = translatedString;
        _.forEach(flags, function (flagName) {
          transformedString = _[flagName](transformedString);
        });
        return transformedString;
      };
    };
    var createChainableTranslator = function createChainableTranslator() {
      var flags = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
      return {
        capitalize: function capitalize() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['capitalize']));
        },
        toUpper: function toUpper() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['toUpper']));
        },
        toLower: function toLower() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['toLower']));
        },
        camelCase: function camelCase() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['camelCase']));
        },
        lowerCase: function lowerCase() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['lowerCase']));
        },
        lowerFirst: function lowerFirst() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['lowerFirst']));
        },
        snakeCase: function snakeCase() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['snakeCase']));
        },
        kebabCase: function kebabCase() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['kebabCase']));
        },
        startCase: function startCase() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['startCase']));
        },
        titleCase: function titleCase() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['startCase']));
        },
        upperCase: function upperCase() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['upperCase']));
        },
        upperFirst: function upperFirst() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['upperFirst']));
        },
        deburr: function deburr() {
          return createChainableTranslator([].concat(toConsumableArray(flags), ['deburr']));
        },
        translate: function translate(path) {
          var replace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
          var number = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

          return translator.translateWithCallback(path, replace, number, getTranslatorCallback(flags));
        },
        t: function t(path) {
          var replace = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
          var number = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;

          return translator.translateWithCallback(path, replace, number, getTranslatorCallback(flags));
        }
      };
    };

    _.assign(translator, createChainableTranslator());

    translatorFactory.cachedTranslators[translatorNamespace] = translator;
    translatorFactory.cachedState = state;
    return translator;
  }
};

var getT$1 = translatorFactory.getTranslator;

var SET_LANGUAGE_ACTION$1 = '@@SET_LANGUAGE';
var initialState = {
  languageCode: '',
  translations: {}
};

/* ----- Redux actions ------ */

/**
 * setLanguage - action for setting language
 *
 * @param  {string} languageCode
 * @param  {object} translations object with translations
 * @return {object} action
 */
function setLanguage$1(languageCode, translations) {
  return {
    type: SET_LANGUAGE_ACTION$1,
    payload: { languageCode: languageCode, translations: translations }
  };
}

/**
 * Reducer for managing language change
 * @param {object} state
 * @param {object} action
 * @return {object} new state
 */
function reducer$1() {
  var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
  var action = arguments[1];

  switch (action.type) {
    case SET_LANGUAGE_ACTION$1:
      return _extends({}, state, {
        languageCode: action.payload.languageCode,
        translations: action.payload.translations
      });
    default:
      return state;
  }
}

var actionType = SET_LANGUAGE_ACTION$1;

var setLanguage$$1 = setLanguage$1;
var reducer$$1 = reducer$1;
var SET_LANGUAGE_ACTION = actionType;

export { setLanguage$$1 as setLanguage, reducer$$1 as reducer, SET_LANGUAGE_ACTION };export default getT$1;
//# sourceMappingURL=mi18n.mjs.map
