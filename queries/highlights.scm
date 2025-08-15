(identifier) @variable
(this) @variable.builtin
; "_" @variable.builtin

(true_lit) @boolean
(false_lit) @boolean

(namespace
  namespace_id: (identifier) @module)

; (entity_id) @constant
(enum_member) @constant
(none_lit) @constant

(function_call
  function_id: (identifier) @function.call)

(function_signature
  function_id: (identifier) @function)


(elist_type
  elist_type_start: "(|" @type.builtin
  type_sig: (identifier) @type
  elist_type_end: "|)"   @type.builtin)

(entity
  entity_id: (identifier) @type)

(function_param_signature
  type_sig: (identifier) @type)

(function_return_parameters
  type_sig: (identifier) @type)

(field
  type_sig: (identifier) @type)

(variable_definition
  type_sig: (identifier) @type)

(entity_definition
  type_sig: (identifier) @type)

(import
  type_sig: (identifier) @module)


[
"!"
"+" 
"-" 
"*" 
"//" 
"%" 
"||" 
"&&" 
"|" 
"^" 
"&" 
"===" 
"!==" 
"==" 
"!=" 
">" 
">=" 
"<=" 
"==>" 
"<==>" 
"<" 
"<<" 
">>" 
] @operator

[
"(" 
")" 
"{" 
"}" 
] @punctuation.bracket


(elist
  elist_start: "(|" @punctuation.special
  elist_end: "|)" @punctuation.special)

[
"#"
"$" 
"@"
"." 
"::"
";" 
"=>" 
"->" 
] @punctuation.delimeter

(string) @string
(cstring) @string
(string_regex) @string.regexp

(num_whole) @number
(num_float) @number.float

[
"if" 
"match" 
"switch" 
"else" 
] @statement

"return" @keyword.return

[
"assert" 
] @keyword.conditional

[
"ref" 
"var" 
"let"
"const" 
] @keyword.modifier

[
"function" 
"fn" 
]@keyword.function

[
"some" 
"type" 
"as" 
"concept" 
"declare" 
"enum" 
"entity" 
"ensures" 
"field" 
"invariant" 
"method" 
"namespace" 
"of" 
"provides" 
"requires" 
"datatype" 
"using" 
"public" 
] @keyword

; "recursive?" @keyword
; "recursive" @keyword
; "action" @keyword
; "_debug" @keyword
; "abort" @keyword
; "bsqon" @keyword
; "$bsqon" @keyword
; "do" @keyword
; "elif" @keyword
; "env" @keyword
; "fail" @keyword
; "implements" @keyword
; "ok" @keyword
; "option" @keyword
; "pred" @keyword
; "result" @keyword
; "self" @keyword
; "then" @keyword
; "yield" @keyword
; "continue" @keyword
; "break" @keyword
; "debug" @keyword
; "release" @keyword
; "safety" @keyword
; "spec" @keyword
; "test" @keyword
; "api" @keyword
; "in" @keyword
; "task" @keyword
; "validate" @keyword
; "when" @keyword
; "event" @keyword
; "status" @keyword
; "resource" @keyword
; "predicate" @keyword
; "softcheck" @keyword
; "errtest" @keyword
; "chktest" @keyword
; "example" @keyword
; "operator" @keyword
; "variant" @keyword
; "private" @keyword
; "internal" @keyword
; "hidden" @keyword
; "sensitive" @keyword
; "export" @keyword
; "deterministic" @keyword
; "idempotent" @keyword
; "abstract" @keyword
; "override" @keyword
; "virtual" @keyword

[
"None"
"Bool"
"Nat"
"Int"
"BigInt"
"BigNat"
"Rational"
"Float"
"Decimal"
"DecimalDegree"
"LatLongCoordinate"
"Complex"
"ByteBuffer"
"UUIDv4"
"UUIDv7"
"SHAContentHash"
"TZDateTime"
"TAITime"
"PlainDate"
"PlainTime"
"LogicalTime"
"ISOTimestamp"
"DeltaDateTime"
"DeltaSeconds"
"DeltaLogicalTime"
"DeltaISOTimestamp"
"CChar"
"UnicodeChar"
"CCharBuffer"
"UnicodeCharBuffer"
"String"
"CString"
"Regex"
"CRegex"
"PathRegex"
"Path"
"PathItem"
"Glob"
(list)
] @type.builtin
