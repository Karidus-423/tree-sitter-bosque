(identifier) @variable
(this) @variable.builtin
; "_" @variable.builtin

(true_lit) @boolean
(false_lit) @boolean

(namespace
  namespace_id: (identifier) @module)

(entity_id) @constant
(enum_member) @constant
(none_lit) @constant

(function_call) @function.call
(function_signature
  function_id: (entity_id) @function)

[
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
"(|" 
"|)" 
] @punctuation.special

[
"#"
"$" 
"." 
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
"fn" 
"if" 
"match" 
"let" 
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
"const" 
] @keyword.modifier

"function" @keyword.function

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
