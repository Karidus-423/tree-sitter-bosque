/**
 * @file n/a
 * @author Kennett Puerto <kennettdev1@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: "bosque",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
