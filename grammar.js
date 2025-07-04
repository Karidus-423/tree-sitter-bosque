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
        $._enum,
        $._function_def,
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
          optional(
            $._bind_type,
          ),
        ),
        field("func_body", $._statement_block),
      ),

    _parameters: ($) =>
      seq(
        "(",
        repeat(
          seq($.identifier, $._bind_type, optional(",")),
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
        repeat($._statement),
        optional($._return),
        "}",
      ),

    _statement: ($) =>
      choice(
        $._definition,
        $._assertion,
        $._variable,
      ),

    _namespace_def: ($) =>
      seq(
        "declare",
        "namespace",
        field("namespace_id", $.namespace_id),
        ";",
      ),

    _entity: ($) =>
      seq(
        field("keyword", "entity"),
        field("entity_name", $.entity_id),
        field("field_block", $._field_block),
      ),

    _entity_update: ($) =>
      seq(
        $.identifier,
        "[",
        $._assignment,
        "]",
      ),

    _entity_access: ($) =>
      choice(
        seq(
          choice(
            $.identifier,
            $._entity_update,
          ),
          ".",
          $.identifier,
        ),
        seq(
          $.entity_id,
          "{",
          $._value,
          "}",
        ),
      ),

    _field_block: ($) =>
      seq(
        "{",
        repeat(field("field", $._field)),
        "}",
      ),

    _enum: ($) =>
      seq(
        field("enum_key", "enum"),
        field("enum_name", $.enum_id),
        field("enum_fields", $._enum_block),
      ),

    _enum_block: ($) =>
      seq(
        "{",
        optional(repeat($._enum_field)),
        "}",
      ),

    _enum_field: ($) =>
      seq(
        $.identifier,
        optional(","),
      ),

    _enum_access: ($) =>
      seq(
        field("enum_name", $.enum_id),
        field("enum_accessor", "#"),
        field("enum_access", $.identifier),
      ),

    _self_access: ($) =>
      seq(
        "$",
        $.identifier,
      ),

    _value: ($) =>
      choice(
        $._enum_access,
        $.identifier,
        $._self_access,
        $.num_lit,
        $._entity_access,
        $._binary_operation,
        $._boolean_expression,
        "none",
      ),

    _variable: ($) =>
      seq(
        "var",
        choice(
          $.identifier,
          optional($._bind_type),
        ),
        "=",
        $._value,
        ";",
      ),

    _field: ($) =>
      seq(
        field("keyword", "field"),
        $.identifier,
        $._bind_type,
        ";",
      ),

    _assertion: ($) =>
      choice(
        seq(
          "assert",
          optional(field("assert_tag", $.identifier)),
          $._value,
          ";",
        ),
        seq(
          "assert",
          "(",
          $._value,
          ")",
          ";",
        ),
      ),

    _definition: ($) =>
      seq(
        optional(
          "let",
        ),
        choice(
          $.identifier,
          seq(
            $.identifier,
            $._bind_type,
          ),
        ),
        "=",
        $._value,
        ";",
      ),

    _assignment: ($) =>
      seq(
        $.identifier,
        "=",
        $._value,
        optional(";"),
      ),

    _type: ($) =>
      choice(
        $._option,
        $.entity_id,
        $._namespace_access,
        $.namespace_id,
        "Int",
        "Nat",
        "CString",
        "String",
        "BigNat",
        "None",
      ),

    _bind_type: ($) =>
      seq(
        ":",
        field("type", $._type),
      ),

    _namespace_access: ($) =>
      seq(
        field("namespace_id", $.namespace_id),
        field("namespace_accessor", "::"),
        field("scoped_type", $.entity_id),
      ),

    _option: ($) =>
      seq(
        "Option",
        "<",
        $._type,
        ">",
      ),

    ///////////Should be able to have a calculator here/////////////////////////
    _binary_operation: ($) =>
      prec(
        2,
        choice(
          $._addition,
          $._subtraction,
          $._multiplication,
          $._division,
        ),
      ),

    _boolean_expression: ($) =>
      choice(
        $._greater_than,
        $._less_than,
        $._addition,
      ),

    _less_than: ($) =>
      prec.left(choice(
        seq(
          $._value,
          ">",
          $._value,
        ),
        seq(
          $._value,
          ">=",
          $._value,
        ),
      )),

    _greater_than: ($) =>
      prec.left(choice(
        seq(
          $._value,
          "<",
          $._value,
        ),
        seq(
          $._value,
          "<=",
          $._value,
        ),
      )),

    _addition: ($) =>
      prec.left(seq(
        $._value,
        "+",
        $._value,
      )),

    _subtraction: ($) =>
      prec.left(seq(
        $._value,
        "-",
        $._value,
      )),

    _multiplication: ($) =>
      prec.left(seq(
        $._value,
        "*",
        $._value,
      )),

    _division: ($) =>
      prec.left(seq(
        $._value,
        "//",
        $._value,
      )),

    //TOKENS
    ///////////////////////////////////////////

    num_lit: ($) => /[0-9]*[iInN]/,
    enum_id: ($) => /[A-Z][A-Za-z]*/,
    entity_id: ($) => /[A-Z][A-Za-z]*/,
    namespace_id: ($) => /[A-Z][a-z]*/,
    identifier: ($) => /[$]?[_a-zA-Z][_a-zA-Z0-9]*/,
  },
});
