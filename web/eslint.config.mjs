import next from 'eslint-config-next';

const config = [
  ...next,
  {
    ignores: ['coverage/**'],
  },
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
];

export default config;
