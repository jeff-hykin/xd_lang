`string: blablalkdfjladskjflajsk`

`"double quotes"`
`""""double quotes""""`
`"""""""double quotes"""""""`
`'single quotes'`
`'''single quotes'''`
`'''''''single quotes'''''''`



Double quotes have an interpolation operation
```
myName << "Jeffff"
##output "Hello {myName}"
# displays as "Hello Jeffff"
```
Single qoutes however are literal 
```
myName << "Jeffff"
##output 'Hello {myName}'
# displays as "Hello {myName}"
```

However the easiest way is to use the string tool
```
myName << string: Jeffff
##output string: Hello {myName}
```

There are no escape characters in XD Lang. You can change this, but let me explain why I recommend you don't.
For newlines and tabs, use the string command
```
##output string:
    Hello World
    My name Jeffff
```

For more advanced characters there are two objects, `unicode`, and `ascii`.

`ascii@esc`
`ascii@nul`
`unicode@newline`
`unicode@return`
`unicode@tab`

You can use them with hex and decimal number codes as well.

```
nullTerminatedString << "This is string{ascii@nul}"
```

If you need double quotes in a double quote, just use 3^1 (aka three) double quotes 
`""" double "" quote """`.
If you need 3 double quotes, then use 3^2 (aka nine)
`""""""""" so """"" many """"" double """"" quotes """""""""`.
If you need 9 double quotes, then use 3^3 (aka twenty seven) double qoutes
`""""""""""""""""""""""""""" too many """"""""" double quotes """""""""""""""""""""""""""`.
You can keep following this pattern until your PC runs out of storage

```
""         # empty string
"""        # start of triple-double
""""       # start of triple-double, followed by double quote
"""""      # start of triple-double, followed by double quote, followed by double quote,
""""""     # empty triple-double quote
"""""""    # triple-double quote, double quote, triple-double quote
""""""""   # triple-double quote, double quote, double quote, triple-double quote
"""""""""  # noncuple(9)-double quote start
```


