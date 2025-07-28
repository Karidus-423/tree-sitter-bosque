/**
 * @file n/a
 * @author Kennett Puerto <kennettdev1@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
//

const PREC = {
  cast: 8,
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

  // conflicts: ($) => [
  //   [$._op_value, $._boolean_val],
  // ],

  rules: {
    source_file: ($) => repeat($._components),

    _components: ($) =>
      choice(
        $._namespace_def,
        $._enum_def,
        $._function_def,
        $._entity_def,
        $._statement,
        $._type_def,
        $._datatype_def,
      ),

    //TODO: Are there function declarations?
    _function_def: ($) =>
      seq(
        optional("public"),
        field("func_keyword", "function"),
        field("func_name", $.identifier),
        field("params", $._parameters),
        field(
          "return_type",
          optional($._function_return_conditions),
        ),
        field("func_body", $._statement_block),
      ),

    _parameters: ($) =>
      seq(
        "(",
        repeat(
          seq(
            choice(
              $._function_param_simple,
              $._function_param_value,
            ),
            optional(","),
          ),
        ),
        ")",
      ),

    _function_param_simple: ($) =>
      seq(
        $.identifier,
        $._bind_type,
      ),

    _function_param_value: ($) =>
      seq(
        $.identifier,
        $._bind_type,
        "=",
        $._value,
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
      prec.left(seq(
        field("function_id", $.identifier),
        field("call_start", "("),
        field("function_args", optional(repeat($._function_arguments))),
        field("call_end", ")"),
      )),

    // return foo(1i, x = 2i);
    _function_arguments: ($) =>
      seq(
        choice(
          $._value,
          $._assignment,
        ),
        optional(","),
      ),

    // fn(x) => x + 1i
    // fn(x: Int): Int => x + 1i;
    _lambda_call: ($) =>
      seq(
        "fn",
        "(",
        optional(repeat($._lambda_arguments)),
        ")",
        optional($._bind_type),
        "=>",
        choice(
          $._value,
          $._statement_block,
        ),
      ),

    _lambda_arguments: ($) =>
      prec.left(seq(
        $.identifier,
        optional($._bind_type),
        optional(","),
      )),

    _return: ($) =>
      seq(
        field("return_key", "return"),
        optional(repeat(
          seq(
            $._value,
            optional(","),
          ),
        )),
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
          $._void_statements,
          $._iff_expression,
          $._implies_expression,
        ),
      ),

    _void_statements: ($) =>
      seq(
        choice(
          $._function_call,
          $._entity_update,
          $._member_access,
        ),
        ";",
      ),

    _namespace_def: ($) =>
      choice(
        seq(
          "declare",
          "namespace",
          field("namespace_id", $._namespace_id),
          choice(
            ";",
            $._namespace_block,
          ),
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
          choice(
            ";",
            field("rename", seq("as", $._namespace_id, ";")),
          ),
        ),
      ),

    _namespace_access: ($) =>
      seq(
        field("namespace_id", $._namespace_id),
        field("namespace_accessor", "::"),
        field("scoped_import", $.entity_id),
      ),

    _entity_def: ($) =>
      seq(
        field("keyword", "entity"),
        field("entity_name", $.entity_id),
        seq(
          "{",
          optional(repeat(
            choice(
              field("field", $._field),
              field("method_def", $._method_def),
            ),
          )),
          "}",
        ),
      ),

    _method_def: ($) =>
      seq(
        optional("ref"),
        "method",
        field("method_id", $.identifier),
        field("params", $._parameters),
        field(
          "return_type",
          optional($._function_return_conditions),
        ),
        field("func_body", $._statement_block),
      ),

    _datatype_def: ($) =>
      seq(
        "datatype",
        $.entity_id,
        optional($.type_cast),
        optional($._datatype_def_fields),
        optional($._datatype_def_inherit),
        ";",
      ),

    _datatype_def_fields: ($) =>
      seq(
        "using",
        "{",
        optional(repeat(
          seq(
            $._field,
            optional($._invariant),
          ),
        )),
        "}",
      ),

    _datatype_def_inherit: ($) =>
      seq(
        "of",
        repeat1(seq(
          $.entity_id,
          "{",
          optional(repeat($._field)),
          "}",
          optional("|"),
        )),
      ),

    _invariant: ($) =>
      seq(
        "invariant",
        $._boolean_expression,
        ";",
      ),

    _self_access: ($) =>
      seq(
        "$",
        $.identifier,
      ),

    _entity_ref: ($) =>
      seq(
        $.entity_id,
        $.type_cast,
        field("field_block", $._entity_ref_block),
      ),

    _entity_ref_block: ($) =>
      seq(
        "{",
        optional(repeat(
          seq(
            choice(
              $._value,
              $._assignment,
            ),
            optional(","),
          ),
        )),
        "}",
      ),

    _entity_update: ($) =>
      prec.left(seq(
        $.identifier,
        "[",
        $._assignment,
        "]",
      )),

    _accessors: ($) =>
      choice(
        $.identifier,
        $.this,
        $._function_call,
        $._entity_update,
        $._entity_ref,
      ),

    _member_access: ($) =>
      prec.right(seq(
        $._accessors,
        ".",
        choice(
          $.identifier,
          $._function_call,
          $._entity_update,
        ),
      )),

    _enum_def: ($) =>
      seq(
        field("enum_key", "enum"),
        field("enum_name", $.entity_id),
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
        field("enum_name", $.entity_id),
        field("enum_accessor", "#"),
        field("enum_access", $.identifier),
      ),

    _match: ($) =>
      seq(
        "match",
        "(",
        $.identifier,
        ")",
        optional(repeat("@")),
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
        choice(
          $._value,
        ),
        "=>",
        $._statement_block,
      ),

    _return_access: ($) => "$return",

    _ITest: ($) =>
      seq(
        optional(repeat(choice("@", "!"))),
        choice($._some, $.none_lit),
      ),

    _some: ($) =>
      choice(
        "<Some>",
        "some",
        seq("some(", $._value, ")"),
      ),

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

    _type_cast_value: ($) =>
      prec(
        PREC.cast,
        seq(
          choice(
            $.identifier,
            $._boolean_expression,
            $.num_lit,
            $._strings,
          ),
          $.type_cast,
        ),
      ),

    type_cast: ($) =>
      seq(
        "<",
        $._type,
        ">",
      ),

    _value: ($) =>
      prec.left(
        PREC.primary,
        choice(
          $.identifier,
          $.num_lit,
          $.none_lit,
          $._strings,
          $._enum_access,
          $._return_access,
          $._member_access,
          $._constructors,
          $._elist,
          $._entity_ref,
          $._entity_update,
          $._lambda_call,
          $._function_call,
          $._boolean_expression,
          $._binary_operation,
          $._type_cast_value,
        ),
      ),

    _elist: ($) =>
      seq(
        "(|",
        repeat1(seq(
          $._value,
          optional(","),
        )),
        "|)",
        optional(seq(".", "0")),
      ),

    _variable: ($) =>
      choice(
        $._var_assign,
        $._var_reassign,
      ),

    _var_assign: ($) =>
      seq(
        "var",
        prec.left(repeat(
          seq(
            $.identifier,
            optional($._bind_type),
            optional(","),
          ),
        )),
        optional(seq(
          "=",
          repeat(seq($._value, optional(","))),
        )),
        ";",
      ),

    _var_reassign: ($) =>
      seq(
        repeat(
          seq(
            $.identifier,
            optional(","),
          ),
        ),
        "=",
        repeat(seq($._value, optional(","))),
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
      seq(
        "assert",
        choice(
          seq(
            $._value,
            ";",
          ),
          seq(
            "(",
            $._value,
            ")",
            ";",
          ),
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
        $._type,
        ")",
        "->",
        $._type,
      ),

    _type_def: ($) =>
      seq(
        "type",
        $.type_id,
        "=",
        $._type,
        ";",
      ),

    _type: ($) =>
      choice(
        ...PRIMITIVE_ENTITY_TYPE_NAMES,
        $.entity_id,
        $._option,
        $._lambda_type,
        $._list,
        $._namespace_access,
        $._result,
        $._map_entry,
        $._elist_params,
      ),

    _elist_params: ($) =>
      seq(
        "(",
        "|",
        optional(repeat(
          seq(
            $._type,
            optional(","),
          ),
        )),
        "|",
        ")",
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

    _op_value: ($) =>
      prec(
        PREC.unary,
        choice(
          $.identifier,
          $.num_lit,
          $._strings,
          $._return_access,
          $._member_access,
          $._function_call,
          $._lambda_call,
        ),
      ),

    _binary_operation: ($) =>
      choice(
        $._addition,
        $._subtraction,
        $._multiplication,
        $._division,
      ),

    _boolean_expression: ($) =>
      choice(
        $._boolean_val,
        $._greater_than,
        $._less_than,
        $._equality,
        $._compare,
        $._key_comparator,
        $._and_expression,
        $._or_expression,
      ),

    _boolean_val: ($) =>
      choice(
        $.identifier,
        $._self_access,
        $._function_call,
        $.boolean_lit,
        $._member_access,
        $._return_access,
        $._lambda_call,
      ),

    _and_expression: ($) =>
      prec.left(
        PREC.and,
        choice(
          seq(
            $._boolean_expression,
            "&&",
            $._boolean_expression,
          ),
          seq(
            "/\\",
            "(",
            repeat(seq($._boolean_expression, optional(","))),
            ")",
          ),
        ),
      ),

    _or_expression: ($) =>
      prec.left(
        PREC.or,
        choice(
          seq(
            $._boolean_expression,
            "||",
            $._boolean_expression,
          ),
          seq(
            "\\/",
            "(",
            repeat(seq($._boolean_expression, optional(","))),
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
            $._op_value,
            "==",
            $._op_value,
          ),
          seq(
            $._op_value,
            "!=",
            $._op_value,
          ),
        )),
      ),

    _compare: ($) =>
      prec(
        PREC.comparative,
        prec.left(choice(
          seq(
            $._op_value,
            "===",
            $._op_value,
          ),
          seq(
            $._op_value,
            "!==",
            $._op_value,
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
            $._op_value,
            ">",
            $._op_value,
          ),
          seq(
            $._op_value,
            ">=",
            $._op_value,
          ),
        )),
      ),

    _greater_than: ($) =>
      prec(
        2,
        prec.left(choice(
          seq(
            $._op_value,
            "<",
            $._op_value,
          ),
          seq(
            $._op_value,
            "<=",
            $._op_value,
          ),
        )),
      ),

    _addition: ($) =>
      prec(
        PREC.additive,
        prec.left(seq(
          $._op_value,
          "+",
          $._op_value,
        )),
      ),

    _subtraction: ($) =>
      prec(
        PREC.additive,
        prec.left(seq(
          $._op_value,
          "-",
          $._op_value,
        )),
      ),

    _multiplication: ($) =>
      prec(
        PREC.multiplicative,
        prec.left(seq(
          $._op_value,
          "*",
          $._op_value,
        )),
      ),

    _division: ($) =>
      prec(
        PREC.multiplicative,
        prec.left(seq(
          $._op_value,
          "//",
          $._op_value,
        )),
      ),

    //TOKENS
    ///////////////////////////////////////////
    //Try to find a way to differentiate between all of these.

    identifier: ($) => seq(optional("ref"), /[_a-zA-Z][_a-zA-Z0-9]*/),
    this: ($) => seq(optional("ref"), "this"),
    _namespace_id: ($) => alias($.identifier, $.namespace_id),
    entity_id: ($) => alias($.identifier, $.entity_id),
    type_id: ($) => alias($.identifier, $.type_id),
    none_lit: ($) => prec(1, "none"),
    boolean_lit: ($) => choice("true", "false"),
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
  },
});
