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