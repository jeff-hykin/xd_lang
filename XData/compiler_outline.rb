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
    $atom_pattern = /\A(@)([\w]+)/,
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

# 
# debugging
#

DEBUG = true
$indent_amount = 0
def debug_block( name, block)
    dp("START: #{name}\n") if name
    $indent_amount += 4
    output = block[]
    dp("OUTPUT:\n")
    $indent_amount += 4
    dp(output)
    $indent_amount -= 4
    $indent_amount -= 4
    dp("END: #{name}\n") if name
    return output
end
def dp(args)
    return if !DEBUG 
    if args == nil 
        puts (' '*$indent_amount)+"nil"
    elsif args == ""
        puts (' '*$indent_amount)+"''"
    elsif args.is_a?(Hash) || args.is_a?(Array)
        puts args.to_yaml.gsub(/^/, ' '*$indent_amount)
    else
        args = "#{args}"
        if args.match(/\n/)
            puts args.gsub(/^/, ' '*$indent_amount)
        else
            puts args.inspect.gsub(/^/, ' '*$indent_amount)
        end
    end
end



class String
    def extract!(regex, group=0)
        if match = self.match(regex)
            output = match[group]
            self.sub!(regex, "")
            return output
        end
    end
    
    def replace_with!(new_string)
        self.sub!(/[\w\W]*/, new_string)
    end
end

def pullOffWhiteSpace!(string)
    string.extract!(/\A[ \t]*/)
end

def pullOff!(pattern, string, response)
    string_copy = string.clone
    indent = pullOffWhiteSpace!(string_copy)
    return nil if (match = string_copy.match(pattern)) == nil
    return nil if (output = response[indent: indent, match: match]) == nil 
    
    pullOffWhiteSpace!(string)
    # pull it off the string
    string.sub!(pattern, "")
    # return the hash if successful
    return output
end

def pullOffComment!(string)
    debug_block "pullOffComment!", ->() do
        pullOff! $comment_pattern, string, ->(indent: nil, match: nil) do
            {
                type: "#comment",
                value: match[1],
                indent: indent,
            }
        end
    end
end

def pullOffType!(string)
    debug_block "pullOffType!", ->() do
        pullOff! $type_pattern, string, ->(indent: nil, match: nil) do
            {
                value: match[2],
                indent: indent,
            }
        end
    end
end

def pullOffInlineTypedValue!(string)
    debug_block "pullOffInlineTypedValue!", ->() do
        string_clone = string.clone
        return nil if (type = pullOffType!(string_clone)) == nil
        output = pullOff! /:(.*)/, string_clone, ->(indent: nil, match: nil) do
            {
                type: type[:asString],
                indent: type[:indent],
                value: indent+match[1],
            }
        end
        string.replace_with!(string_clone)
        return output
    end
end
# TODO: also cover the typed value without the colon


def pullOffEmptyContainer!(string)
    debug_block "pullOffEmptyContainer!", ->() do
        pullOff! $empty_container_pattern, string, ->(indent: nil, match: nil) do
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
end

def pullOffSpecialTerm!(string)
    debug_block "pullOffSpecialTerm!", ->() do
        pullOff! $special_term_pattern, string, ->(indent: nil, match: nil) do
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
end

# TODO: reference

def pullOffNumber!(string)
    debug_block "pullOffNumber!", ->() do
        pullOff! $number_pattern, string, ->(indent: nil, match: nil) do
            {
                type: "#atom/number",
                value: match[0],
                indent: indent,
            }
        end
    end
end

def pullOffAtom!(string)
    debug_block "pullOffAtom!", ->() do
        pullOff! $atom_pattern, string, ->(indent: nil, match: nil) do
            {
                type: "#atom",
                value: match[0],
                indent: indent,
            }
        end
    end
end

