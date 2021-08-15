# Literals
Examples of literals are numbers 123 and "strings". Literals can be defined by the user. Literals cannot start with letters or whitespace. To define a literal two functions must be provided, one that takes a string and reports if the literal exists at the beginning of the string (Boolean) and the other that takes the string and converts it into typical/normal valid XD code. For example, a function could look for hexadecimal numbers (starting with 0x) and then it's output would be the decimal form of that hexadecimal number. Literals are parsed first, meaning if there was an operator (like ") the operator would be ignored and the literal would be found.
The basic literals are
- real numbers: 123
- quotes: "hello"
- atoms: TRUE
- special keys: #reference
