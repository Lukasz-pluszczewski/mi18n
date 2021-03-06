# MINTernationalization

i18n with redux made easy

`npm i --save mi18n-redux`

## FAQ
##### Why this exists?
There are many great i18n libraries out there (links below). However, most of them use React components to show translated text (see next question) and when you have to use the function fallback you loose the auto rerender of translated components.

With this lib you can:
* always be sure that changing language will trigger update for those components that needs that and you're able to use functions for translation at the same time.
* namespace translators (useful when crating reusable components)
* download and set translations asynchronously
* use translations with parameters
* have pluralizable translations (multilingual)
* do all of that easily :)

##### Why not using components to show translated texts?
Components approach looks nice and consistent with the rest of your React application. However if you need to pass translated text in props you need a function fallback anyway. Function approach makes it consistent throughout the application and is understandable for everyone.

## Usage

#### Add i18n reducer to your reducers:
```javascript
import { reducer as i18nReducer } from 'mi18n-redux';

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
    title: 'example title',
  },
  users: {
    addUserButton: 'Add new user',
    removeUserButton: 'Remove user',
    removeUserAlert: {
      title: 'Are you sure?',
      text: 'This action cannot be undone',
    },
  },
  translationWithDiacritics: 'ąóść'
}
```

#### Set language with translations:
```javascript
import { setLanguage } from 'mi18n-redux';

store.dispatch(setLanguage('en', enTranslations));
```
or inside the component connected with redux state
```javascript
import { setLanguage } from 'mi18n-redux';

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
import getT from 'mi18n-redux';

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
this.props.namespacedTranslator.t('addUserButton'); // Add new user
this.props.lang; // en
```

#### Using helper methods
```javascript
this.props.translator.t('translationWithDiacritics'); // ąóść
this.props.translator.deburr().t('translationWithDiacritics'); // aosc
this.props.translator.deburr().toUpper().t('translationWithDiacritics'); // AOSC
this.props.translator.capitalize().t('main.title'); // Example title
this.props.translator.camelCase().t('main.title'); // exampleTitle
this.props.translator.lowerCase().t('main.title'); // example title
this.props.translator.snakeCase().t('main.title'); // example_title
this.props.translator.kebabCase().t('main.title'); // example-title
this.props.translator.startCase().t('main.title'); // Example Title
this.props.translator.upperCase().t('main.title'); // EXAMPLE TITLE
this.props.translator.upperFirst().t('main.title'); // Example title
```

## API

#### `reducer`
 - `import { reducer as mi18nReducer } from 'mi18n-redux'`
 - reducer that sets language and translation in redux store
 - add it to redux store with the help of [combineReducers function](http://redux.js.org/docs/api/combineReducers.html) 

#### `setLanguage`
 - `import { setLanguage } from 'mi18n-redux'`
 - [action creator](http://redux.js.org/docs/basics/Actions.html) which can be used to set language and translations
 - arguments
   - **languageCode**: *string* New language code (e.g. 'en')
   - **translations**: *object* Object with new translations
   
#### `SET_LANGUAGE_ACTION`
 - `import { SET_LANGUAGE_ACTION } from 'i18n-redux'`
 - Action type of action created by setLanguage action creator
 - Can be used to create custom action creators or custom reducers

#### `translationObject`
 - plain JavaScript object (can be infinitely nested)
 - allowed fields
   - **nested object**: *object* nested translation object
   - **pluralizable translation**: *array\<string\>* array with translations
   - **translation**: *string* translation
   - **translation with parameters**: *string* translation in the form of 'Some unchangeable text and {{parameter}}!'
 - example in english:
 
    ```javascript
    const enTranslations = {
      main: {
       title: 'My awesome translated app'
      },
      pluralizable: {
       dog: [
         'dog',
         'dogs',
       ],
       person: [
         'person',
         'people',
       ],
      },
      withParams: {
       welcome: 'Hello {{user}}! How are you?',
      },
    }
    ```
   
#### `getT(state, [namespace])`
 - `import getT from 'mi18n-redux'`
 - arguments
   - **state**: *redux state* i18n field from redux state
   - **namespace**: *string* (default: **null**) path to the translations that translator will be limited to
 - returns **translator**: *object*
 - example
    ```javascript
    import getT from 'mi18n-redux';
    
    class MyComponent {
     // ... your component here 
    }
    
    connect(
     state => ({
       translator: getT(state.i18n),
       namespacedTranslator: getT(state.i18n, 'users'),
     })
    )(MyComponent);
    ```
    
### `translator`
 - methods
   - `translator.translate(path, [replace, number])`: *function*
     - arguments
       - **path**: *string* path to the given translation, must point to string or array not nested object
        - **replace**: *object* parameters that should be replaced in the translations
         - **number**: *number* number needed to decide which pluralizable translation to choose
     - methods
        - `translator.translate.capitalize()`: *function* returns translator object with capitalize flag added
        - `translator.translate.toUpper()`: *function* returns translator object with uppercase flag added
        - `translator.translate.toLower()`: *function* returns translator object with lowercase flag added
        - `translator.translate.camelCase()`: *function* returns translator object with camelcase flag added
        - `translator.translate.lowerCase()`: *function* returns translator object with lowercase flag added
        - `translator.translate.lowerFirst()`: *function* returns translator object with lowerFirst flag added
        - `translator.translate.titleCase()`: *function* returns translator object with titleCase flag added
        - `translator.translate.deburr()`: *function* returns translator object with deburr flag added
   - `translator.t(path, [replace, number])`: alias for `translator.translate`
   - `translator.namespace(namespace, [absolute])`: *function*
     - arguments
       - **namespace**: *string* path to object that resulting translator should be limited to
        - **absolute**: *boolean* (default: **false**) indicates whether namespace is absolute path or path relative to current namespace
     - returns **translator**: *object* new instance of the translator with given namespace
   - `translator.n(namespace, [absolute])`: *function* alias for `translator.namespace`
   - `translator.getTranslations(path, [absolute])`: *function*
     - arguments
       - **path**: *string* (default: **''**) path to translation object we want to get
        - **absolute**: *boolean* (default: **false**) indicates whether provided path is asbolute or relative to current namespace
     - returns **translations**: *object* object with translations at given path
   - `translator.getLanguage()`
     - returns **languageCode**: *string* current language code
 - fields
   - `translator.pluralMap`: *object* object of functions (per language code) that takes number and returns index of corresponding plural form in pluralizable translation array
     - default
     ```javascript
     pluralMap = {
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
     }
     ```

## TODO
 * Make documentation easier to understand ;)
 * Add example app

## Other i18n libraries (in arbitrary order)
* [i18n-react](https://github.com/alexdrel/i18n-react)
* [react-i18next](https://github.com/i18next/react-i18next)
* [react-i18nify](https://github.com/JSxMachina/react-i18nify) and [react-redux-i18n](https://github.com/zoover/react-redux-i18n)
* [react-intl](https://github.com/yahoo/react-intl)
