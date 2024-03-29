import * as structure from "../structure.js"
import "./0_0_non_values.js" // need to load in Comment
import { specialValueToNode } from "./1_1_special_value.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

console.log(
    toRepresentation(
        specialValueToNode({
            remaining: `infinite`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        specialValueToNode({
            remaining: `nan`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        specialValueToNode({
            remaining: `True`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        specialValueToNode({
            remaining: `fAlsE`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        specialValueToNode({
            remaining: `(int) fAlsE`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
       structure.toString({
            context: new structure.Context({}),
            node: specialValueToNode({
                remaining: `fAlsE`,
                context: new structure.Context({}),
            }),
       })
    )
)