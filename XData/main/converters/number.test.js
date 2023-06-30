import * as structure from "../structure.js"
import "./non_values.js" // need to load in Comment
import { numberToNode } from "./number.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

console.log(
    toRepresentation(
        numberToNode({
            remaining: `10.4`,
            context: new structure.Context(),
        })
    )
)
console.log(
    toRepresentation(
        numberToNode({
            remaining: `-10`,
            context: new structure.Context(),
        })
    )
)
console.log(
    toRepresentation(
        numberToNode({
            remaining: `+99.4`,
            context: new structure.Context(),
        })
    )
)
console.log(
    toRepresentation(
       structure.toString({
            context: new structure.Context(),
            node: numberToNode({
                remaining: `0.249082`,
                context: new structure.Context(),
            }),
       })
    )
)