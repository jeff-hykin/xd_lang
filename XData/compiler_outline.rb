file_contents = IO.read(ARGV[0])
STANDARD_INDENT_SIZE = 4

#
# overview
#
# everything is represented as nodes inside of lists
# > comments are nodes
# > key-value pairs are nodes

$comment_pattern = /\A# (.*)/
$list_element_pattern = /\A- /
$type_pattern = /\A(\()([\w\/]+)(\))/
inline_patterns = [
    $empty_container_pattern = /\A(\{\}|\[\])/i,
    $special_term_pattern = /\A(null|true|false)\b/i, 
    $number_pattern = /\A(-?)(infinite\b|(\d+)(?:(\.)\d+)?)/i, # PROBLEM: NaN
    $atom_pattern = /\A(@)([\\w]+)/,
    $string_single_single_pattern = /\A(')([^']+)(')/,
    $string_single_triple_pattern = /\A(''')(.+?'?'?)(''')/,
    $string_double_single_pattern = /\A(")((?:[^"\\]|\\.)*)(")/, # allows escaped newlines
    $string_double_triple_pattern = /\A(""")(.+?"?"?)(""")/,
]

# FUTURE: references, interpolation, escapes
# FUTURE: auto alignment of nearby elements
# FUTURE: my_list: 1,2,3,4 # must be inlines separated by commas
# FUTURE: allow inline comments inside of string-blocks
# PROBLEM: completely empty value sections

output = {}

class String
    def extract!(regex, group=0)
        if match = self.match(regex)
            output = match[group]
            self.sub!(regex, "")
            return output
        end
    end
end


def pullOffWhiteSpace(string)
    precedingWhitespacePattern = /^[ \t]*/
    return string.match(precedingWhitespacePattern)[0]
end
def pullOffWhiteSpace!(string)
    precedingWhitespacePattern = /^[ \t]*/
    output = string.match(precedingWhitespacePattern)[0]
    string.sub!(precedingWhitespacePattern, "")
    return output
end

def pullOff!(pattern, string, trim: true, response: nil)
    string_copy = string.clone
    
    indent = ""
    indent = pullOffWhiteSpace!(string_copy) if trim
    match = string_copy.match(pattern)
    if match
        output = response[indent: indent, match: match]
        if output
            pullOffWhiteSpace!(string)
            # pull it off the string
            string.sub!(pattern, "")
            # return the hash if successful
            return output
        end
    end
    nil
end

def pullOffComment!(string)
    pullOff! $comment_pattern, string,  response: ->(indent: nil, match: nil) do
        {
            type: "#comment",
            value: match[1],
            indent: indent,
        }
    end
end

def pullOffType!(string)
    pullOff! $type_pattern, string, response: ->(indent: nil, match: nil) do
        {
            value: match[2],
            indent: indent,
        }
    end
end

def pullOffInlineTypedValue!(string)
    string_clone = string.clone
    type = pullOffType!(string_clone)
    if type
        return pullOff! /:(.*)/, string, response: ->(indent: nil, match: nil) do
            {
                type: type[:asString],
                indent: type[:indent],
                value: indent+match[1],
            }
        end
    end
    nil
end
# TODO: also cover the typed value without the colon


def pullOffEmptyContainer!(string)
    pullOff! $empty_container_pattern, string, response: ->(indent: nil, match: nil) do
        container_symbol = match[0]
        if container_symbol == "{}"
            type = "#container/map"
        elsif container_symbol == "[]"
            type = "#container/list"
        end
        {
            type: type,
            value: container_symbol,
            indent: indent,
        }
    end
end

def pullOffKeyTerm!(string)
    pullOff! $special_term_pattern, string, response: ->(indent: nil, match: nil) do
        special_term = match[0].downcase
        if special_term == "null"
            type = "#atom/null"
        elsif special_term == "false"
            type = "#atom/false"
        elsif special_term == "true"
            type = "#atom/true"
        end
        {
            type: type,
            value: special_term,
            indent: indent,
        }
    end
end

# TODO: reference

def pullOffNumber!(string)
    pullOff! $number_pattern, string, response: ->(indent: nil, match: nil) do
        {
            type: "#atom/number",
            value: match[0],
            indent: indent,
        }
    end
end

def pullOffAtom!(string)
    pullOff! $atom_pattern, string, response: ->(indent: nil, match: nil) do
        {
            type: "#atom",
            value: match[0],
            indent: indent,
        }
    end
end

