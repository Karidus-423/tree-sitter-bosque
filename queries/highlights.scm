(identifier) @variable
(this) @variable.builtin

(true_lit) @boolean
(false_lit) @boolean

(namespace
  namespace_id: (identifier) @module)
(preprocess_statement
  preprocess_tag: (identifier) @module)

(enum_member) @constant
(none_lit) @constant

(custom_type) @type

(string) @string
(cstring) @string

(num_whole) @number
(num_float) @number.float

(comment) @comment

(function_signature
  function_id: (custom_type) @function)

(elist_type
  "(|" @type
  "|)" @type)

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


[
"if" 
"match" 
"switch" 
"else" 
"#if"
"#else"
"#endif"
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
"__internal"
"_debug" 
"debug" 
] @keyword.modifier

[
"function" 
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
"recursive?" 
"recursive" 
"errtest" 
"chktest"
"abort"
"Ok" 
"Option" 
] @keyword

; "action" @keyword
; "bsqon" @keyword
; "$bsqon" @keyword
; "do" @keyword
; "elif" @keyword
; "env" @keyword
; "fail" @keyword
; "implements" @keyword
; "pred" @keyword
; "result" @keyword
; "self" @keyword
; "then" @keyword
; "yield" @keyword
; "continue" @keyword
; "break" @keyword
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
] @type.builtin
