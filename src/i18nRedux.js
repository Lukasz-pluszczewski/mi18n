const SET_LANGUAGE = 'SET_LANGUAGE';
const initialState = {
  languageCode: '',
  translations: {},
};


/* ----- Redux actions ------ */

/**
 * setLanguage - action for setting language
 *
 * @param  {string} languageCode
 * @param  {object} translations object with translations
 * @return {object} action
 */
export function setLanguage(languageCode, translations) {
  return {
    type: SET_LANGUAGE,
    payload: { languageCode, translations },
  };
}

/**
 * Reducer for managing language change
 * @param {object} state
 * @param {object} action
 * @returns {object} new state
 */
export function reducer(state = initialState, action) {
  switch (action.type) {
    case SET_LANGUAGE:
      return {
        ...state,
        languageCode: action.payload.languageCode,
        translations: action.payload.translations,
      };
    default:
      return state;
  }
}

export const actionType = SET_LANGUAGE;
