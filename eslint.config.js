'use strict'

const standard = require('eslint-config-standard')
module.exports = [
  standard,
  {
    extends: ["@hono/eslint-config", "plugin:prettier/recommended", "prettier","standard"],
    plugins: ["prettier"],
    rules: {
      "prettier/prettier": "error",
    }
  }
]