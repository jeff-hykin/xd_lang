# Concepts:
- ignored (whitespace and comments)
- punctuation (parenthese, colon, square brackets)
- custom (keywords)
- literals (atoms, strings, numbers)
- items (object/variables)
- operators (syntatical sugar for function)

# Challenges
- how functions access their parent (#ancestors@1?) 
- how to create an inline hash map (semicolons?) {value; 10, other; 11}
- named optional arguments
- how to handle the `...`
- how to handle the unrary `-` operator
- a way to dynamically get a atom-method

# Considerations
- allow the `if 1 = 2 Then:` syntax by searching for the next caps-word and not allowing lowercase words inbetween unless inside ()'s
- remove the _ from variable names and atoms
- add the "key" literal such as \key where each one is perfectly unique. Or maybe better, find a way to pervent/detect/report library overlaps by seeing what a library changes
- ask people: 
  - what is a good variable name that contains a number 
  - when would interpolation not work as a replacement for backslash-escape
- unevaled code syntax, maybe {}, if (1 = 2)then{ a << 10 }
- deconstruction syntax
  { a , b } = listThingy
  [ a , b ] = listThingy

# Punctuation
All of the punctuation can be changed/swapped, but can't be removed.
This includes comments, list start/end, hashmap start/end, function calls, and line separators.
Lists use [ ]'s with commas inbetween values
Functions can be called in two different ways. The inline way with parentheses and the block way with colons. For example: 
```
aFunc(10)
aFunc: 10
aFunc(1,2,3)
aFunc: 1,2,3
```
The parentheses way actually works without parentheses, just putting a value next to a function will call it. For example:
```
aFunc 10
```
However, this only works for 1 argument. For example:
`aFunc 10, 11`
Would fail, and:
`aFunc 10 11`
Would be equivalent to doing:
`aFunc(10)(11)`
Which would only work if the first function returned a function.
In terms of order of operations, the default behavor is that
`aFunc 10 + 10`
would be equivlent to
`aFunc(10) + 10`
However, because this is ambigious, it is not allowed
However-however, `aFunc: 10 + 10` is allowed and it is interpreted as `aFunc(10 + 10)`

edgecases to consider:
`var(aFunc(10))`
`var aFunc 10`
`var+var2(aFunc(10))`
`(var+var2)(aFunc(10))`
`(var+var2)aFunc(10)`
`(var1+var2) aFunc 10`

`var(add(10))`
`var add 10`
`var+var2(add(10))`
`(var+var2)(add(10))`
`(var+var2)add(10)`
`(var1+var2) add 10`



There are no keywords in XD, only functions/variables. The block syntax can be called with the value on an indented newline similar to yaml values. Functions also have a special ability to have their arguments be visually split up. For example:
is(5)GreaterThan(6)
However, they can only do this if they use camel case (notice the G in Greater is capitalized). The same function could be called like this:
is: 5
GreaterThan: 6
The arguments must be provided in a way that the next part of the function name is a capital letter. Otherwise there would be no way to tell if it was one function call or two different functions being called. While the parenthese must contain valid XD code, the colon syntax allows for magic to happen.
There is a type of function called a parser function that can perform some magic at compile time. For example:
html:  <script></script>
Could be valid, it would be up to the html function, and the function would parse it's argument at compile time. Parser functions have a special definition, and once they're created, their name cannot be changed/deleted/renamed (it is a constant). Parser functions also cannot be passed as arguments, they can only be called. Hopefully in the future, parser functions will be able to behave more like normal function.



# Literals
Examples of literals are numbers 123 and "strings". Literals can be defined by the user. Literals cannot start with letters or whitespace. To define a literal two functions must be provided, one that takes a string and reports if the literal exists at the beginning of the string (Boolean) and the other that takes the string and converts it into typical/normal valid XD code. For example, a function could look for hexadecimal numbers (starting with 0x) and then it's output would be the decimal form of that hexadecimal number. Literals are parsed first, meaning if there was an operator (like ") the operator would be ignored and the literal would be found.
The basic literals are
- real numbers 123
- quotes "hello"
- atoms @true
- special keys #reference


# items
Items are what'd you'd typically think of as a variable.
- All items are hashmaps. 
- All items are objects. 
- All functions are items
- All literals (result in) an item
The only thing that isn't an item is an operator.
Items are names with letters and underscores and must start with a lowercase letter. In fact, as soon as there is a non-literal that is a sequence of letters, it is considered a valid item. Every item has keys and values because it is a hashmap. Mixing an item into another item, for example mixing a "dollar" item into a item with a value of 10, essentially gives the   item all of the "dollar" abilities (aka $10). At a technical level, what it does is it looks at every key and value in "dollar" and attaches them (though a soft link) to the item with a value of 10. Assigning a soft link to a new value won't change the "dollar" item, it will only change the item with a value of 10. Items that have not been assigned a value are mixed with the "start" item. So using a never-before-seen variable in an equation will not result in an error, it will just be a mixed-copy of the root item (if you want an error this behavior can be changed). Anything can be a key, a number a string, a list, anything that is hashable. To give a key and access the value simply put the key next to the item. For example: an_item(10), an_item("hello") an_item(@atom_key). The following also work: an_item10, an_item"hello", an_item@atom_key. Atoms like @a_key are the typical way to use keys. There are system keys #reference that handle special magic like listing out all keys, getting the name of the item, and creating hard and soft links between items.


# operators
Operators are symbolic; they cannot contain any letters. There are no special operators. There's no "and", "or", or "new" operator. Operators get converted into function calls at compile time, they just have additional information about where to place the ()'s based on the order of operations (Eval compiles the code before running it). The colon, comma, square brackets, and parentheses are the only symbols that are both not-literals and not-operators. Operators have to be declared at compile time. Operators can be user defined. There is a simple infix-operator definition with a fixed precedence and also an advanced definition. Operators must work on valid XD code, they can't perform magic like functions with block syntax. Operators have their precedence defined as a floating point number and a direction of either left or right. A decimal number is used for precedence because it is an absolute scale (no need to know what other operators are placed at) but, unlike an integer, it also allows putting any operator between any other two operators.

#  
# 
# concepts
# 
#  


# external code
there are 5 different ways of using external code
#import
#include
#paste
#activate
#run
For example:
#include: geko_lang

All of these can accept one argument: a local file path, a library name with a version number, or a URL. All of them are processed at compile time, therefore it is possible to perfectly guarantee that all XD file dependencies have been met without running the files.
The #import is safe, it will not allow for any namespace pollution, and it returns a value.
The #include behaves allows for the external code to define global names, it allows it to change symbols and definitions, and adding/removing operators and literals.
However, both #import and #include will only run their files once.
#paste should be a rarely used option, but it is identical to copying and pasting the external code in that exact location. This can produce some very unexpected results.
The #activate is just like #import, but it will run the file every time. The #run is just like #include but it runs the file every time rather than only once.

# 
# functions
# 
Basic functions are just a block of code that have access to #input and #output, however all values are passed by deep copy. There is no return statement, to return a value you have to assign it to the #output variable. Basic functions also have access to the external scope. Advanced functions let you handle things like mutating arguments, or enforcing purity. Functions also have access to #this which only works when it is a member value of a variable. Functions also have access to #this_function which is used for static variables and generator-like functions. Functions can have guards (super-type safety) and documentation built into them. In the future, functions will be capable of having compile-time guards for efficiently getting type safety. Functions can also be started and not be required to finish. They can be started with #schedule which returns a task-variable (similar to a JavaScript promise) and then the task can be waited on anywhere else in the program. Functions can continuously perform output by using #OUTPUT.send(), which sends data to external code without ending/stopping the function. For example:
task << readFiles#schedule("file1", "file2")
first_value << task#receive
second_value << task#receive
The function is doing work asynchronously, it could finish everything immediately, and then the #receive just pops it off the stack, or the code could get to the #receive first, and need to wait for the function to finish sending its first value. The task can be cancelled or scheduled with a delay. 

# 
# control flow
# 
Control flow is just a set of functions and operators. In the geko foundation they're defined like this.
if: condition
Then:
    code
ElseIf: condition
Then:
    code
Else:
    code
loop:
    code
    #exit_loop


# 
# assignment
# 
There are lots of assignment operators. The deep copy assignment << first follows any references on the left-side and right-side object, then it creates a deep copy of the attributes of the right side (the #data, #call, #ancestors, etc) and overwrites those values on the left-side object.


# 
# other things to discuss
# 
- how adjectives work, isNull, isNumber
- built in tools
    - #this_variable for self-reassignment
    - #global for scope access
    - #goto for fundamental control flow
    - #new_variable for defining items without 
    - #scope for accessing external scope layers
- item-based optimization rules


# 
# parsing
# 
step 1: tokenize
- nothing is destroyed, only labeled
- everything is broken into variables, literals, blocks, operators, and non-functional tokens
- changes to the punctuation are pulled in and applied immediately
- after each statement, the function calls are grouped/wrapped
- whenever a new scope is created, there needs to be a wrapper for it
- the statement is scanned, pulling in operator-definitions, parser-function definitions, and updating their local values. The also need to record what scope they were defined in.
- each statement is scanned for parser function calls. The parser for that parser function is looked up and provided with the code block, as well as a deep copy of the punctuation changes, the operator-definitons, and the parser-function definitions, and the current scope. The parser of the parser function then needs to return a fully-tokenized output, which many times will mean it becomes recursive
- each operator is labeled with its precedence, and function call (including the scope of the function call)

step 2: convert to pure-XD
- destructive step
- remove all non-functional tokens (whitespace and comments)
- the punctuation characters themselves are irrelevant at this point, all that is left is the data. For example a block function call and an inline function call will be treated as equivalent.
- each statement is converted into a pure-XD form, which is a custom-defined Ruby object. There are only 3 classes that are allowed: XD primitive literals, XD function calls, and target-language function calls.
- All generic variables are converted into an XD function call #get_variable
- All non-system function calls are converted into #call( *value*, *argument-list* )
- All operator sequences are converted into XD function calls based on precedence. They call their function based on the scope it was defined in. So #call( #get_variable( "func_name", *scope*), *operator-arguments*)
- All literals must return a pure-XD form (will often return just an XD primitive-literal)
- Parser functions are also converted into their pure-XD form

step 3: translate 
All XD functions and XD literals are given a direct equivalent within a target language. Each item is then directly, recursively, converted into the target language. So long as the language has generic lambda functions, data mutation, and generic hashmaps, this last step should be decently easy. 

# translate to C++
- every var is just a key in one giant hashmap of scopes and variables
- every turtle function call exists in C++
- every dynamic function is a sequence of function calls
- every nested function call is recursively un-nested and replaced with a unique variable holding it's output
- all dynamic XD functions would be represented by a vector of function calls, each call would have a pointer which would either be a pointer to another dynamic function or a function pointer to a turtle function, then it would have the name of where it's output should be stored (scope name and variable name), then it would have a list of all of its arguments. The function would have a "run" method that would accept arguments and put them on the scope/stack, then it would perform each call in succession, fetching the argument values, and recursively drilling down until a turtle function was found and called with the argument and the value was stored in a variable and returned up the chain.




# 
# Advanced/Future optimizations
# 


# file-storage as cache
Have a optimization process where
if a variable is a result of a long manipulation on a file
then cache the result into storage, and then (if the code and files don't change) just load the storage cache