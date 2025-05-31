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
    source_file: ($) => repeat($._components),

    _components: ($) =>
      choice(
        $._namespace_def,
        $._entity,
        $._function_def,
      ),

    _function_def: ($) =>
      seq(
        optional("public"),
        "function",
        field("func_name", $.identifier),
        field("params", $._parameters),
        field(
          "return_type",
          seq(
            ":",
            field("bsq_prim", $._type),
          ),
        ),
        field("body", $._statement_block),
      ),

    _parameters: ($) =>
      seq(
        "(",
        repeat(
          seq($._bind_id_to_type, optional(",")),
        ),
        ")",
      ),

    _return: ($) =>
      seq(
        "return",
        $.identifier,
        ";",
      ),

    _statement_block: ($) =>
      seq(
        "{",
        repeat(choice(
          $._assertion,
        )),
        optional($._return),
        "}",
      ),

    _namespace_def: ($) =>
      seq(
        "declare",
        "namespace",
        field("name", $.namespace_tok),
        ";",
      ),

    _entity: ($) =>
      seq(
        field("token", "entity"),
        field("entity_name", $.namespace_tok),
        field("fields", $._field_block),
      ),

    _field_block: ($) =>
      seq(
        "{",
        repeat(
          $._field,
        ),
        "}",
      ),

    _assertion: ($) =>
      seq(
        "assert",
        $._expression,
        $._definition,
        ";",
      ),

    _field: ($) =>
      seq(
        "field",
        $._bind_id_to_type,
        ";",
      ),

    _definition: ($) =>
      seq(
        optional(
          "let",
        ),
        choice(
          $._bind_id_to_type,
          $.identifier,
        ),
        "=",
        $._addition,
        ";",
      ),

    _expression: ($) =>
      choice(
        $._greater_than,
        $._less_than,
      ),

    _less_than: ($) =>
      choice(
        seq(
          $.identifier,
          ">",
          $.identifier,
        ),
        seq(
          $.identifier,
          ">=",
          $.identifier,
        ),
      ),

    _greater_than: ($) =>
      choice(
        seq(
          $.identifier,
          "<",
          $.identifier,
        ),
        seq(
          $.identifier,
          "<=",
          $.identifier,
        ),
      ),

    _addition: ($) =>
      seq(
        $.identifier,
        "+",
        $.identifier,
      ),

    _bind_id_to_type: ($) =>
      seq(
        $.identifier,
        ":",
        field("bsq_prim", $._type),
      ),

    _type: ($) =>
      choice(
        "Int",
        "Nat",
        "CString",
        "String",
      ),

    namespace_tok: ($) => /[A-Z][a-z]*/,
    identifier: ($) => /[a-z]+/,
    number: ($) => /\d+/,
  },
});
