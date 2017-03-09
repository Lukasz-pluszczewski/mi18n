const config = {
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
    },
  },
};

export default config;
