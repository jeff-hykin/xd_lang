Main concept overview 
- Universal names
- Events
- Operators are just functions
- Data
    - Variables don't need values to be useful, theyre just symbols
    - Always pass by reference
    - Everything is a node
- Maps and Functions look the same
- Adjectives/Siphons


Concepts
- Universal names
    - tranditional variable-like names are considered "temporary"
    - names that start with # are considered universal
- Events
    - everything is a response to an event
    - `#when#run: stdout: "hello world"`, `#when#compiled`
    - macros are functions that run at compile time
    - keywords are just triggers for macros
- Operators are just functions
    - operators are just macros to a function
    - By default they map to universal names like #equals or #greaterThan
- Data
    - Variables don't need values to be useful, they're just symbols
        - Most languages have the idea of `constants`, `async`, `public` as built-in keywords
        - However, all of those belong in a broader category of "relationships" or "constraints" 
        - Saying `const a` is not categorically different from saying `a < 10 # always`
        - XD gives you the power to add arbitrary constraints
        - We may not know what a is, but that doesn't mean we know nothing.
        - Relationships are (currently) immutable. Once a global-constant, always a global-constant.
        - This close to math, but math is broken, so it is a little bit different
        - The big difference is every item is "its own thing" 
            - for example `a#debug#name` is `"a"`
            - we cant say `a = b`, because `a#debug#name` is `"a"` and `b#debug#name` is `"b"` so theyre not *totally* equal
            - However! There is a formal version `##equivlence[ a#value, b#value ]`, and this part does behave like mathematics
            - we might not know what `a#value` is, but we do know, in every measureable way, it is the same as `b#value`
    - Always pass by reference
        - The formal way assignment is done is like `a#value => 5`. 
        - That is quite verbose though, so instead we use `a#literally` to mean `a` (formal), and `a` (informal) to mean `a#value`
        - This automatic "a is actually a#value" only happens at runtime though, this is so macros have access to `a#literally` and are not stuck with just the value of a.
        - If you do `a#value => 5` and `b#value => a`, it doesn't mean `b#value` is 5. `b#value` is `a`, and *right now* `a#value` is 5.
        - If you want `b#value` to be the value of a, then you'll need to say that properly! `b#value => a#value`
        - when data is moved around from name to name, we would say it is "wrapped"
        - If you did `b => a#literally`, then `b#debug#name` would be `"a"` and `b#literally#debug#name` would be `"b"`
        - Arugments to functions are passed #literally not by value.
    - Everything is a data node by default
        - `a#literally` is a node. And everything, even `#value` is a connection from `a#literally` to some other node.
        - what is the value of a something like `5` ? e.g. what is `5#value`? Glad you asked! The value of it isssss... itself! `5#value = 5` it is perfectly value for a node to have a connection back to itself. Same with literal strings or anything else that can be considered a literal. By default every variable is a literal until its assigned to something. Pure-literals both are equal to themself and cannot be assigned.
        - Arbitrary connections can be made. For lists, numbers are used as connections, and the elements are the nodes at the other end of the connection. `a@1 => 100` (element #1 is 100, or `a` has an edge (`1`) that connects to the literal `100`)
            
- Maps and Functions look the same
    - Mathematically speaking, functions just map input values to output values. So, XD treats them as being the same. 
    - How? well `a#connectionManager` lets you define what happens whenever a connection is requested. It gets access to a#literally, while everything else merely gets access to the illusion of `a#literally`. The first a#connectionManager gets to decide what to output for all connections, including what to output for the a#connectionManager connection! The first connectionManager could lock everyone out.
    - The connection `a(b)` or `a@b` really means `a(b#value)`, however `a(b#literally)` is completely allowed. The only caveat is that you'll have to literally have access to b itself to get back to that connection. This can be quite useful for making secret/private connections by using local variables as keys.
- Magic words are macros
- Adjectives/Siphons