def pullOffInlineString!(string)
    debug_block "pullOffInlineString!", ->() do
        string_clone = string.clone
        # find quotes
        actual_indent = pullOffWhiteSpace!(string_clone)
        single_quotes_match = string_clone.match(/\A'+/)
        double_quotes_match = string_clone.match(/\A"+/)
        return nil if ! (single_quotes_match || double_quotes_match)
        dp "single_quotes_match is: #{single_quotes_match} "
        
        if double_quotes_match
            # TODO
            raise "\n\nDouble quotes not yet supported! srry"
        else
            number_of_quotes = single_quotes_match[0].size
            valid_quote_start_size = 1
            # find the size of the starting quote, which can be any power of three
            largest_power_of_3_that_fits = 3**(Math::log(number_of_quotes, 3)).floor
            pullOff! /\A('{#{largest_power_of_3_that_fits}})(.*?)\1/, string, ->(indent: nil, match: nil) do
                {
                    type: "#string",
                    value: match[2],
                    indent: actual_indent,
                }
            end
        end
    end
end

def pullOffBlock!(string)
    debug_block "pullOffBlock!", ->() do
        string_clone = string.clone
        dp "string_clone is: #{string_clone} "
        block = ""
        starting_line_pattern = /\A[ \t]*(?=\n)/
        # check that nothing remains on the starting line
        if string_clone =~ starting_line_pattern
            # pull off that starting line
            string_clone.sub!(starting_line_pattern, "")
            dp "after sub string_clone is: #{string_clone} "
            # pull off all the indented lines
            loop do
                next_line = string_clone.extract!(/\A\n {#{STANDARD_INDENT_SIZE}}(.*)/, 1)
                dp "next_line is: #{next_line} "
                break if !next_line
                block += "\n"+next_line
            end
            string.replace_with!(string_clone)
            return block.sub(/\A\n/,"")
        end
        nil
    end
end

def pullOffStringBlock!(string)
    debug_block "pullOffStringBlock!", ->() do
        string_clone = string.clone
        # TODO: should comments be allowed here?
        pullOffWhiteSpace!(string_clone)
        # TODO: add double quotes
        if string_clone.extract!(/\A'/)
            if block = pullOffBlock!(string_clone)
                # replace string with the string clone
                string.replace_with!(string_clone)
                return {
                    type: "#string",
                    value: block,
                    indent: '',
                }
            end
        end
        nil
    end
end

def pullOffValue!(string)
    debug_block "pullOffValue!", ->() do
        string_clone = string.clone
        result ||= pullOffInlineTypedValue!(string)
        result ||= pullOffEmptyContainer!(string)  
        result ||= pullOffSpecialTerm!(string)         
        result ||= pullOffNumber!(string)          
        result ||= pullOffAtom!(string)            
        result ||= pullOffInlineString!(string)    
        result ||= pullOffStringBlock!(string)
        result ||= pullOffContainerBlock!(string)
        return result
    end
end

def pullOffListElement!(string)
    debug_block "pullOffListElement!", ->() do
        string_clone = string.clone
        
        return nil if string_clone.extract!(/\A-( |$)/) == nil
        return nil if (value = pullOffValue!(string_clone)) == nil
        
        # replace string with the clone
        string.replace_with!(string_clone)
        {
            type: "#listValue", 
            value: value,
        }
    end
end

def pullOffKey!(string)
    debug_block "pullOffKey!", ->() do
        # PROBLEM: what about special_terms as keys
        # FIXME: add smart keys
        results = nil
        results ||= pullOffSpecialTerm!(string)
        results ||= pullOffNumber!(string)
        results ||= pullOffAtom!(string)
        results ||= pullOffInlineString!(string)
        return results if results != nil
        if short_hand_key = string.extract!(/\A\w+\b/)
            return {
                type: "#string",
                value: short_hand_key,
                indent: '',
            }
        end
    end
end

def pullOffKeyedElement!(string)
    debug_block "pullOffKeyedElement!", ->() do
        string_clone = string.clone
        
        return nil if (key = pullOffKey!(string_clone)) == nil
        dp "key is: #{key} "
        # TODO: record this indent somehow
        trailing_key_indent = pullOffWhiteSpace!(string_clone)
        return nil if string_clone.extract!(/\A:/) == nil
        return nil if (value = pullOffValue!(string_clone)) == nil
        dp "value is: #{value} "
        dp "string_clone after pullOffValue! is: #{string_clone} "
        # perform the replacement
        dp "string before is: #{string} "
        string.replace_with!(string_clone)
        dp "string after is: #{string} "
        {
            type: "#keyValue", 
            key: key,
            value: value,
        }
    end
end

def pullOffContainerBlock!(string)
    dp "pullOffContainerBlock! string before is: #{string} "
    return nil if (block = pullOffBlock!(string)) == nil
    dp "pullOffContainerBlock! string after is: #{string} "
    return processContainerBlock!(block)
end

def processContainerBlock!(block)
    debug_block "processContainerBlock!", ->() do
        output = nil
        original_block_content = block.clone
        container = []
        dp "block at start is: #{block.inspect} "
        # if there's still text to process
        loop do
            starting_string_size = block.size
            # remove excess whitespace
            block.extract!(/\A\s*\n+/)
            
            # comments
            debug_block nil, ->() do
                dp "block before:"
                dp block
            end
            container.push(
                pullOffComment!(block) ||
                pullOffListElement!(block) ||
                pullOffKeyedElement!(block)
            )
            debug_block nil, ->() do
                dp "block after:"
                dp block
            end
            
            # check for graceful end
            if block =~ /\A[ \t]*\z/
                # TODO: detect container type based on contents
                output = {
                    type: "#container",
                    value: container
                }
                break
            end
            
            # FAIL (no progression)
            if starting_string_size == block.size
                dp "FAILED"
                dp "    got to #{block.size} starting from #{original_block_content.size}"
                dp "    original block:\n#{original_block_content.gsub(/(\n|\A)/, '\\1        ')}"
                dp "    Container:"
                dp container.to_yaml
                break
            end
        end
        output
    end
end

require "yaml"
puts processContainerBlock!(file_contents).to_yaml