def pullOffInlineString!(string)
    string_clone = string.clone
    # find quotes
    actual_indent = pullOffWhiteSpace!(string_clone)
    single_quotes_match = string_clone.match(/\A'+/)
    double_quotes_match = string_clone.match(/\A"+/)
    return nil if ! (single_quotes_match || double_quotes_match)
    
    if double_quotes_match
        # TODO
        raise "\n\nDouble quotes not yet supported! srry"
    else
        number_of_quotes = single_quotes_match[0].size
        valid_quote_start_size = 1
        # find the size of the starting quote, which can be any power of three
        largest_power_of_3_that_fits = 3**(Math::log(number_of_quotes, 3)).floor
        pullOff! /\A('{#{largest_power_of_3_that_fits}})(.*?)\1/, string, response: ->(indent: nil, match: nil) do
            {
                type: "#string",
                value: match[2],
                indent: actual_indent,
            }
        end
    end
end

def pullOffBlock!(string)
    block = ""
    starting_line_pattern = /\A[ \t]*\n/
    # check that nothing remains on the starting line
    if string =~ starting_line_pattern
        # pull off that starting line
        string.sub!(starting_line_pattern, "")
        # pull off all the indented lines
        loop do
            next_line = pullOff! /\A\n {#{STANDARD_INDENT_SIZE}}(.*)/, string, trim: false, response: ->(indent: nil, match: nil) do
                match[1]
            end
            break if !next_line
            block += next_line
        end
        return block
    end
    nil
end

def pullOffStringBlock!(string)
    string_clone = string.clone
    # TODO: should comments be allowed here?
    pullOffWhiteSpace!(string_clone)
    # TODO: add double quotes
    if string_clone.extract!(/\A'/)
        if block = pullOffBlock!(string_clone)
            # replace string with the string clone
            string.sub!(/[\w\W]/, string_clone)
            return {
                type: "#string",
                value: block,
                indent: actual_indent,
            }
        end
    end
    nil
end

def pullOffValue!(string)
    pullOffInlineTypedValue!(string)||
    pullOffEmptyContainer!(string) ||
    pullOffKeyTerm!(string) ||
    pullOffNumber!(string) ||
    pullOffAtom!(string) ||
    pullOffInlineString!(string)||
    pullOffStringBlock!(string)||
    pullOffContainerBlock!(string)
end

def pullOffListElement!(string)
    string_clone = string.clone
    
    return nil if string_clone.extract!(/- /) == nil
    return nil if (value = pullOffValue!(string_clone)) == nil
    
    # replace string with the clone
    string.sub!(/[\w\W]*/, string_clone)
    return {
        type: "#listValue", 
        value: value,
    }
end

def pullOffKey!(string)
    # PROBLEM: what about special_terms as keys
    # FIXME: add smart keys
    return_value = (pull_off_key_term = pullOffKeyTerm!(string)) || 
        (pull_off_number = pullOffNumber!(string)) ||
        (pull_off_atom = pullOffAtom!(string)) ||
        (pull_off_inline_string = pullOffInlineString!(string))
    puts "pull_off_key_term is: #{pull_off_key_term} "
    puts "pull_off_number is: #{pull_off_number} "
    puts "pull_off_atom is: #{pull_off_atom} "
    puts "pull_off_inline_string is: #{pull_off_inline_string} "
    return return_value
end

def pullOffKeyedElement!(string)
    string_clone = string.clone
    
    return nil if (key = pullOffKey!(string_clone)) == nil
    puts "key is: #{key} "
    # TODO: record this indent somehow
    trailing_key_indent = pullOffWhiteSpace!(string_clone)
    return nil if string_clone.extract!(/\A:/) == nil
    return nil if (value = pullOffValue!(string_clone)) == nil
    return {
        type: "#keyValue", 
        key: key,
        value: value,
    }
end

def pullOffContainerBlock!(string)
    return nil if (block = pullOffBlock!(string)) == nil
    processContainerBlock!(block)
end

def processContainerBlock!(block)
    original_block_content = block.clone
    container = []
    # if there's still text to process
    loop do
        starting_string_size = block.size
        # remove excess whitespace
        block.extract!(/\A\s*\n+/)
        
        # comments
        container.push(
            pullOffComment!(block) ||
            pullOffListElement!(block) ||
            pullOffKeyedElement!(block)
        )
        
        # check for graceful end
        if block =~ /[ \t]*\z/
            # TODO: detect container type based on contents
            return {
                type: "#container",
                value: container
            }
        end
        
        # FAIL (no progression)
        if starting_string_size == block.size
            puts "FAILED"
            puts "    got to #{block.size} starting from #{original_block_content.size}"
            puts "    original block:\n#{original_block_content.gsub(/(\n|\A)/, '    \1')}"
            break
        end
    end
end

require "yaml"
puts processContainerBlock!(file_contents).to_yaml