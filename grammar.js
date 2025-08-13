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
  LAMBDA: 13,
  UNARY: 14,
  CALL: 15,
  FIELD: 16,
  SUBSCRIPT: 17,
  CAST: 18,
};

module.exports = grammar({
  name: "bosque",

  conflicts: ($) => [
    [$._concept_type, $._concrete_type],
    [$._expression_not_binary, $._entity_id],
    [$._strings, $._abstract_type],
    [$.type_cast_expression, $.binary_expression],
    [$._expression_not_binary, $._concrete_type],
    [$.type_cast_expression, $.unary_expression, $.binary_expression],
    [$.type_cast_expression, $.lambda_expression, $.binary_expression],
    [$.lambda_type, $.bind_regex],
    [$.elist_type, $.elist],
  ],

  rules: {
    source_file: ($) => repeat($._components),

    _components: ($) =>
      choice(
        $.comment,
        $.namespace,
        $.type_decl,
        $.entity,
        $.enum,
        $.const_decl,
        $.concept,
        $.function_definition,
        $.datatype,
        $._expression,
        $._statement,
      ),

    namespace: ($) =>
      seq(
        optional("declare"),
        "namespace",
        field("namespace_id", $.identifier),
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
    _namespace_import_simple: ($) => seq("using", $.identifier, ";"),
    _namespace_import_with_alias: ($) =>
      seq("using", $.identifier, "as", $.identifier, ";"),

    type_decl: ($) =>
      seq(
        "type",
        $._entity_id,
        "=",
        $._type,
        ";",
      ),

    function_definition: ($) =>
      seq(
        optional("public"),
        "function",
        $.function_signature,
      ),
    function_signature: ($) =>
      seq(
        field("function_id", $._object_id),
        $.function_parameters,
        optional($.function_return_parameters),
        $.function_body,
      ),
    function_parameters: ($) =>
      seq(
        "(",
        optional(repeat(seq($._function_param_signature, optional(",")))),
        ")",
      ),
    _function_param_signature: ($) =>
      seq(
        optional(choice("ref", "...")),
        $.identifier,
        ":",
        $._type,
        optional(seq("=", $._expression)),
      ),
    function_return_parameters: ($) =>
      seq(
        ":",
        $._type,
        optional(repeat(seq($._pre_post_conditions, ";"))),
      ),
    _pre_post_conditions: ($) =>
      choice(
        $.post_condition,
        $.pre_condition,
      ),
    pre_condition: ($) => seq("requires", $._expression),
    post_condition: ($) => seq("ensures", $._expression),
    function_body: ($) =>
      seq(
        "{",
        optional(repeat($._statement)),
        "}",
      ),

    concept: ($) =>
      seq(
        "concept",
        $._type,
        "{",
        optional(repeat($._entity_field)),
        "}",
      ),

    datatype: ($) =>
      seq(
        "datatype",
        $._object_id,
        optional($._inherit),
        optional($._datatype_block),
        "of",
        repeat(seq(
          $._entity_signature,
          optional("|"),
        )),
        optional($._datatype_constants),
        ";",
      ),
    _inherit: ($) =>
      seq(
        "provides",
        repeat(seq(
          $._concrete_type,
          optional(","),
        )),
      ),
    _datatype_block: ($) =>
      seq(
        "using",
        "{",
        optional(repeat($._entity_field)),
        "}",
      ),
    _datatype_constants: ($) =>
      seq(
        "&",
        "{",
        optional(repeat($._entity_field)),
        "}",
      ),

    const_decl: ($) =>
      seq(
        "const",
        $._variable_definition,
        optional(
          seq(
            "=",
            repeat($._variable_assignment),
          ),
        ),
        ";",
      ),
    entity: ($) => seq("entity", $._entity_signature),
    _entity_signature: ($) =>
      seq($._concrete_type, optional($._inherit), $._entity_block),
    _entity_block: ($) =>
      seq(
        "{",
        optional(
          repeat(
            choice(
              $._statement,
              $._entity_field,
            ),
          ),
        ),
        "}",
      ),
    _entity_field: ($) =>
      choice(
        $._entity_method,
        $._entity_member,
        $.function_definition,
        $.const_decl,
        $.invariant,
      ),
    _entity_method: ($) => seq(optional("ref"), "method", $.function_signature),
    _entity_member: ($) =>
      seq(
        "field",
        $.identifier,
        ":",
        $._type,
        optional(
          seq(
            "=",
            repeat($._variable_assignment),
          ),
        ),
        ";",
      ),
    invariant: ($) =>
      seq(
        "invariant",
        $._expression,
        ";",
      ),
    entity_access: ($) =>
      seq(
        prec(
          PREC.FIELD,
          seq(
            $._expression,
            ".",
          ),
        ),
        choice($._expression, /[+-]?[0-9]*/),
      ),
    entity_definition: ($) =>
      seq(
        $._concrete_type,
        "{",
        optional(repeat(
          seq(
            $._expression,
            optional(","),
          ),
        )),
        "}",
      ),
    entity_update: ($) =>
      seq(
        $.identifier,
        "[",
        optional(repeat(
          seq(
            choice($.variable_redefinition, $._expression),
            optional(","),
          ),
        )),
        "]",
      ),

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
        $.assert_statement,
        $.return_statement,
        $.match_statement,
        $.if_statement,
        $.switch_statement,
      ),
    expression_statement: ($) => seq($._expression, ";"),
    variable_statement: ($) =>
      seq(choice($.variable_redefinition, $.variable_expression), ";"),
    assert_statement: ($) => seq("assert", $._expression, ";"),
    return_statement: ($) =>
      seq(
        "return",
        optional(repeat(
          seq(
            $._expression,
            optional(","),
          ),
        )),
        ";",
      ),
    if_statement: ($) =>
      seq(
        "if",
        "(",
        choice($._expression, $.variable_redefinition),
        ")",
        optional($.ITest),
        $._if_body,
        optional(
          seq(
            "else",
            $._if_body,
          ),
        ),
      ),
    _if_body: ($) =>
      seq(
        "{",
        optional(repeat($._statement)),
        optional(";"),
        "}",
      ),
    ITest: ($) =>
      seq(
        optional(repeat("@")),
        choice(
          "!some",
          "some",
        ),
      ),
    match_statement: ($) =>
      seq(
        "match",
        "(",
        $._type,
        ")",
        optional(field("bind", "@")),
        "{",
        repeat(seq($._match_case, optional("|"))),
        "}",
      ),
    _match_case: ($) =>
      seq(
        $._type,
        "=>",
        "{",
        optional(repeat($._statement)),
        "}",
      ),
    switch_statement: ($) =>
      seq(
        "switch",
        "(",
        $._type,
        ")",
        "{",
        repeat(seq($._switch_case, optional("|"))),
        "}",
      ),
    _switch_case: ($) =>
      seq(
        $._expression,
        "=>",
        "{",
        optional(repeat($._statement)),
        "}",
      ),

    variable_expression: ($) =>
      seq(
        choice("let", "var"),
        repeat($._variable_definition),
        optional(
          seq(
            "=",
            repeat($._variable_assignment),
          ),
        ),
      ),
    _variable_definition: ($) =>
      prec(
        PREC.ASSIGNMENT,
        seq(
          $.identifier,
          optional(
            seq(":", $._type),
          ),
          optional(","),
        ),
      ),
    _variable_assignment: ($) =>
      prec.left(seq(
        $._expression,
        optional(","),
      )),

    variable_redefinition: ($) =>
      prec.left(
        PREC.ASSIGNMENT,
        seq(
          repeat($._variable_definition),
          "=",
          optional(
            repeat($._variable_assignment),
          ),
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
        $._num_lit,
        $.this,
        $._strings,
        $.true_lit,
        $.false_lit,
        $.none_lit,
        $.special_lit,
        $.identifier,
        $.unary_expression,
        $.parenthesized_expression,
        $.function_call,
        $.enum_access,
        $.entity_access,
        $.entity_definition,
        $.entity_update,
        $.key_comparator,
        $.elist,
        $._constructor,
        $.type_cast_expression,
        $.import,
        $.lambda_expression,
      ),
    type_cast_expression: ($) =>
      prec(PREC.CAST, seq($._expression, "<", $._type, ">")),
    _constructor: ($) =>
      choice($.option_constructor, $.result_constructor, $.map_constructor),
    option_constructor: ($) =>
      seq(
        $.some_type,
        "{",
        $._expression,
        "}",
      ),
    result_constructor: ($) =>
      seq(
        $.result_type,
        "::",
        choice("Ok", "Fail"),
        "{",
        $._expression,
        "}",
      ),
    map_constructor: ($) =>
      seq(
        $.map_type,
        "{",
        repeat(
          seq(
            $._expression,
            optional(","),
          ),
        ),
        "}",
      ),
    parenthesized_expression: ($) =>
      prec(
        PREC.DEFAULT,
        seq(
          "(",
          $._expression,
          ")",
        ),
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
    elist_type: ($) =>
      seq(
        token("(|"),
        repeat(seq($._type, optional(","))),
        token("|)"),
      ),
    elist: ($) =>
      seq(
        "(|",
        repeat(seq($._expression, optional(","))),
        "|)",
      ),
    special_lit: ($) =>
      prec.left(
        seq(
          token(choice("some", "ok", "fail")),
          "(",
          optional(
            $._expression,
          ),
          ")",
        ),
      ),
    function_call: ($) =>
      prec(
        PREC.CALL,
        seq(
          $.identifier,
          $._function_call_params,
        ),
      ),
    _function_call_params: ($) =>
      seq(
        "(",
        optional(repeat(
          seq(
            optional(seq($.identifier, "=")),
            $._expression,
            optional(","),
          ),
        )),
        ")",
      ),

    lambda_type: ($) =>
      seq(
        "fn",
        "(",
        optional("ref"),
        $._type,
        ")",
        "->",
        $._type,
      ),
    lambda_expression: ($) =>
      prec(
        PREC.LAMBDA,
        seq(
          "fn",
          "(",
          optional("ref"),
          $.identifier,
          optional(seq(":", $._type)),
          ")",
          optional($.function_return_parameters),
          field("lambda_define", "=>"),
          field("lambda_body", choice($.function_body, $._expression)),
        ),
      ),
    // fn(x: Int): Int => x + 1i

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

    comment: (_) =>
      choice(
        //Line
        seq("%%", /(\\+(.|\r?)|[^\\\n])*/),
        //Multiline
        seq("%*", /(\\+(.|\r?\n)|[^\\\n])*/, "*%"),
        //Inline
        seq("%**", /[^*\n]*(\*+[^*\n]*)*/, "**%"),
      ),
    identifier: ($) => seq(optional("$"), /[_a-zA-Z][_a-zA-Z0-9]*/),
    this: ($) => token("this"),
    _entity_id: ($) => alias($.identifier, $.entity_id),
    _enum_member: ($) => alias($.identifier, $.enum_member),
    none_lit: (_) => token("none"),
    true_lit: (_) => token("true"),
    false_lit: (_) => token("false"),
    _num_lit: ($) => choice($.num_float, $.num_whole),
    num_whole: ($) =>
      choice(
        /[+-]?[0-9]*[iI]/,
        /[+-]?[0-9]+(?:\.[0-9]+)?lat[+-]?[0-9]+(?:\.[0-9]+)?long/,
        /[+-]?[0-9]+(?:\.[0-9]+)?[+-]?[0-9]+(?:\.[0-9]+)?j/,
        /[+]?[0-9]*[nN]/,
        /-?[0-9]+\/[1-9][0-9]*R/,
      ),
    num_float: ($) =>
      choice(
        /[+-]?\d+\.\d+f/,
        /[+-]?[0-9]*\.0d|[+-]?[0-9]\.[0-9]*0+d{2}/,
      ),

    _strings: ($) => choice($.string, $.cstring, $.string_regex),
    string: ($) => /"(?:[^%"\\]|%.)*"/u,
    cstring: ($) => /'(?:[ !-$/&-\[\]-~]|%.)*'/,
    string_regex: ($) =>
      token(seq(
        "/",
        repeat1(/[^/]/),
        "/",
        optional("c"),
      )),

    _object_id: ($) =>
      choice(
        $._entity_id,
        $._concept_type,
      ),

    _type: ($) =>
      choice(
        $._abstract_type,
        $._concrete_type,
      ),
    _concrete_type: ($) =>
      choice(
        $.primitive_type,
        $.import,
        $._entity_id,
        $.elist_type,
        $.list,
        $._concept_type,
        $.lambda_type,
      ),
    _abstract_type: ($) =>
      choice(
        $.some_type,
        $.option,
        $.map_type,
        $.result_type,
        $.bind_regex,
        $.string_regex,
      ),
    _concept_type: ($) => seq($._entity_id, "<", $._entity_id, ">"),
    bind_regex: ($) =>
      prec.left(
        seq(
          $._type,
          "of",
          $._type,
        ),
      ),

    map_type: ($) =>
      seq(
        "MapEntry",
        "<",
        repeat(seq($._type, optional(","))),
        ">",
      ),
    result_type: ($) =>
      seq(
        "Result",
        "<",
        repeat(seq($._type, optional(","))),
        ">",
      ),
    some_type: ($) =>
      seq(
        "Some",
        "<",
        repeat(seq($._type, optional(","))),
        ">",
      ),
    list: ($) =>
      seq(
        "List",
        "<",
        $._type,
        ">",
      ),
    option: ($) =>
      seq(
        "Option",
        "<",
        $._type,
        ">",
      ),
    import: ($) =>
      prec.right(
        PREC.CALL,
        seq(
          $._concrete_type,
          "::",
          choice($._type, $.identifier, $.function_call),
        ),
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
