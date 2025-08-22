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
    [$._expression_not_binary, $._type],
    [$._identifier_sig, $._expression_not_binary],
    [$.identifier],
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
          $.namespace_block,
        ),
      ),
    namespace_block: ($) =>
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
        $.identifier,
        "=",
        $._type,
        ";",
      ),

    function_modifier: ($) =>
      choice(
        "public",
        "recursive",
        "recursive?",
        "chktest",
        "errtest",
        "function",
      ),
    function_definition: ($) =>
      seq(
        optional(repeat($.function_modifier)),
        $.function_signature,
      ),
    function_signature: ($) =>
      seq(
        field("function_id", $.identifier),
        $.function_parameters,
        optional($.function_return_parameters),
        $.function_body,
      ),
    function_parameters: ($) =>
      seq(
        "(",
        ")",
      ),
    function_return_parameters: ($) =>
      seq(
        ":",
        field("type_sig", $._type),
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
        optional(repeat($.field)),
        "}",
      ),

    datatype: ($) =>
      seq(
        "datatype",
        $.identifier,
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
          $._type,
          optional(","),
        )),
      ),
    _datatype_block: ($) =>
      seq(
        "using",
        "{",
        optional(repeat($.field)),
        "}",
      ),
    _datatype_constants: ($) =>
      seq(
        "&",
        "{",
        optional(repeat($.field)),
        "}",
      ),

    entity: ($) => seq(optional($.modifier), "entity", $._entity_signature),
    _entity_signature: ($) =>
      seq(
        field("entity_id", $._type),
        optional($._inherit),
        $._entity_block,
      ),
    _entity_block: ($) =>
      seq(
        "{",
        optional(
          repeat(
            choice(
              $.field,
            ),
          ),
        ),
        "}",
      ),
    field: ($) =>
      choice(
        $._entity_method,
        $._entity_member,
        $.function_definition,
        $.invariant,
      ),
    _entity_method: ($) => seq("method", $.function_signature),
    _entity_member: ($) =>
      seq(
        "field",
        ";",
      ),
    invariant: ($) =>
      seq(
        "invariant",
        $._expression,
        ";",
      ),
    type_definition: ($) =>
      seq(
        $._type,
        optional(seq("::", choice("Ok", "Fail"))),
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
        "]",
      ),

    enum: ($) => seq("enum", $.identifier, $._enum_block),
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
        $.assert_statement,
        $.return_statement,
        $.match_statement,
        $.if_statement,
        $.switch_statement,
        $.debug_statement,
        $.abort_statement,
      ),
    abort_statement: ($) => seq("abort", ";"),
    debug_statement: ($) => seq("_debug", $._expression, ";"),
    expression_statement: ($) => seq($._expression, ";"),
    assert_statement: ($) => seq("assert", $._expression, ";"),
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



    _bind_var: ($) => seq(":", $._type),

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
        $.key_comparator,
        $.none_lit,
        $.identifier,
        $.unary_expression,
        $.parenthesized_expression,
        $.function_call,
        $.enum_access,
        $.type_definition,
        $.entity_update,
        $.elist_value,
        $.access_expression,
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
        commaSep1($._type),
        ">",
      ),

    // Result<Int, Bool>
    constructor_type: ($) =>
      seq(
        choice("Result", "MapEntry", "Some"),
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
        repeat(
          seq(
            $._expression,
            optional(","),
          ),
        ),
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
    enum_access: ($) => seq($.identifier, "#", $._enum_member),
    access_expression: ($) =>
      prec.right(seq(
        $._expression,
        ".",
        $._expression,
      )),

    function_call: ($) =>
      prec(
        PREC.CALL,
        seq(
          field("function_id", $.identifier),
          $._function_call_params,
        ),
      ),
    _function_call_params: ($) =>
      seq(
        "(",
        commaSep(),
        ")",
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

    modifier: ($) =>
      choice(
        "...",
        "ref",
        "$",
        "__internal",
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
    identifier: ($) => seq(optional($.modifier), /[_a-zA-Z][_a-zA-Z0-9]*/),
    this: ($) => token("this"),
    _enum_member: ($) => alias($.identifier, $.enum_member),
    none_lit: (_) => token("none"),
    true_lit: (_) => token("true"),
    false_lit: (_) => token("false"),
    _num_lit: ($) => choice($.num_float, $.num_whole),
    num_whole: ($) =>
      choice(
        field("index", /[0-9]+/),
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

    _explicit_bind_type: ($) =>
      seq(
        optional($.modifier),
        optional(
          seq(
            $.identifier,
            ":",
          ),
        ),
        field("type_sig", $._type),
      ),

    _type: ($) =>
      choice(
        $.primitive_type,
        $.identifier,
        $.option_type,
        $.elist_type,
        $.constructor_type,
        $.list_type,
      ),
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

    primitive_type: ($) =>
      choice(
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
      ),
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
