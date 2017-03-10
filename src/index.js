import getT from './i18nService';
import {
  setLanguage as setLangImport,
  reducer as reducerImport,
  actionType as actionTypeImport,
} from './i18nRedux';

export default getT;

export const setLanguage = setLangImport;
export const reducer = reducerImport;
export const SET_LANGUAGE_ACTION = actionTypeImport;
