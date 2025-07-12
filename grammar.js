/**
 * @file n/a
 * @author Kennett Puerto <kennettdev1@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
//

const PREC = {
  primary: 7,
  unary: 6,
  multiplicative: 5,
  additive: 4,
  comparative: 3,
  and: 2,
  or: 1,
  composite_literal: -1,
};

const PRIMITIVE_ENTITY_TYPE_NAMES = [
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
];

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
        $._statement,
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

    _function_call: ($) =>
      prec(
        2,
        seq(
          field("function_id", $.identifier),
          "(",
          repeat(
            seq(
              choice(
                seq($.identifier, "=", $._value),
                seq($._value),
              ),
              optional(","),
            ),
          ),
          ")",
        ),
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
        $._debug,
        $._value,
      ),

    _namespace_def: ($) =>
      choice(
        seq(
          "declare",
          "namespace",
          field("namespace_id", $.namespace_id),
          ";",
        ),
        seq(
          "declare",
          "namespace",
          field("namespace_id", $.namespace_id),
          $._namespace_block,
        ),
      ),

    _namespace_block: ($) =>
      seq(
        "{",
        repeat(field("namespace_import", $._namespace_import)),
        "}",
      ),

    _namespace_import: ($) =>
      choice(
        seq(
          "using",
          $.namespace_id,
          ";",
        ),
        seq(
          "using",
          $.namespace_id,
          "as",
          $.namespace_id,
          ";",
        ),
      ),

    _namespace_access: ($) =>
      seq(
        field("namespace_id", $.namespace_id),
        field("namespace_accessor", "::"),
        field("scoped_type", $.object_id),
      ),

    _entity: ($) =>
      seq(
        field("keyword", "entity"),
        field("entity_name", $.object_id),
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
          $.object_id,
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
        field("enum_name", $.object_id),
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
        field("enum_name", $.object_id),
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
        $._function_call,
        $._entity_access,
        $._binary_operation,
        $._boolean_expression,
        $._constructors,
        $._elist,
        "false",
        "true",
        "none",
      ),

    _elist: ($) =>
      seq(
        "(",
        "|",
        repeat1(seq(
          $._value,
          optional(","),
        )),
        "|",
        ")",
        ".",
        //TODO: What should be here?
        "0",
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

    _debug: ($) =>
      seq(
        field("debug_keyword", "_debug"),
        field("debug_target", $._value),
        ";",
      ),

    _constructors: ($) =>
      choice(
        $._some_constructor,
        $._result_constructor,
        $._map_constructor,
      ),

    _map_entry: ($) =>
      seq(
        "MapEntry",
        "<",
        $._type,
        ",",
        $._type,
        ">",
      ),

    _map_constructor: ($) =>
      seq(
        $._map_entry,
        "{",
        $._value,
        ",",
        $._value,
        "}",
      ),

    _result: ($) =>
      seq(
        "Result",
        "<",
        $._type,
        ",",
        $._type,
        ">",
      ),

    _result_constructor: ($) =>
      seq(
        $._result,
        "::",
        choice(
          "Ok",
          "Fail",
        ),
        "{",
        $._value,
        "}",
      ),

    _some_constructor: ($) =>
      seq(
        "Some",
        "<",
        $._type,
        ">",
        "{",
        $._value,
        "}",
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
        ...PRIMITIVE_ENTITY_TYPE_NAMES,
        $._option,
        $.object_id,
        $._namespace_access,
        $._result,
        $._map_entry,
        $.namespace_id,
      ),

    _bind_type: ($) =>
      seq(
        ":",
        field("type", $._type),
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
      choice(
        $._addition,
        $._subtraction,
        $._multiplication,
        $._division,
      ),

    _boolean_expression: ($) =>
      choice(
        $._greater_than,
        $._less_than,
        $._compare,
        $._equality,
        $._compare,
        $._key_comparator,
      ),

    _equality: ($) =>
      prec(
        PREC.comparative,
        prec.left(choice(
          seq(
            $._value,
            "==",
            $._value,
          ),
          seq(
            $._value,
            "!=",
            $._value,
          ),
        )),
      ),

    _compare: ($) =>
      prec(
        PREC.comparative,
        prec.left(choice(
          seq(
            $._value,
            "===",
            $._value,
          ),
          seq(
            $._value,
            "!==",
            $._value,
          ),
        )),
      ),

    _key_comparator: ($) =>
      seq(
        "KeyComparator",
        "::",
        choice("equal", "less"),
        "<",
        $._type,
        ">",
        "(",
        $._value,
        ",",
        $._value,
        ")",
      ),

    _less_than: ($) =>
      prec(
        2,
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
      ),

    _greater_than: ($) =>
      prec(
        2,
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
      ),

    _addition: ($) =>
      prec(
        PREC.additive,
        prec.left(seq(
          $._value,
          "+",
          $._value,
        )),
      ),

    _subtraction: ($) =>
      prec(
        PREC.additive,
        prec.left(seq(
          $._value,
          "-",
          $._value,
        )),
      ),

    _multiplication: ($) =>
      prec(
        PREC.multiplicative,
        prec.left(seq(
          $._value,
          "*",
          $._value,
        )),
      ),

    _division: ($) =>
      prec(
        PREC.multiplicative,
        prec.left(seq(
          $._value,
          "//",
          $._value,
        )),
      ),

    //TOKENS
    ///////////////////////////////////////////
    //Try to find a way to differentiate between all of these.
    object_id: ($) => /[A-Z][A-Za-z]*/,
    namespace_id: ($) => /[A-Z][_a-zA-Z0-9]+/,
    identifier: ($) => /[$]?[_a-zA-Z][_a-zA-Z0-9]*/,
    num_lit: ($) => choice(/[+]?[0-9]*[nN]/, /[+-]?[0-9]*[iI]/),
  },
});
