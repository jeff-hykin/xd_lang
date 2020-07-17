file_contents = IO.read(ARGV[0])
STANDARD_INDENT_SIZE = 4

#
# overview
#
# everything is represented as nodes inside of lists
# > comments are nodes
# > key-value pairs are nodes

comment = /# (.+)/
type = /(\()([\w\/]+)(\))/
inline_patterns = [
    number = /(-?)(\d+)(?:(\.)\d+)?/,
    atomic = /(@)([\\w]+)/,
    string_single_single = /(')([^']+)(')/,
    string_single_triple = /(''')(.+?'?'?)(''')/,
    string_double_single = /(")((?:[^"\\]|\\.)*)(")/, # allows escaped newlines
    string_double_triple = /(""")(.+?"?"?)(""")/,
]
key = /^/.then(inline_patterns.or(/\w+/)).maybe(type).then(/:|>/)
list_item = /^/.then(/\s*/).then(/>|:/)
block_string_single = ->(indent) do maybe(type).then(/'\n(#{indent}.+)*/) end
block_string_double = ->(indent) do maybe(type).then(/"\n(#{indent}.+)*/) end
reference = /#referBackTo:/.zeroOrMoreOf(inline_patterns.then(/,/)).then(inline_patterns).maybe(/,/)

# FUTURE: references, interpolation, escapes
# FUTURE: auto alignment of nearby elements
# FUTURE: my_list: 1,2,3,4 # must be inlines separated by commas
# FUTURE: allow inline comments inside of string-blocks