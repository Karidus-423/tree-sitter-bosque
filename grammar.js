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
        $._enum,
      ),

    //TODO: Are there function declarations?
    _function_def: ($) =>
      seq(
        optional("public"),
        "function",
        field("func_name", $.identifier),
        field("params", $._parameters),
        field(
          "return_type",
          optional(seq(
            ":",
            $._type,
          )),
        ),
        field("func_body", $._statement_block),
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
        optional(
          $._value,
        ),
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
        field("namespace_id", $.namespace_tok),
        ";",
      ),

    _entity: ($) =>
      seq(
        field("keyword", "entity"),
        field("entity_name", $.identifier),
        field("field_block", $._field_block),
      ),

    _field_block: ($) =>
      seq(
        "{",
        repeat(field("field", $._field)),
        "}",
      ),

    _accessor: ($) =>
      seq(
        $.identifier,
        ".",
        $.identifier,
      ),

    _enum: ($) =>
      seq(
        field("enum_key", "enum"),
        field("enum_name", $.enum_tok),
        field("enum_values", $._enum_block),
      ),

    _enum_block: ($) =>
      seq(
        "{",
        optional(repeat($._enum_value)),
        "}",
      ),

    _enum_value: ($) =>
      seq(
        $.identifier,
        optional(","),
      ),

    _value: ($) =>
      choice(
        $._expression,
        $.identifier,
        $.num_lit,
        $._accessor,
      ),

    _field: ($) =>
      seq(
        field("keyword", "field"),
        $._bind_id_to_type,
        ";",
      ),

    _assertion: ($) =>
      seq(
        "assert",
        $._expression,
        $._definition,
        ";",
      ),

    _definition: ($) =>
      seq(
        optional(
          "let",
        ),
        optional(choice(
          $._bind_id_to_type,
          $.identifier,
        )),
        "=",
        $._addition,
        ";",
      ),

    ///////////Should be able to have a calculator here/////////////////////////
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
        $._value,
        "+",
        $._value,
      ),
    ///////////////////////////////////////////

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
        "BigNat",
        $.namespace_tok,
      ),

    num_lit: ($) => /[0-9]*[iInN]/,
    enum_tok: ($) => /[A-Z][A-Za-z]*/,
    namespace_tok: ($) => /[A-Z][a-z]*/,
    identifier: ($) => /[$]?[_a-zA-Z][_a-zA-Z0-9]*/,
    number: ($) => /\d+/,
  },
});
