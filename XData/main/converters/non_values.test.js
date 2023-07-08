import * as structure from "../structure.js"
import { blankLineToNode, commentToNode } from "./non_values.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

console.log(
    toRepresentation(
        blankLineToNode({
            remaining: `\n\n`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        commentToNode({
            remaining: `# Howdy`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        commentToNode({
            remaining: `#  Howdy\n`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
       structure.toString({
            context: new structure.Context({}),
            node: commentToNode({
                remaining: `#  Howdy\n`,
                context: new structure.Context({}),
            }),
       })
    )
)