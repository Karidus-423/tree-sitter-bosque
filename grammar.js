/**
 * @file n/a
 * @author Kennett Puerto <kennettdev1@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check
//

const PREC = {
  PAREN_EXPRESSION: -10,
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
    [$.variable_signature, $._expression_not_binary, $._type],
    [$.variable_assignment, $.access_expression],
    [$.type_cast_expression, $.unary_expression, $.binary_expression],
    [$.type_cast_expression, $.binary_expression],
  ],

  rules: {
    source_file: ($) => repeat($._components),

    _components: ($) =>
      choice(
        $.namespace,
        $._expression,
        $._statement,
        $.entity_declaration,
        $.concept_declaration,
        $.datatype_declaration,
      ),

    namespace: ($) =>
      seq(
        optional("declare"),
        "namespace",
        field("namespace_id", $.identifier),
        choice(
          ";",
          $.namespace_block,
        ),
      ),
    namespace_block: ($) =>
      seq(
        "{",
        repeat(choice(
          $._namespace_import_simple,
          $._namespace_import_with_alias,
          $._components,
        )),
        "}",
      ),
    _namespace_import_simple: ($) => seq("using", $.identifier, ";"),
    _namespace_import_with_alias: ($) =>
      seq("using", $.identifier, "as", $.identifier, ";"),

    function_definition: ($) =>
      seq(
        optional(repeat($.modifier)),
        "function",
        $.function_signature,
      ),
    function_signature: ($) =>
      seq(
        field("function_id", $._type),
        $.function_parameters,
        optional($.function_return_parameters),
        $.function_usage,
      ),
    function_parameters: ($) =>
      seq(
        "(",
        commaSep($.variable_expression),
        ")",
      ),
    function_return_parameters: ($) =>
      prec.left(seq(
        ":",
        field("type_sig", $._type),
        optional(repeat(seq($._pre_post_conditions, ";"))),
      )),
    _pre_post_conditions: ($) =>
      choice(
        $.post_condition,
        $.pre_condition,
      ),
    pre_condition: ($) => seq("requires", $._expression),
    post_condition: ($) => seq("ensures", $._expression),
    function_usage: ($) =>
      choice(
        $.object_body,
        $.function_alias,
        ";",
      ),
    object_body: ($) =>
      seq(
        "{",
        optional(repeat($._statement)),
        "}",
      ),
    function_alias: ($) => seq("=", $.identifier, ";"),

    variable_expression: ($) =>
      seq(
        $.variable_signature,
        optional($.variable_assignment),
      ),
    variable_signature: ($) =>
      prec.left(
        PREC.ASSIGNMENT,
        commaSep1(seq($.identifier, optional($._type_bind))),
      ),
    variable_assignment: ($) =>
      prec.left(seq(
        "=",
        commaSep1($._expression),
      )),
    _type_bind: ($) => prec.left(seq(":", $._type)),

    datatype_declaration: ($) =>
      seq(
        "datatype",
        $._type,
        optional($.object_inherit),
        optional($.datatype_block),
        optional($.datatype_inheritance),
        optional($.datatype_constant_block),
        ";",
      ),
    datatype_constant_block: ($) =>
      seq(
        "&",
        $.object_body,
      ),
    datatype_block: ($) =>
      seq(
        "using",
        $.object_body,
      ),
    datatype_inheritance: ($) =>
      prec.left(seq(
        "of",
        repeat1($.datatype_objects),
      )),
    datatype_objects: ($) => seq($._type, $.object_body, optional("|")),

    concept_declaration: ($) =>
      seq(
        optional(repeat($.modifier)),
        "concept",
        $._type,
        $.object_body,
      ),
    entity_declaration: ($) =>
      seq(
        optional(repeat($.modifier)),
        "entity",
        $._type,
        optional($.object_inherit),
        $.object_body,
      ),
    object_inherit: ($) =>
      seq(
        "provides",
        commaSep1($._type),
      ),

    object_creation: ($) =>
      seq(
        $._type,
        optional(seq("::", choice("Ok", "Fail"))),
        $._expression_body,
      ),
    _expression_body: ($) =>
      seq(
        "{",
        commaSep($._expression),
        "}",
      ),

    object_update: ($) => seq($.identifier, $.object_update_block),
    object_update_block: ($) => seq("[", commaSep($._expression), "]"),

    enum: ($) => seq("enum", $.identifier, $._enum_block),
    _enum_block: ($) =>
      seq(
        "{",
        commaSep($._enum_member),
        "}",
      ),
    enum_access: ($) => seq($.identifier, "#", $._enum_member),

    _statement: ($) =>
      choice(
        $.enum,
        $.function_definition,
        $.expression_statement,
        $.assert_statement,
        $.return_statement,
        $.match_statement,
        $.if_statement,
        $.switch_statement,
        $.debug_statement,
        $.abort_statement,
        $.variable_statement,
        $.field_statement,
        $.invariant_statement,
        $.method_statement,
        $.type_statement,
        $.comment,
        $.preprocess_statement,
      ),
    preprocess_statement: ($) =>
      seq(
        "#if", 
        field("preprocess_tag",$.identifier),
        optional(repeat($._components)),
        optional($._else_preprocess),
        "#endif",
      ),
    _else_preprocess: ($) =>
        seq("#else", optional(repeat($._components))),

    variable_statement: ($) =>
      seq(choice("let", "const", "var"), $.variable_expression, ";"),
    abort_statement: (_) => seq("abort", ";"),
    debug_statement: ($) => seq(choice("_debug", "debug"), $._expression, ";"),
    expression_statement: ($) => seq($._expression, ";"),
    assert_statement: ($) => seq("assert", $._expression, ";"),
    field_statement: ($) => seq("field", $._expression, ";"),
    invariant_statement: ($) => seq("invariant", $._expression, ";"),
    method_statement: ($) =>
      seq(
        optional(repeat($.modifier)),
        "method",
        $.function_signature,
      ),
    type_statement: ($) => seq("type", $._type, "=", $._type, ";"),
    return_statement: ($) =>
      seq(
        "return",
        commaSep($._expression),
        ";",
      ),
    if_statement: ($) =>
      seq(
        "if",
        "(",
        choice($._expression),
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
    ITest: (_) =>
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

    _bind_var: ($) => seq(":", $._type),

    _expression: ($) =>
      choice(
        $._expression_not_binary,
        $.binary_expression,
        $._compound_expression,
      ),
    _expression_not_binary: ($) =>
      prec.left(choice(
        $._num_lit,
        $.this,
        $._strings,
        $.regex_expression,
        $.true_lit,
        $.false_lit,
        $.key_comparator,
        $.none_lit,
        $.identifier,
        $.unary_expression,
        $.parenthesized_expression,
        $.function_call,
        $.enum_access,
        $.object_creation,
        $.object_update,
        $.elist_value,
        $.access_expression,
        $.variable_expression,
        $.type_cast_expression,
        $.namespace_access_expression,
        $.lambda_expression,
      )),
    lambda_expression: ($) =>
      prec.left(seq(
        $.function_call,
        optional($.function_return_parameters),
        "=>",
        choice(
          $._expression,
          $.object_body,
        ),
      )),
    type_cast_expression: ($) =>
      prec(
        PREC.CAST,
        seq(
          $._expression,
          $.type_params,
        ),
      ),
    elist_value: ($) =>
      seq(
        "(|",
        commaSep1($._expression),
        "|)",
      ),
    type_params: ($) =>
      seq(
        "<",
        commaSep1(seq($._type, optional(seq(":", $._type)))),
        ">",
      ),

    // Result<Int, Bool>
    constructor_type: ($) =>
      seq(
        choice("Result", "Map", "MapEntry", "Some"),
        $.type_params,
      ),
    // Result<Int, Bool>::Ok{2i}
    // KeyComparator::equal/less<Nat>(0n, 1n)
    key_comparator: ($) =>
      prec.left(seq(
        "KeyComparator",
        "::",
        choice("equal", "less"),
        $.type_params,
        "(",
        commaSep1($._expression),
        ")",
      )),
    parenthesized_expression: ($) =>
      prec(
        PREC.PAREN_EXPRESSION,
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
    access_expression: ($) =>
      prec.left(seq(
        $._expression,
        ".",
        $._expression,
      )),
    namespace_access_expression: ($) =>
      prec.left(seq(
        $._type,
        "::",
        $._expression,
      )),
    namespace_access_type: ($) => 
      prec.left(
        seq(
          $._type,
          "::",
          field("access_target",$._type)),
      ),

    function_call: ($) =>
      prec(
        PREC.CALL,
        seq(
          field("function_id", $._type),
          $.function_call_parameters,
        ),
      ),
    function_call_parameters: ($) =>
      prec.left(seq("(", commaSep($._expression), ")")),

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
            // @ts-ignore // Uses "rules" and expects $.rule but works the same.
            field("operator", operator),
            field("right", $._expression),
          ),
        );
      }));
    },

    modifier: (_) =>
      choice(
        "...",
        "ref",
        "$",
        "public",
        "recursive",
        "recursive?",
        "chktest",
        "errtest",
        "internal",
        "safe",
        "__safe",
        "numeric",
        "__numeric",
        "__internal",
        "__typedeclable",
        "__typebase",
        "keycomparable",
        "__keycomparable",
        "assume_safe",
        "__assume_safe",
      ),


    comment: (_) =>
      choice(
        //Line
        seq(token("%%"), /(\\+(.|\r?)|[^\\\n])*/),
        //Multiline
        seq("%*", /([^*]|\*[^%])*/, "*%"),
        //Inline
        seq("%**", /([^*]|\*\*[^%])*/, "**%"),
      ),
    identifier: ($) => seq(optional(repeat($.modifier)), /[_a-zA-Z][_a-zA-Z0-9]*/),
    this: (_) => token("this"),
    _enum_member: ($) => alias($.identifier, $.enum_member),
    none_lit: (_) => token("none"),
    true_lit: (_) => token("true"),
    false_lit: (_) => token("false"),
    _num_lit: ($) => choice($.num_float, $.num_whole),
    num_whole: (_) =>
      choice(
        field("index", /[0-9]+/),
        /[+-]?[0-9]*[iI]/,
        /[+-]?[0-9]+(?:\.[0-9]+)?lat[+-]?[0-9]+(?:\.[0-9]+)?long/,
        /[+-]?[0-9]+(?:\.[0-9]+)?[+-]?[0-9]+(?:\.[0-9]+)?j/,
        /[+]?[0-9]*[nN]/,
        /-?[0-9]+\/[1-9][0-9]*R/,
      ),
    num_float: (_) =>
      choice(
        /[+-]?\d+\.\d+f/,
        /[+-]?[0-9]*\.0d|[+-]?[0-9]\.[0-9]*0+d{2}/,
      ),

    _strings: ($) => choice($.string, $.cstring),
    string: (_) => /"(?:[^%"\\]|%.)*"/u,
    cstring: (_) => /'(?:[ !-$/&-\[\]-~]|%.)*'/,
    regex_expression: (_) =>
      token(seq(
        "/",
        repeat1(/[^/]/),
        "/",
        optional("c"),
      )),

    _type: ($) =>
      choice(
        $.primitive_type,
        alias($.identifier, $.custom_type),
        $.option_type,
        $.elist_type,
        $.constructor_type,
        $.list_type,
        $.regex_type,
        $.namespace_access_type,
        $.template,
        $.lambda_type,
      ),
    lambda_type: ($) =>
      prec.left(seq(
        $._type,
        $.function_parameters,
        "->",
        $._type,
      )),
    template: ($) => seq($._type, $.type_params),
    list_type: ($) =>
      seq(
        "List",
        $.type_params,
      ),
    elist_type: ($) =>
      seq(
        "(|",
        commaSep1($._type),
        "|)",
      ),
    option_type: ($) =>
      seq(
        "Option",
        $.type_params,
      ),
    regex_type: ($) =>
      prec.left(seq(
        choice("CString", "String"),
        "of",
        choice($.regex_expression, $._type),
      )),

    primitive_type: (_) =>
      prec.left(choice(
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

//https://github.com/tree-sitter/tree-sitter-c/blob/master/grammar.js#L1455
/**
 * Creates a rule to optionally match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {ChoiceRule}
 */
function commaSep(rule) {
  return optional(commaSep1(rule));
}

/**
 * Creates a rule to match one or more of the rules separated by a comma
 *
 * @param {Rule} rule
 *
 * @returns {SeqRule}
 */
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}

module.exports.commaSep = commaSep;
module.exports.commaSep1 = commaSep1;
