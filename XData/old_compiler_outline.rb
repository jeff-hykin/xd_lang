file_contents = IO.read(ARGV[0])

STANDARD_INDENT_SIZE = 4

# 
# keys
#
    # number
        # integer
        # decimal
    # atom
    # string
        # unquoted
        # double
        # single


# TODO: add
    # tags for things like \set or \json
    # references
    # interpolation
    # comments

# 
# number
# 
integer = /\d+/
decimal = /\d+\.\d+/
# LATER: scientific notation
# LATER: hex
# LATER: octal
atomic_number_option = /@?(?<number>#{integer}|#{decimal})/
number_key = /#{atomic_number_option} *:/
number_value = atomic_number_option
number_match_to_value = ->(match) do
    match['number'] && eval(match['number'])
end

# 
# atoms
#
atom_pattern = /@(?<atom>[a-zA-Z_0-9]+)/
atom_key = /#{atom_pattern} *:/
atom_value = atom_pattern
atom_match_to_value = ->(match) do
    match['atom'] && eval(":#{match['atom']}")
end

# 
# strings
# 
# @ is atoms, \ is for tags, - is for lists, : is for mappings
unquoted_key = /(?<unquoted>[^\n\r:\\@\-][^\n\r:]*) *:/
single_quoted_key = /'(?<single_quote>(?:\\[^\n\r\v]|[^'\\\n\r\v])*)' *:/
double_quoted_key = /"(?<double_quote>(?:\\[^\n\r\v]|[^"\\\n\r\v])*)" *:/
string_key = /#{unquoted_key}|#{single_quoted_key}|#{double_quoted_key}/
string_block = ->(indent){ /(?<block_quote>(?:"|')(?:\n#{indent}.*)+)/ }
string_value = ->(indent){ /#{double_quoted_key}|#{single_quoted_key}|#{string_block[indent]}/ }
string_match_to_value = ->(match) do
    # FIXME: handle the escapes of double quotes
    single_line = match['unquoted'] || match['double_quote'] || match['single_quote']
    if single_line
        return single_line
    else
        string = match['block_quote']
        return string.sub(/\A(?:"|')/,"").gsub(/\n#{match['indent']}/,"\n") rescue nil
    end
    
end

# 
# list
# 
list_element_start = /-/

# 
# mapping
# 
any_key = /(?:#{number_key}|#{atom_key}|#{string_key})/

# TODO: handle incoming indents and standardize them

remaining_contents = file_contents
key_stack = [ :root ]
output_object = { root: nil }
indent = ""
loop do
    current_indent = indent
    next_indent = current_indent + (" "*4)
    assign_to_key = ->(value) do
        parent_keys = key_stack[0...-1]
        current_key = key_stack.last
        parent = output_object
        if parent_keys.length > 0
            parent = output_object.dig(*key_stack[0...-1])
        end
        puts ""
        puts "value is: #{value} "
        puts "key_stack is: #{key_stack} "
        puts "parent is: #{parent} "
        puts "output_object before is: #{output_object} "
        parent[current_key] = value
        puts "output_object after is: #{output_object} "
    end
    
    #
    # exit condition
    # 
    if remaining_contents =~ /\A\s*\z/ 
        break
    else
        # TODO: add an infinite loop check
    end
    if key_stack.length == 0
        raise <<~HEREDOC
            
            
            Somehow the root element got removed from the stack, but there was more data left in the document
        HEREDOC
    end
    
    # 
    # mapping
    #
    mapping_regex = /\A( *\n)*(?<indent> *)#{any_key}/
    mapping_match = remaining_contents.match(mapping_regex)
    if mapping_match
        indent_of_key = mapping_match['indent']
        # if more-indented, then its the first key in a new mapping
        if indent_of_key.length > current_indent.length
            # set the current value to be a map
            puts "\nassignment 1"
            assign_to_key[{}]
            # get the value of the key
            key = nil
            key ||= number_match_to_value[ mapping_match ]
            key ||= atom_match_to_value  [ mapping_match ]
            key ||= string_match_to_value[ mapping_match ]
            key_stack.push(key)
            # fill in the key with a pending (nil) value
            assign_to_key[nil]
        # if less-indented, then its the end of one or more lists/maps
        # if equally indented, then the key_stack won't be adjusted
        else
            # remove keys to get back
            number_of_indents = current_indent.scan(/ /).size / STANDARD_INDENT_SIZE
            # the +1 is because of the root key
            key_stack = key_stack.first(number_of_indents + 1)
            # now add the key 
            
            # this should always be a hash, something weird like mixing maps an sequences would have to happen to trigger it
            if (not output_object.dig(*key_stack).is_a?(Hash))
                if key_stack.length > 1
                    raise <<~HEREDOC
                        
                        
                        When I'm parsing at #{key_stack} there's a new key, but the value at #{key_stack} isn't a map
                        its: #{output_object.dig(*key_stack).inspect}
                    HEREDOC
                else
                    puts "\nassignment 2"
                    assign_to_key[{}]
                end
            end
            # get the value of the key
            key = nil
            key ||= number_match_to_value[ mapping_match ]
            key ||= atom_match_to_value  [ mapping_match ]
            key ||= string_match_to_value[ mapping_match ]
            key_stack.push(key)
            # fill in the key with a pending (nil) value
            assign_to_key[nil]
        end
        indent = mapping_match['indent']
        # remove what has already been processed
        remaining_contents.sub!(mapping_regex,"")
        next
    end
    
    # 
    # list
    # 
    regex = /\A( *\n)*(?<indent> *)#{list_element_start}/
    match = remaining_contents.match(regex)
    if match
        indent_of_key = match['indent']
        # if more-indented, then its the first key in a new mapping
        if indent_of_key.length > current_indent.length
            # set the current value to be a list
            puts "\nassignment 4"
            assign_to_key[ [] ]
            # first element
            key_stack.push(0)
        # if less-indented, then its the end of one or more lists/maps
        # if equally indented, then the key_stack won't be adjusted
        else
            # remove keys to get back
            number_of_indents = current_indent.scan(/ /).size / STANDARD_INDENT_SIZE
            # the +1 is because of the root key
            key_stack = key_stack.first(number_of_indents + 1)
            # now add the key 
            
            # this should always be a hash, something weird like mixing maps an sequences would have to happen to trigger it
            if (not output_object.dig(*key_stack).is_a?(Hash))
                # only exception is the inital (root) key
                if key_stack.length > 1
                    raise <<~HEREDOC
                        
                        
                        When I'm parsing at #{key_stack} there's a new key, but the value at #{key_stack} isn't a map
                        its: #{output_object.dig(*key_stack).inspect}
                    HEREDOC
                else
                    puts "\nassignment 5"
                    assign_to_key[ [] ]
                end
            end
            # remove the old index
            key_stack.pop()
            # push the key (index) of the current element
            key_stack.push(output_object.dig(*key_stack).length)
            # fill in the key with a pending (nil) value
            assign_to_key[nil]
        end
        indent = match['indent']
        # remove what has already been processed
        remaining_contents.sub!(mapping_regex,"")
        next
    end
    # TODO
    
    # 
    # primitves
    #
    regex = /\A\s*(?:#{number_value}|#{atom_value})/
    match = remaining_contents.match(regex)
    if match
        
        value = nil
        value ||= number_match_to_value[ match ]
        value ||= atom_match_to_value  [ match ]
        value ||= string_match_to_value[ match ]
        
        # put the value on the object
        if output_object.dig(*key_stack) != nil
            raise <<~HEREDOC
                
                
                There is probably a duplicate key for #{key_stack}
                the previous value is: #{output_object.dig(*key_stack)}
                the next value is: #{value}
            HEREDOC
        end
        
        puts "\nassignment 3"
        assign_to_key[value]
        
        # remove what has already been processed
        remaining_contents.sub!(regex,"")
        
        # because a value was found, the stack always gets popped
        key_stack.pop()
    end
end

puts "output_object is: #{output_object} "