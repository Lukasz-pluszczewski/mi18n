# MINTernationalization

i18n with redux made easy

`npm i --save mi18n`

## Note
 * Work in progress. Please do not use this library on production yet!
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

#### translations example
```javascript
const enTranslations = {
  main: {
    title: 'example title'
  },
  users: {
    addUserButton: 'Add new user',
    removeUserButton: 'Remove user',
    removeUserAlert: {
      title: 'Are you sure?',
      text: 'This action cannot be undone',
    },
  },
}
```

#### Set language with translations:
```javascript
import { setLanguage } from 'services/i18n';

store.dispatch(setLanguage('en', enTranslations));
```
or inside the component connected with redux state
```javascript
import { setLanguage } from 'services/i18n';

class MyComponent {
  // ... your component here 
}

connect(
  null,
  {
    setLanguage,
  }
)(MyComponent); // now MyComponent can just call this.props.setLanguage('en', enTranslations) to change language
```

#### Connect component to translations:
```javascript
import getT from 'services/i18n';

class MyComponent {
  // ... your component here 
}

connect(
  state => ({
    translator: getT(state.i18n),
    namespacedTranslator: getT(state.i18n, 'users'),
    lang: state.i18n.languageCode,
  })
)(MyComponent);
```

#### Using translator
```javascript
this.props.translator.t('main.title'); // example title
this.props.translator.t.titleCase('main.title'); // Example title
this.props.namespacedTranslator.t('addUserButton'); // Add new user
this.props.lang; // en
```

## FAQ
##### Why this exists?
There are many great i18n libraries out there (links below). However, most of them use React components to show translated text (see next question) and when you have to use the function fallback you loose the auto rerender of translated components.

With this lib you can:
* always be sure that changing language will trigger update for those components that needs that and you're able to use functions for translation at the same time.
* namespace translators (useful when crating reusable components)
* download and set translations asynchronously
* use translations with parameters (documentation coming soon)
* have pluralizable translations (multilingual - documentation coming soon)
* do all of that easily :)

##### Why not using components to show translated texts?
Components approach looks nice and consistent with the rest of your React application. However if you need to pass translated text in props you need a function fallback anyway. Function approach makes it consistent throughout the application and is understandable for everyone.

## Other i18n libraries (in arbitrary order)
* [i18n-react](https://github.com/alexdrel/i18n-react)
* [react-i18next](https://github.com/i18next/react-i18next)
* [react-i18nify](https://github.com/JSxMachina/react-i18nify) and [react-redux-i18n](https://github.com/zoover/react-redux-i18n)
* [react-intl](https://github.com/yahoo/react-intl)