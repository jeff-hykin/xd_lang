

# multi block
the `#where`
```
if[ name#isDefined ]then[ sayHello ]else[ askForName ]
#where:
    sayHello;
        output: Hello {name}
    askForName;
        name << "What is your name"

```