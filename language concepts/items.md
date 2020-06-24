# items

Items are what'd you'd typically think of as a variable. In mathematics mappings and functions are no different (the definition of a function is a mapping from inputs to outputs). However, in most languages maps and functions are separate concepts. XD tries to go back to mathematics and join the concept without loosing performance.

Every item is mapping. The only thing that isn't an item is an operator, and that is because operators are replaced with functions at compile time (so in some ways they are also items). In Python they're called dictionaries, in Ruby they're called hash maps.
```
someFibonacciDigits@1 << 0
someFibonacciDigits@2 << 1
someFibonacciDigits@3 << 1
someFibonacciDigits@4 << 2
someFibonacciDigits@5 << 3
someFibonacciDigits@6 << 5
someFibonacciDigits@7 << 8
someFibonacciDigits@8 << 13
someFibonacciDigits@9 << 21
someFibonacciDigits@10 << 34
```
Whats going on here? Well here's an equivlent form of the code that might help
```
someFibonacciDigits(@1) << 0
someFibonacciDigits(@2) << 1
someFibonacciDigits(@3) << 1
someFibonacciDigits(@4) << 2
someFibonacciDigits(@5) << 3
someFibonacciDigits(@6) << 5
someFibonacciDigits(@7) << 8
someFibonacciDigits(@8) << 13
someFibonacciDigits(@9) << 21
someFibonacciDigits(@10) << 34
```
This is another equivlent form
```
someFibonacciDigits(1) << 0
someFibonacciDigits(2) << 1
someFibonacciDigits(3) << 1
someFibonacciDigits(4) << 2
someFibonacciDigits(5) << 3
someFibonacciDigits(6) << 5
someFibonacciDigits(7) << 8
someFibonacciDigits(8) << 13
someFibonacciDigits(9) << 21
someFibonacciDigits(10) << 34
```
Those are all numbers but we could also just as easily map them to strings
NOTE: storing at a string is different place then saving at a number
```
someFibonacciDigits("1") << 0
someFibonacciDigits("2") << 1
someFibonacciDigits("3") << 1
someFibonacciDigits("4") << 2
someFibonacciDigits("5") << 3
someFibonacciDigits("6") << 5
someFibonacciDigits("7") << 8
someFibonacciDigits("8") << 13
someFibonacciDigits("9") << 21
someFibonacciDigits("10") << 34
```
Those will likely be using a hashmap at runtime. However, there are more than 10 items in the fibonacci sequence so lets make this a bit less redundant
```
#siphon[someFibonacciDigits]
    If: #input > 2
    Then: #finalOutput someFibonacciDigits(#input-1) + someFibonacciDigits(#input-1)
someFibonacciDigits@1 << 0
someFibonacciDigits@2 << 1

# lets test a large value
##output someFibonacciDigits@1024
```
Now we have a funcitonal definition, yet it still behaves very much like a mapping. You might think that function would take (relatively) a lot of runtime since it's recursive, however it actually doesn't. The previous statement is somewhat deciving though because it simply does all that work at compile time since the output doesn't depend on runtime input.

There's one big ambiguity that needs to be clarified however. Functions can only have 1 formal argument, so basically all functions use lists which is a more powerful tool than having multiple arguments.
```
# directly using a single argument : someFibbonacciDigits(1)
# directly using a single argument : someFibbonacciDigits(@1)
# directly using a single argument : someFibbonacciDigits@1
# using a list as a wrapper        : someFibbonacciDigits([@1])
# using a list as a wrapper        : someFibbonacciDigits([1])
# using a list as a wrapper        : someFibbonacciDigits[1]


# So lets very slightly change the siphon to handle that

#siphon[someFibbonacciDigits]
    If: #input@1 > 2
    Then:
        #finalOutput someFibbonacciDigits[ #input@1 - 1 ] + someFibbonacciDigits[ #input@1 - 2 ]
        
someFibbonacciDigits[1] << 0
someFibbonacciDigits[2] << 1

```

Lets make this a bit more clean with some shorthand syntax

```
someFibbonacciDigits#mapping:
    [1]; 0
    [2]; 1
    #if: #1 > 2 
        Be: #recursive[ #1 - 1 ] + #recursive[ #1 - 2 ]
```

Items are always there when called, there is no declaration syntax. In fact, as soon as there is a non-literal that is a sequence of letters, it is considered a valid item. Items are names with letters and must start with a lowercase letter. Every item has keys and value. Mixing an item into another item, for example mixing a "dollar" item into a item with a value of 10, essentially gives the item all of the "dollar" abilities (aka $10). At a technical level, what it does is it looks at every key and value in "dollar" and attaches them (through a soft link) to the item with a value of 10. Assigning a soft link to a new value won't change the "dollar" item, it will only change the item with a value of 10. Items that have not been assigned a value are mixed with the "default" item. So using a never-before-seen variable in an equation will not result in an error, it will just be a mixed-copy of the root item (if you prefer for this to cause an error this behavior can be changed). Anything can be a key; a number, a string, a list, anything they're all items. Items are considered "unique" based on their @hash method. Default items use their memory address as an identifier, but most things use their value as an identifier. Atoms like @aKey are the typical way to use keys. There are system keys like #reference that handle special magic like listing out all keys, getting the name of the item, and creating hard and soft links between items.



# 
# function behavior
# 

since functions are objects, they store data on themselves.

```XD
addTwoThings << func:
    placeHolderValue << #input@1 + #input@2
    #finalOutput << placeHolderValue


# creates a function instance but we can't see it
theNumberTen << addTwoThings[ 4, 6 ]
##output theNumberTen

# this will print out 10


# create a instance 
functionInstanceForTen << func1#newInstance[3, 7]
##output addTwo

# this will print out the following
# item:
#     #access:
#         placeHolderValue << #input@1 + #input@2
#         #finalOutput << placeHolderValue
#     #instances:
#         1:
#             #input: [3, 7]
#             placeHolderValue: 10


# using #thisInstance inside the function itself would output
#     #input: [3, 7]
#     placeHolderValue: 10

# additional data is stored on the instance such as, if is finished. This is important for functions that continually output values
```

All functions can be simple, asynchronous, or treated as generators.
```XD
func1 << func:
    #output 10
    #output 11
    #finished
```
#input is how to access a functions arguments


# computed functions
A (likely) unique feature of XD is that it can create efficient pseudo-pure functions that behave similar to that of functional languages. For example, creating a `rectangle` object with an `@area` method. The `@area` is purely based on a few other variables, namely `width` and `height`. If you retrieve the area often enough, its inefficient to always compute it. XD can watch changes being made to any variable. Because of this, it can save the @area output, and simply keep using that same value until either the `width` or `height` change. Once they change, the cache is invalidated, and the next time the area is called it is recalculated.