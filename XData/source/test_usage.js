let {parseData1} = require("./to_node_json")

let value = parseData1(`

@using_atk_version: "1.1.0"
@project:
    name: XD Lang
    description: So good, you'll laugh at the idea of using anything else
    
    @commands:
        run: echo 'no run command written yet'
        run_ruby_example: #create[ruby,code]: #textLiteral:
            puts 'replace this with your own ruby code'
        setup: echo 'setup command unset'
    
    @paths:
        project_root: "./"


'explaination/todo':
    - tokenize
    - single pass dynamic compile
    - generate pure-XD yaml
    - convert pure-XD to target language
    - add the XD runtime of the target language


`)
console.debug(`value is:`,value.documentNodes[0].contains)
console.debug(`value is:`,JSON.stringify(value.documentNodes[0].contains, null, 4))
