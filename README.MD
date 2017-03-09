# MINTernationalization

i18n with redux made easy

`npm i --save mi18n`

## Note
 * Work in progress. Please do not use this library on production!
 * Npm package may not be yet available!

## Usage

#### Add i18n reducer to your reducers:
```javascript
import { reducer as i18nReducer } from 'mi18n';

const rootReducer = combineReducers({
  // ...
  i18n: i18nReducer,
});

store = createStore(rootReducer);
```

#### Set language with translations:
```javascript
import { setLanguage } from 'services/i18n';

store.dispatch(setLanguage('en', enTranslations));
```
or
```javascript
import { setLanguage } from 'services/i18n';

connect(
  null,
  {
    setLanguage,
  }
)(MyComponent); // now MyComponent can just call setLanguage('en', enTranslations) to change language
```

#### Connect component to translations:
```javascript
import getT from 'services/i18n';

connect(
  state => ({
    translator: getT(state.i18n),
    lang: state.i18n.languageCode,
  })
)(TranslatedComponent);
```
