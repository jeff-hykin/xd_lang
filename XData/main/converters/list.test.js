import * as structure from "../structure.js"
import "./non_values.js" // need to load in Comment
import "./atom.js"
import { emptyListToNode } from "./list.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

console.log(`\nempty list`)
console.log(
    toRepresentation(
        emptyListToNode({
            remaining: `[]`,
            context: new structure.Context(),
        })
    )
)
console.log(`\nempty list with comment`)
console.log(
    toRepresentation(
        emptyListToNode({
            remaining: ` [] # Howdy`,
            context: new structure.Context(),
        })
    )
)
console.log(
    toRepresentation(
       structure.toString({
            context: new structure.Context(),
            node: emptyListToNode({
                remaining: ` [ ] `,
                context: new structure.Context(),
            }),
       })
    )
)