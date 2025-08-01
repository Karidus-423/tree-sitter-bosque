/**
 * @file n/a
 * @author Kennett Puerto <kennettdev1@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
//

const PREC = {
  PAREN_DECLARATOR: -10,
  ASSIGNMENT: -2,
  CONDITIONAL: -1,
  DEFAULT: 0,
  LOGICAL_OR: 1,
  LOGICAL_AND: 2,
  INCLUSIVE_OR: 3,
  EXCLUSIVE_OR: 4,
  BITWISE_AND: 5,
  EQUAL: 6,
  RELATIONAL: 7,
  OFFSETOF: 8,
  SHIFT: 9,
  ADD: 10,
  MULTIPLY: 11,
  CAST: 12,
  SIZEOF: 13,
  UNARY: 14,
  CALL: 15,
  FIELD: 16,
  SUBSCRIPT: 17,
};

module.exports = grammar({
  name: "bosque",

  rules: {
    source_file: ($) => repeat($._components),

    _components: ($) =>
      choice(
        $.namespace,
        // $.type,
        $._object,
        $.function_definition,
        $._expression,
        $._statement,
      ),

    namespace: ($) =>
      seq(
        "declare namespace",
        $._namespace_id,
        choice(
          ";",
          $.namespace_import,
        ),
      ),
    namespace_import: ($) =>
      seq(
        "{",
        repeat(choice(
          $._namespace_import_simple,
          $._namespace_import_with_alias,
        )),
        "}",
      ),
    _namespace_import_simple: ($) => seq("using", $._namespace_id, ";"),
    _namespace_import_with_alias: ($) =>
      seq("using", $._namespace_id, "as", $._namespace_id, ";"),

    function_definition: ($) =>
      seq(
        "function",
        $._function_signature,
      ),
    _function_signature: ($) =>
      seq(
        $._function_id,
        $.function_parameters,
        optional($.function_return_parameters),
        $.function_body,
      ),
    function_parameters: ($) =>
      seq(
        "(",
        repeat(
          seq(
            $.identifier,
            ":",
            $._type,
            optional(","),
          ),
        ),
        ")",
      ),
    function_return_parameters: ($) =>
      seq(
        ":",
        $._type,
      ),
    function_body: ($) =>
      seq(
        "{",
        repeat($._statement),
        $.return_statement,
        "}",
      ),

    // type: ($) => seq(),

    _object: ($) =>
      choice(
        $.entity,
        $.enum,
      ),

    entity: ($) => seq("entity", $._entity_id, $._entity_block),
    _entity_block: ($) =>
      seq(
        "{",
        optional(repeat($._entity_field)),
        "}",
      ),
    _entity_field: ($) =>
      choice(
        $._entity_method,
        $._entity_member,
      ),
    _entity_method: ($) => seq("ref", "method", $._function_signature),
    _entity_member: ($) =>
      seq(
        "field",
        $.identifier,
        ":",
        $._type,
        ";",
      ),
    _entity_access: ($) =>
      prec(
        PREC.FIELD,
        seq(
          $._entity_id,
          ".",
          choice($.entity_method_call, $.entity_member_access),
        ),
      ),
    entity_member_access: ($) => prec(PREC.FIELD, seq($.identifier)),
    entity_method_call: ($) =>
      prec(PREC.CALL, seq($._function_id, $.function_parameters)),

    enum: ($) => seq("enum", $._entity_id, $._enum_block),
    _enum_block: ($) =>
      seq(
        "{",
        optional(repeat($._enum_field)),
        "}",
      ),
    _enum_field: ($) => seq($._enum_member, optional(",")),

    _statement: ($) =>
      choice(
        $.expression_statement,
        $.variable_statement,
        $.return_statement,
      ),
    expression_statement: ($) => seq($._expression_not_binary, ";"),
    variable_statement: ($) => seq($.variable_expression, ";"),
    return_statement: ($) => seq("return", optional($._expression), ";"),

    //TODO: Multi assign variables
    variable_expression: ($) =>
      seq(
        choice("let", "var"),
        $.variable_assignment,
      ),

    variable_assignment: ($) =>
      seq(
        $.identifier,
        optional(seq(":", $._type)),
        optional(","),
      ),

    _assignment_left_expression: ($) =>
      choice(
        $.identifier,
        $.parenthesized_expression,
        $.variable_expression,
        $.variable_assignment,
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq(
          field("left", $._assignment_left_expression),
          field("operator", choice("+=", "-=", "=")),
          field("right", $._expression),
        ),
      ),

    _expression: ($) =>
      choice(
        $._expression_not_binary,
        $.binary_expression,
        $._compound_expression,
      ),
    _expression_not_binary: ($) =>
      choice(
        $.num_lit,
        $._strings,
        $.true_lit,
        $.false_lit,
        $.none_lit,
        $.identifier,
        $.unary_expression,
        $.parenthesized_expression,
        $.enum_access,
        $._entity_access,
        $.key_comparator,
        $.elist,
        $.assignment_expression,
      ),
    parenthesized_expression: ($) =>
      seq(
        "(",
        $._expression,
        ")",
      ),
    unary_expression: ($) =>
      prec.left(
        PREC.UNARY,
        seq(
          field("unary_type", choice("!", "+", "-")),
          field("unary_target", $._expression),
        ),
      ),
    key_comparator: ($) =>
      seq(
        "KeyComparator::",
        choice("equal", "less"),
        "<",
        $._type,
        ">",
        "(",
        $._expression,
        ",",
        $._expression,
        ")",
      ),
    _compound_expression: ($) =>
      choice(
        $.compound_and,
        $.compound_or,
      ),
    compound_and: ($) =>
      prec.left(
        PREC.LOGICAL_AND,
        seq(
          "/\\",
          "(",
          repeat(
            seq(
              $._expression,
              optional(","),
            ),
          ),
          ")",
        ),
      ),
    compound_or: ($) =>
      prec.left(
        PREC.LOGICAL_OR,
        seq(
          "\\/",
          "(",
          repeat(
            seq(
              $._expression,
              optional(","),
            ),
          ),
          ")",
        ),
      ),
    enum_access: ($) => seq($._entity_id, "#", $._enum_member),
    // (|1i, true|)
    elist: ($) =>
      seq(
        "(|",
        repeat(seq($._expression, optional(","))),
        "|)",
      ),

    binary_expression: ($) => {
      const table = [
        ["+", PREC.ADD],
        ["-", PREC.ADD],
        ["*", PREC.MULTIPLY],
        ["//", PREC.MULTIPLY],
        ["%", PREC.MULTIPLY],
        ["||", PREC.LOGICAL_OR],
        ["&&", PREC.LOGICAL_AND],
        ["|", PREC.INCLUSIVE_OR],
        ["^", PREC.EXCLUSIVE_OR],
        ["&", PREC.BITWISE_AND],
        ["===", PREC.EQUAL],
        ["!==", PREC.EQUAL],
        ["==", PREC.EQUAL],
        ["!=", PREC.EQUAL],
        [">", PREC.RELATIONAL],
        [">=", PREC.RELATIONAL],
        ["<=", PREC.RELATIONAL],
        ["==>", PREC.RELATIONAL],
        ["<==>", PREC.RELATIONAL],
        ["<", PREC.RELATIONAL],
        ["<<", PREC.SHIFT],
        [">>", PREC.SHIFT],
      ];

      return choice(...table.map(([operator, precedence]) => {
        return prec.left(
          precedence,
          seq(
            field("left", $._expression),
            // @ts-ignore
            field("operator", operator),
            field("right", $._expression),
          ),
        );
      }));
    },

    identifier: ($) => /[$]?[_a-zA-Z][_a-zA-Z0-9]*/,
    this: ($) => seq("this"),
    _namespace_id: ($) => alias($.identifier, $.namespace_id),
    _entity_id: ($) => alias($.identifier, $.entity_id),
    _function_id: ($) => alias($.identifier, $.function_id),
    _enum_member: ($) => alias($.identifier, $.enum_member),
    type_id: ($) => alias($.identifier, $.type_id),
    none_lit: (_) => token("none"),
    true_lit: (_) => token("true"),
    false_lit: (_) => token("false"),
    num_lit: ($) =>
      choice(
        /[+-]?[0-9]*[iI]/,
        /[+-]?[0-9]\.[0-9]f/,
        /[+-]?[0-9]\.0d|[+-]?[0-9]\.[0-9]*0+d{2}/,
        /[+-]?[0-9]+(?:\.[0-9]+)?lat[+-]?[0-9]+(?:\.[0-9]+)?long/,
        /[+-]?[0-9]+(?:\.[0-9]+)?[+-]?[0-9]+(?:\.[0-9]+)?j/,
        /[+]?[0-9]*[nN]/,
        /-?[0-9]+\/[1-9][0-9]*R/,
      ),
    _strings: ($) => choice($.string, $.cstring),
    string: ($) => /"(?:[^%"\\]|%.)*"/u,
    cstring: ($) => /'(?:[ !-$/&-\[\]-~]|%.)*'/,

    _type: ($) =>
      choice(
        $._entity_id,
        $.primitive_type,
      ),

    primitive_type: ($) =>
      token(choice(
        "None",
        "Bool",
        "Nat",
        "Int",
        "BigInt",
        "BigNat",
        "Rational",
        "Float",
        "Decimal",
        "DecimalDegree",
        "LatLongCoordinate",
        "Complex",
        "ByteBuffer",
        "UUIDv4",
        "UUIDv7",
        "SHAContentHash",
        "TZDateTime",
        "TAITime",
        "PlainDate",
        "PlainTime",
        "LogicalTime",
        "ISOTimestamp",
        "DeltaDateTime",
        "DeltaSeconds",
        "DeltaLogicalTime",
        "DeltaISOTimestamp",
        "CChar",
        "UnicodeChar",
        "CCharBuffer",
        "UnicodeCharBuffer",
        "String",
        "CString",
        "Regex",
        "CRegex",
        "PathRegex",
        "Path",
        "PathItem",
        "Glob",
      )),
  },
});
