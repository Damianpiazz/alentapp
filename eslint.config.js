import js from '@eslint/js';
import globals from 'globals';

export default [
    js.configs.recommended,

    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                Vue: 'readonly',
                $: 'readonly',
                jQuery: 'readonly',
                moment: 'readonly',
                _: 'readonly',
            },
        },
        rules: {
            'no-debugger': 'off',
            'no-unused-vars': ['error', { caughtErrors: 'none' }],
        },
    },

    {
        ignores: [
            'node_modules',
            'dist',
            'build',
            'vendor',
            'coverage',
            'test/e2e/reports',
        ],
    },
];
