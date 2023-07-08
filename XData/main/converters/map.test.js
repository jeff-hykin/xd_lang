import * as structure from "../structure.js"
import "./non_values.js" // need to load in Comment
import "./atom.js"
import { emptyMapToNode } from "./map.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

console.log(`\nempty map`)
console.log(
    toRepresentation(
        emptyMapToNode({
            remaining: `{}`,
            context: new structure.Context({}),
        })
    )
)
console.log(`\nempty map with comment`)
console.log(
    toRepresentation(
        emptyMapToNode({
            remaining: ` {} # Howdy`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
       structure.toString({
            context: new structure.Context({}),
            node: emptyMapToNode({
                remaining: ` { } `,
                context: new structure.Context({}),
            }),
       })
    )
)