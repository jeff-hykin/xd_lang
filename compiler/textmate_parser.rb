# 
# this is just a skeleton for syntax highlighting
# 
require "textmate_tools"


grammar = Grammar.new()


grammar[:$initial_context] = [
    :ignored_code, # whitespace and comments
    :punctuation, # parenthese, colon, square brackets
    :literals, # atoms, strings, numbers
    :items, # object/variables
    :operators, # syntatical sugar for functions
]


grammar[:ignored_code] = [
    grammar[:whitespace] =  Pattern.new(@spaces),
    grammar[:comment] = Pattern.new(/# .+/),
]

grammar[:punctuation] = [
    grammar[:parentheses] = PatternRange.new(
        start_pattern: Pattern.new(/\(/),
        end_pattern: Pattern.new(/\)/),
    ),
    grammar[:specific_blocks] = [
        # grammar[:comment]
        # grammar[:hex]
        # grammar[:literalString]
        # grammar[:smartString]
        # grammar[:literalFilePath]
        # grammar[:smartFilePath]
        # grammar[:literalRegex]
        # grammar[:smartRegex]
        # grammar[:list]
        # grammar[:code]
        # grammar[:set]
        # grammar[:namedList]
        # grammar[:yaml]
        # grammar[:say]
        # grammar[:show]
    ],
    grammar[:block] = [
        grammar[:single_line_block] = Pattern.new(/:/).maybe(@spaces).then(/[^\s]+/),
        grammar[:multi_line_block] = PatternRange.new(
            start_pattern: Pattern.new(/:/).maybe(@spaces).then(@end_of_line),
            while: look_for_indent,
            includes: [],
        )
    ],
]

# symbols: # @ 0 1 2 3 4 5 6 7 8 9 " ' ./ [
grammar[:literals] = [
    grammar[:officialTerms] = Pattern.new(/#[a-zA-Z0-9]*/),
    grammar[:numeric] = Pattern.new(/\d+/).then(/[a-zA-Z0-9\.]*/), # includes units
    grammar[:atoms] = Pattern.new(/@[a-zA-Z0-9]*/),
    grammar[:filePaths] = [
        grammar[:relativeFilePath] = Pattern.new(/\.\/[^\s]*/),
    ],
    grammar[:strings] = [
        # literals 
        grammar[:single_quoted] = PatternRange.new(
            start_pattern: Pattern.new(
                match: zeroOrMoreOf(/''/).then(/'/),
                reference: "start_single_quote",
            ),
            end_pattern: Pattern.new(
                match: backReference("start_single_quote"),
            ),
        ),
        # interpolation
        grammar[:single_quoted] = PatternRange.new(
            start_pattern: Pattern.new(
                match: zeroOrMoreOf(/""/).then(/"/),
                reference: "start_double_quote",
            ),
            end_pattern: Pattern.new(
                match: backReference("start_double_quote"),
            ),
            includes: [
                grammar[:escape_pattern] = PatternRange.new(
                    start_pattern: /\(\(/,
                    end_pattern: /\)\)/,
                )
            ]
        ),
    ],
    grammar[:list] = PatternRange.new(
        start_pattern: Pattern.new(/\[/),
        end_pattern: Pattern.new(/\]/),
        includes: [
            grammar[:comma] = Pattern.new(/,/),
        ]
    ),
    
    # pick the defered-code syntax later (could be {} Would work like if(a==b)then{ c = d })
    # grammar[:code] = PatternRange.new(
    #     start_pattern: Pattern.new(
    #         match: zeroOrMoreOf(/``/).then(/`/),
    #         reference: "start_code",
    #     ),
    #     end_pattern: Pattern.new(
    #         match: backReference("start_code"),
    #     ),
    # ),
]

grammar[:items] = [
    # simple item
    Pattern.new(/[a-z][a-zA-Z]*/),
    # can also be disconected/separated
    Pattern.new(/[a-zA-Z]+/),
]


# just non-punctuation non-
grammar[:operators] = [
    grammar[:assignment_operators] = [
        Pattern.new(/<</),
        Pattern.new(/-</),
        Pattern.new(/>-</),
    ],
    grammar[:comparison_operators] = [
        Pattern.new(/=/),
        Pattern.new(/≠/),
        Pattern.new(/>/),
        Pattern.new(/</),
        Pattern.new(/≥/),
        Pattern.new(/≤/),
        Pattern.new(/\|/),
        Pattern.new(/&/),
    ],
    grammar[:numerical_operators] = [
        Pattern.new(/\^/),
        Pattern.new(/\*/),
        Pattern.new(/\//),
        Pattern.new(/\+/),
        Pattern.new(/\-/),
    ]
]