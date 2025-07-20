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
  func_call: 3,
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
        // $._data_type,
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
          optional($._function_return_conditions),
        ),
        field("func_body", $._statement_block),
      ),

    _function_return_conditions: ($) => (
      seq(
        $._bind_type,
        optional(
          repeat($._function_return_modifier),
        ),
      )
    ),

    _function_return_modifier: ($) =>
      seq(
        choice(
          $._return_post,
          $._return_pre,
        ),
        ";",
      ),

    _return_post: ($) =>
      seq(
        "ensures",
        $._value,
      ),

    _return_pre: ($) =>
      seq(
        "requires",
        $._value,
      ),

    _function_call: ($) =>
      prec.left(prec(
        PREC.func_call,
        seq(
          field("function_id", $.identifier),
          "(",
          repeat(
            seq(
              choice(
                seq(
                  optional(
                    choice(
                      field("ref_param", "ref"),
                      field("rest_param", "..."),
                    ),
                  ),
                  $.identifier,
                  $._bind_type,
                ),
                seq($.identifier, "=", $._value),
                seq($._value),
              ),
              optional(","),
            ),
          ),
          ")",
          optional($._lambda_call),
        ),
      )),

    _lambda_call: ($) =>
      seq(
        optional($._bind_type),
        "=>",
        choice(
          $._value,
          $._statement_block,
        ),
      ),

    _parameters: ($) =>
      seq(
        "(",
        repeat(
          seq(
            optional(
              choice(
                field("ref_param", "ref"),
                field("rest_param", "..."),
              ),
            ),
            $.identifier,
            $._bind_type,
            field(
              "def_val",
              optional(
                seq(
                  "=",
                  $._value,
                ),
              ),
            ),
            optional(","),
          ),
        ),
        ")",
      ),

    _return: ($) =>
      seq(
        field("return_key", "return"),
        optional(
          $._value,
        ),
        ";",
      ),

    _statement_block: ($) =>
      seq(
        "{",
        repeat($._statement),
        "}",
      ),

    _statement: ($) =>
      seq(
        choice(
          $._definition,
          $._if_statement,
          $._assertion,
          $._variable,
          $._match,
          $._switch,
          $._return,
          $._debug,
          $._value,
        ),
      ),

    _namespace_def: ($) =>
      choice(
        seq(
          "declare",
          "namespace",
          field("namespace_id", $._namespace_id),
          ";",
        ),
        seq(
          "declare",
          "namespace",
          field("namespace_id", $._namespace_id),
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
          $._namespace_id,
          ";",
        ),
        seq(
          "using",
          $._namespace_id,
          "as",
          $._namespace_id,
          ";",
        ),
      ),

    _namespace_access: ($) =>
      seq(
        field("namespace_id", $._namespace_id),
        field("namespace_accessor", "::"),
        field("scoped_type", $._entity_id),
      ),

    _entity: ($) =>
      seq(
        field("keyword", "entity"),
        $._entity_ref,
      ),

    _entity_ref: ($) =>
      seq(
        field("entity_name", $._entity_id),
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
          $._entity_id,
          "{",
          $._value,
          "}",
        ),
      ),

    _field_block: ($) =>
      seq(
        "{",
        optional(
          repeat(
            field("field", $._field),
          ),
        ),
        "}",
      ),

    _enum: ($) =>
      seq(
        field("enum_key", "enum"),
        field("enum_name", $._entity_id),
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
        field("enum_name", $._entity_id),
        field("enum_accessor", "#"),
        field("enum_access", $.identifier),
      ),

    _match: ($) =>
      seq(
        "match",
        "(",
        $.identifier,
        ")",
        "{",
        repeat(seq($._match_block, optional("|"))),
        "}",
      ),

    _match_block: ($) =>
      seq(
        $._type,
        "=>",
        $._statement_block,
      ),

    _switch: ($) =>
      seq(
        "switch",
        "(",
        $.identifier,
        ")",
        "{",
        repeat(seq($._switch_block, optional("|"))),
        "}",
      ),

    _switch_block: ($) =>
      seq(
        $._value,
        "=>",
        $._statement_block,
      ),

    _return_access: ($) => "$return",

    _ref_val: ($) =>
      seq(
        "ref",
        $.identifier,
      ),

    _ITest: ($) =>
      seq(
        optional(repeat("@")),
        choice($._some, $._none_test),
      ),

    _some: ($) =>
      choice(
        "<Some>",
        seq(optional("!"), "some"),
        //TODO: Find something better for this.
        seq("some(", $._value, ")"),
      ),

    _none_test: ($) => prec(-1, seq(optional("!"), "none")),

    _if_start: ($) =>
      seq(
        "if",
        "(",
        choice(
          $._assignment,
          $._value,
        ),
        ")",
        optional(
          $._ITest,
        ),
      ),

    _if_statement: ($) =>
      seq(
        $._if_start,
        $._if_statement_block,
        optional(seq(
          "else",
          $._if_statement_block,
        )),
      ),

    _if_statement_block: ($) =>
      seq(
        "{",
        choice(
          repeat(
            $._statement,
          ),
          ";",
        ),
        "}",
      ),

    _if_expression: ($) =>
      seq(
        $._if_start,
        "then",
        $._value,
        "else",
        $._value,
      ),

    _value: ($) =>
      prec(
        PREC.primary,
        choice(
          $.identifier,
          $._enum_access,
          $._return_access,
          $.num_lit,
          $.boolean_lit,
          $.none_lit,
          $._entity_ref,
          $._function_call,
          $._entity_access,
          $._binary_operation,
          $._if_expression,
          $._boolean_expression,
          $._constructors,
          $._elist,
          $._ref_val,
          $._value_expression,
          $._ITest,
          $._strings,
        ),
      ),

    _value_expression: ($) =>
      prec(
        2,
        seq(
          "(",
          $._value,
          ")",
        ),
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
        field(
          "var_id",
          $.identifier,
        ),
        optional($._bind_type),
        "=",
        field("var_value", $._value),
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
        $.identifier,
        optional($._bind_type),
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
      field(
        "result_types",
        seq(
          "Result",
          "<",
          $._type,
          ",",
          $._type,
          ">",
        ),
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
        field("result_val", $._value),
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

    _list: ($) =>
      seq(
        "List",
        "<",
        $._type,
        ">",
      ),

    _lambda_type: ($) =>
      seq(
        "fn",
        "(",
        optional(
          choice(
            field("ref_param", "ref"),
            field("rest_param", "..."),
          ),
        ),
        $._type,
        ")",
        "->",
        $._type,
      ),

    _type: ($) =>
      choice(
        ...PRIMITIVE_ENTITY_TYPE_NAMES,
        $._option,
        $._lambda_type,
        $._list,
        $._namespace_access,
        $._result,
        $._map_entry,
        $._entity_id,
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
        $._and_expression,
        $._or_expression,
        $._iff_expression,
        $._implies_expression,
      ),

    _and_expression: ($) =>
      prec.left(
        PREC.and,
        choice(
          seq(
            $._value,
            "&&",
            $._value,
          ),
          seq(
            "/\\",
            "(",
            repeat(seq($._value, optional(","))),
            ")",
          ),
        ),
      ),

    _or_expression: ($) =>
      prec.left(
        PREC.or,
        choice(
          seq(
            $._value,
            "||",
            $._value,
          ),
          seq(
            "\\/",
            "(",
            repeat(seq($._value, optional(","))),
            ")",
          ),
        ),
      ),

    _iff_expression: ($) =>
      prec.left(
        PREC.composite_literal,
        seq(
          $._value,
          "<==>",
          $._value,
        ),
      ),

    _implies_expression: ($) =>
      prec.left(
        PREC.composite_literal,
        seq(
          $._value,
          "==>",
          $._value,
        ),
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

    identifier: ($) => /[$]?[_a-zA-Z][_a-zA-Z0-9]*/,
    _namespace_id: ($) => alias($.identifier, $.namespace_id),
    _entity_id: ($) => alias($.identifier, $.entity_id),
    none_lit: ($) => prec(1, "none"),
    boolean_lit: ($) => choice("true", "false"),
    num_lit: ($) =>
      choice(
        /[+]?[0-9]*[nN]/,
        /[+-]?[0-9]*[iI]/,
        /[+-]?[0-9]\.[0-9]f/,
        /[+-]?[0-9]\.0d|[+-]?[0-9]\.[0-9]*0+d{2}/,
        /-?[0-9]+\/[1-9][0-9]*R/,
        /[+-]?[0-9]+(?:\.[0-9]+)?lat[+-]?[0-9]+(?:\.[0-9]+)?long/,
        /[+-]?[0-9]+(?:\.[0-9]+)?[+-]?[0-9]+(?:\.[0-9]+)?j/,
      ),
    _strings: ($) => choice($.string, $.cstring),
    string: ($) => /"(?:[^%"\\]|%.)*"/u,
    cstring: ($) => /'(?:[ !-$/&-\[\]-~]|%.)*'/,
  },
});
