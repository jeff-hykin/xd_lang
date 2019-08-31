require 'atk_toolbox'


# non-mvp features
    # compile time code
    # "other" compile options
    # operators
    # transpiling

$language_parameters = {
    empty_space: / +/,
    comment: /\/\/.*/,
    line_seperator: /\n/,
    var: /[a-zA-Z_]+/,
    block_start: /:/,
    atom_symbol: /@/,
    manual_presedence_start: /\(/,
    manual_presedence_end: /\)/,
    array_start: /\[/,
    array_end: /\]/,
    value_seperator: /,/,
}

def indent_of(line)
    line.gsub(/\A( *).+/,'\1').size
end

def tokenize(string)
    operators = [
        # unknown operator
        ->(string_fragment) do
            if string_fragment =~ /\A[^\w\s](?=[\w\s])/
                return { new_location: $&, adjectives: [:operator, :unknown], }
            end
        end,
    ]
    literals = [
        # system
        ->(string_fragment) do
            if string_fragment =~ /\A#\w+/
                return { new_location: $&, adjectives: [:literal, :system], }
            end
        end,
        # numbers
        ->(string_fragment) do
            if string_fragment =~ /\A\d+(\.\d+)?/
                return { new_location: $&, adjectives: [:number, :literal], }
            end
        end,
        # numbers as atoms
        ->(string_fragment) do
            if string_fragment =~ /\A@\d+(\.\d+)?/
                return { new_location: $&, adjectives: [:number, :literal, :atom], }
            end
        end,
        # atoms
        ->(string_fragment) do
            if string_fragment =~ /\A@\w+/
                return { new_location: $&, adjectives: [:atom, :literal], }
            end
        end,
        # strings
        ->(string_fragment) do
            if string_fragment =~ /\A".+?"/
                return { new_location: $&, adjectives: [:string, :literal], }
            end
        end,
    ]
    
    tokens = []
    remaining_string = string
    prev_size = remaining_string.size + 1
    location = ->() do
        string.size - remaining_string.size
    end
    current_line_parts = ->() do
        prev_string = string[0..location[]]
        before_part  = prev_string.split("\n")[-1]
        next_string = string[location[]..-1]
        after_part  = next_string.split("\n")[0]
        [ before_part, after_part ]
    end
    indent = ->() do
        prev_string = string[0..location[]]
        prev_lines  = prev_string.split("\n")
        indent_size = indent_of(prev_lines[-1])
    end
    extract = ->(token) do
        # TODO: probably should issue a warning/error if remaining_string 
        remaining_string = remaining_string[token.size..-1]
        # return the token itself
        token
    end
    quick_match = ->(regex, adjectives) do
        if remaining_string =~ /\A#{regex}/
            tokens.push({
                token: extract[$&],
                adjectives: adjectives
            })
            throw :next
        end
    end
    try_each = ->(array) do
        for each in array
            result = each[remaining_string]
            if result != nil && result.is_a?(Hash) && result[:new_location].is_a?(String)
                # TODO: result existing but not new location should probably throw an error
                tokens.push({
                    token: extract[result[:new_location]],
                    adjectives: result[:adjectives] || []
                })
                # go to next token
                throw :next
            end
        end
    end
    while remaining_string.size > 0
        # no progress (infinite loop catcher)
        if prev_size <= remaining_string.size
            raise "grammar is stuck at #{current_line_parts[]}"
        else
            prev_size = remaining_string.size
        end
        # allow escaping from deeply nested areas
        catch :next do 
            # 
            # system
            #
                log "checking system patterns"
                quick_match[ $language_parameters[:empty_space            ], [ :empty  , :ignore   ] ]
                quick_match[ $language_parameters[:comment                ], [ :comment, :ignore   ] ]
                quick_match[ $language_parameters[:line_seperator         ], [ :line_seperator     ] ]
                quick_match[ $language_parameters[:value_seperator        ], [ :value_seperator    ] ]
                quick_match[ $language_parameters[:manual_presedence_start], [ :start_presedence   ] ]
                quick_match[ $language_parameters[:manual_presedence_end  ], [ :end_presedence     ] ]
                quick_match[ $language_parameters[:array_start            ], [ :array_start        ] ]
                quick_match[ $language_parameters[:array_end              ], [ :array_end          ] ]

                log "checking punctuation patterns"
                # if block start
                if remaining_string =~ /\A#{$language_parameters[:block_start]}/
                    # remove the block_start
                    working_string = remaining_string[$&.size..-1]
                    block_start = $&
                    block_content = ""
                    # check for multiline
                    if working_string =~ /\A( *\n)(.*(?:\n|\z))/ && indent_of($2) > indent[]
                        next_line_indent = indent_of($2)
                        this_line_indent = indent[]
                        # include the first indented line
                        block_content += $2[next_line_indent-1..-1]
                        # then set the indent level
                        indent_increase = next_line_indent - this_line_indent
                        block_indent = next_line_indent
                        # loop until unindent or end of file
                        loop do
                            # remove the most recent match
                            working_string = working_string[$&.size..-1]
                            if working_string.size == 0
                                break
                            end
                            # if line is all whitespace, dont require that it be indented enough
                            if working_string =~ /\A *(\n|\z)/
                                if $&.size > block_indent
                                    block_content += $&[block_indent-1..-1]
                                else
                                    block_content = $1
                                end
                                next
                            end
                            # if there is another line
                            if working_string =~ /\A.*(?:\n|\z)/
                                # check the indent level of the line
                                if block_indent <= indent_of($&)
                                    # remove the indent of the line and add it to block_content
                                    block_content += $&[block_indent-1..-1]
                                    # try the next line
                                    next
                                end
                            end
                            # otherwise break
                            break
                        end
                    # single line
                    else
                        working_string =~ /\A.*/
                        block_content += $&
                        working_string = working_string[$&.size..-1]
                    end
                    # add block_start token
                    tokens.push({
                        token: block_start,
                        adjectives: [ :punctuation, :blockStart ]
                    })
                    # add the block itself
                    tokens.push({
                        token: block_content,
                        adjectives: [ :block, ]
                    })
                    # add an empty line_seperator
                    tokens.push({
                        token: "",
                        adjectives: [ :line_seperator, ]
                    })
                    # remove the block from the remaining_string
                    remaining_string = working_string
                    # go to the next token
                    next
                end
            # 
            # Other
            # 
                # todo
            # 
            # variables
            # 
                log "checking variable patterns"
                quick_match[ $language_parameters[:var], [:variable] ]
            # 
            # literals
            # 
                log "checking literal patterns"
                try_each[literals]
            # 
            # operators
            # 
                log "checking operator patterns"
                try_each[operators]
        end
    end
    return tokens
