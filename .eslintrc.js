module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'google',
  ],
  'parser': '@typescript-eslint/parser',
  'parserOptions': {
    'ecmaVersion': 12,
  },
  'plugins': [
    '@typescript-eslint',
  ],
  'rules': {
    'require-jsdoc': 0,
    'valid-jsdoc': 0,
    'max-len': ['warn', {
      'code': 100,
      'ignorePattern': '^import .*',
    }],
    'no-unused-vars': ['warn', {'varsIgnorePattern': 'HTMLElementTagNameMap', 'args': 'none'}],
    'sort-imports': ['error', {
      'ignoreCase': false,
      'ignoreDeclarationSort': false,
      'ignoreMemberSort': false,
      'memberSyntaxSortOrder': ['none', 'all', 'multiple', 'single'],
      'allowSeparatedGroups': false,
    }],
  },
};
