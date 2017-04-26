import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import _ from 'lodash';
import getTranslator from 'i18nService';

chai.use(chaiAsPromised);

const translations = {
  test: {
    subTest: {
      test1: 'value1',
      test2: 'value2',
      test3: '{{replace}} value3',
    },
    cases: {
      lower: 'lower case',
      camel: 'camelCase',
      pascal: 'PascalCase',
      upper: 'UPPERCASE',
      kebab: 'kebab-case',
      snake: 'snake_case',
      title: 'Title Case',
    },
    diacritics: 'ąśćéæøå',
  },
  plural: [
    'thing',
    'things',
  ],
  pluralPL: [
    'pies',
    'psy',
    'psow',
  ],
  pluralReplace: [
    '{{number}} dog',
    '{{number}} dogs',
  ],
};

const state = {
  translations,
  languageCode: 'en',
};

const statePL = {
  translations,
  languageCode: 'pl',
};

describe('i18n', () => {
  describe('getTranslator function', () => {
    // creating translator
    it('should create translator', () => {
      const translator = getTranslator({ translations: {}, languageCode: '' });
      expect(translator.getLanguage).to.be.a('function');
      expect(translator.getTranslations).to.be.a('function');
      expect(translator.translate).to.be.a('function');
      expect(translator.t).to.be.a('function');
      expect(translator.namespace).to.be.a('function');
      expect(translator.n).to.be.a('function');
    });
    it('should get translations and language', () => {
      const translator = getTranslator(state);
      expect(translator.getLanguage()).to.be.equal(state.languageCode);
      expect(translator.getTranslations()).to.be.deep.equal(translations);
    });
    it('should get namespaced translations', () => {
      const translator = getTranslator(state, 'test.subTest');

      expect(translator.getTranslations(), 'constructor did not register namespace when creating translator')
        .to.be.deep.equal(translations.test.subTest);
    });

    // caching
    it('should return cached translator instance if state did not change', () => {
      const translator = getTranslator(state);
      const sameState = _.cloneDeep(state);
      expect(getTranslator(sameState)).to.be.equal(translator);
    });
    it('should create new translator instance if state did change', () => {
      const translator = getTranslator(state);
      const differentState = { languageCode: 'diff', translations };
      expect(getTranslator(differentState)).to.not.be.equal(translator);
    });
  });
  describe('translator', () => {
    it('should translate given path', () => {
      const translator = getTranslator(state);
      expect(translator.translate('test.subTest.test1')).to.be.equal(translations.test.subTest.test1);
    });

    it('should create namespaced translator', () => {
      const translator = getTranslator(state).namespace('test.subTest');
      expect(translator.getTranslations(), 'translator did not create namespaced translator')
        .to.be.deep.equal(translations.test.subTest);

      expect(translator, 'n method gave different results than namespace method')
        .to.be.deep.equal(getTranslator(state).n('test.subTest'));
    });
    it('should create namespaced translator out of namespaced translator', () => {
      const translator = getTranslator(state, 'test').namespace('subTest');
      expect(translator.getTranslations(), 'translator did not create namespaced translator')
        .to.be.deep.equal(translations.test.subTest);

      expect(translator, 'n method gave different results than namespace method')
        .to.be.deep.equal(getTranslator(state, 'test').n('subTest'));
    });

    it('should create not namespaced translator out of namespaced translator', () => {
      const translator = getTranslator(state, 'test').namespace('', true);
      expect(translator.getTranslations(), 'translator did not create namespaced translator')
        .to.be.deep.equal(translations);

      expect(translator, 'n method gave different results than namespace method')
        .to.be.deep.equal(getTranslator(state, 'test').n('', true));
    });
    it('should create absoluteNamespaced translator out of namespaced translator', () => {
      const translator = getTranslator(state, 'test.subTest').namespace('test', true);
      expect(translator.getTranslations(), 'translator did not create namespaced translator')
        .to.be.deep.equal(translations.test);

      expect(translator, 'n method gave different results than namespace method')
        .to.be.deep.equal(getTranslator(state, 'test.subTest').n('test', true));
    });

    it('should get all translations when provided with empty absolute path', () => {
      const translator = getTranslator(state, 'test.subTest');
      expect(translator.getTranslations('', true)).to.be.deep.equal(translations);
    });
    it('should get absoluteNamespaced translations when provided with non-empty absolute path', () => {
      const translator = getTranslator(state, 'test.subTest');
      expect(translator.getTranslations('test', true)).to.be.deep.equal(translations.test);
    });

    it('should throw an error when wrong type found during translation', () => {
      const translator = getTranslator({ languageCode: 'wrong', translations: { test: 123 } });
      expect(() => translator.translate('test')).to.throw(Error);
    });

    it('should return given path when translation not found', () => {
      const translator = getTranslator(state);
      expect(translator.translate('non.existing.path')).to.be.equal('non.existing.path');
    });

    it('should not throw error when provided with non-string path', () => {
      const translator = getTranslator(state);
      expect(() => translator.translate(false)).to.not.throw.error;
      expect(() => translator.translate(undefined)).to.not.throw.error; // eslint-disable-line no-undef
      expect(() => translator.namespace('test.subTest').translate(null)).to.not.throw.error;
    });
    it('should return empty string when provided with non-string path regardless of namespace', () => {
      const translator = getTranslator(state);
      expect(translator.namespace('test.subTest').translate(void 0)).to.be.equal('');
      expect(translator.translate(void 0)).to.be.equal('');
    });
    it('should throw an error if path is not provided (even if there is translation in current namespace)', () => {
      const translator = getTranslator(state);
      expect(translator.namespace('test.subTest.test1').translate()).to.throw.error;
      expect(translator.translate()).to.throw.error;
    });
    it('should return translation from path in current namespace if there is empty string provided as path', () => {
      const translator = getTranslator(state);
      expect(translator.namespace('test.subTest.test1').translate('')).to.be.equal(translations.test.subTest.test1);
    });

    // replacing
    it('should replace params in translated string', () => {
      const translator = getTranslator(state);
      expect(translator.t('test.subTest.test3', { replace: 'myValue' })).to.be.equal('myValue value3');
    });
    it('should leave params that are not provided', () => {
      const translator = getTranslator(state);
      expect(translator.t('test.subTest.test3')).to.be.equal('{{replace}} value3');
    });

    // plural
    it('should get proper plural form from array of forms in english', () => {
      const translator = getTranslator(state);
      expect(translator.t('plural', null, 1)).to.be.equal('thing');
      expect(translator.t('plural', null, 2)).to.be.equal('things');
      expect(translator.t('plural', null, 5)).to.be.equal('things');
    });
    it('should get proper plural form from array of forms and replace params in english', () => {
      const translator = getTranslator(state);
      expect(translator.t('pluralReplace', { number: 1 }, 1)).to.be.equal('1 dog');
      expect(translator.t('pluralReplace', { number: 2 }, 2)).to.be.equal('2 dogs');
      expect(translator.t('pluralReplace', { number: 5 }, 5)).to.be.equal('5 dogs');
    });
    it('should get proper plural form from array of forms in polish', () => {
      const translator = getTranslator(statePL);
      expect(translator.t('pluralPL', null, 1)).to.be.equal('pies');
      expect(translator.t('pluralPL', null, 2)).to.be.equal('psy');
      expect(translator.t('pluralPL', null, 5)).to.be.equal('psow');
      expect(translator.t('pluralPL', null, 24)).to.be.equal('psy');
      expect(translator.t('pluralPL', null, 13)).to.be.equal('psow');
      expect(translator.t('pluralPL', null, 114)).to.be.equal('psow');
    });

    // helper methods
    it('should translate and change case', () => {
      const translator = getTranslator(state);
      expect(translator.capitalize().t('test.cases.lower')).to.be.equal('Lower case');
      expect(translator.titleCase().t('test.cases.lower')).to.be.equal('Lower Case');
      expect(translator.camelCase().t('test.cases.lower')).to.be.equal('lowerCase');
      expect(translator.lowerCase().t('test.cases.upper')).to.be.equal('uppercase');
      expect(translator.snakeCase().t('test.cases.pascal')).to.be.equal('pascal_case');
      expect(translator.kebabCase().t('test.cases.pascal')).to.be.equal('pascal-case');
      expect(translator.upperCase().t('test.cases.pascal')).to.be.equal('PASCAL CASE');
      expect(translator.upperFirst().t('test.cases.camel')).to.be.equal('CamelCase');
      expect(translator.toUpper().t('test.cases.camel')).to.be.equal('CAMELCASE');
      expect(translator.toLower().t('test.cases.camel')).to.be.equal('camelcase');
      expect(translator.deburr().t('test.diacritics')).to.be.equal('asceaeoa');
    });
    it('should allow to chain helper methods', () => {
      const translator = getTranslator(state);
      expect(translator.deburr().toUpper().t('test.diacritics')).to.be.equal('ASCEAEOA');
    });
  });
});
