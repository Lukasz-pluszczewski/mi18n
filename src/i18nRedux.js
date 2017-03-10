const SET_LANGUAGE_ACTION = '@@SET_LANGUAGE';
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
    type: SET_LANGUAGE_ACTION,
    payload: { languageCode, translations },
  };
}

/**
 * Reducer for managing language change
 * @param {object} state
 * @param {object} action
 * @return {object} new state
 */
export function reducer(state = initialState, action) {
  switch (action.type) {
    case SET_LANGUAGE_ACTION:
      return {
        ...state,
        languageCode: action.payload.languageCode,
        translations: action.payload.translations,
      };
    default:
      return state;
  }
}

export const actionType = SET_LANGUAGE_ACTION;