end



tokens = tokenize(<<-HEREDOC)
my_variable = 10:
    testing
    how
    lovely is 
    this
    
(other_var = 20@1)
HEREDOC


def get_lines(tokens)
    lines = []
    unsorted_tokens = tokens.dup.reverse
    while unsorted_tokens.size > 0
        line = []
        while unsorted_tokens.size > 0  &&  (next_token = unsorted_tokens.pop()) &&  !next_token[:adjectives].include?(:line_seperator)
            line.push(next_token)
        end
        lines.push(line.reverse)
    end
    return lines
end

class Line < Array
end

class Bundle < Array
end

class ValueAccess < Array
end

def is_a_value(term)
    term.is_a?(Bundle) || term.is_a?(ValueAccess) || (term.is_a?(Hash) && (term[:adjectives].include?(:literal) || term[:adjectives].include?(:variable) || term[:adjectives].include?(:value)))
end

def bundle(tokens)
    tokens = tokens.clone.select { |each| not each[:adjectives].include?(:ignore) }
    terms = Bundle.new
    next_token = {}
    should_return_terms = false
    while tokens.size > 0
        next_token = tokens.pop()
        if next_token[:adjectives].include?(:start_presedence)
            # get the next bundle, as well what still needs to be bundled
            next_term = bundle(tokens)
            tokens = tokens[0..-(next_term.flatten.size+1)]
            terms.push(next_term)
        elsif next_token[:adjectives].include?(:end_presedence)
            should_return_terms = true
        else
            next_term = next_token
            terms.push(next_term)
        end
        
        # bundle access
        if terms.size > 2
            prev = terms[-2]
            current = terms[-1]
            if is_a_value(prev) && is_a_value(current)
                if prev.is_a?(ValueAccess)
                    terms.pop()
                    prev.push(current)
                else
                    terms.pop()
                    terms.pop()
                    terms.push(ValueAccess.new([ prev, current ]))
                end
            end
        end
        
        if should_return_terms
            # put all the current items in one bundle, and just add the remaining tokens as trailing values
            break
        end
    end
    return terms.reverse
end

lines = []
for each_line in get_lines(tokens)
    lines.push(Line.new(bundle(each_line)))
end

