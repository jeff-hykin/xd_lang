import * as structure from "../structure.js"
import "./non_values.js" // need to load in Comment
import { atomWithAtSymbolToNode } from "./atom.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

console.log(
    toRepresentation(
        atomWithAtSymbolToNode({
            remaining: `@imma_atom`,
            context: new structure.Context(),
        })
    )
)
console.log(
    toRepresentation(
       structure.toString({
            context: new structure.Context(),
            node: atomWithAtSymbolToNode({
                remaining: `@imma_atom`,
                context: new structure.Context(),
            }),
       })
    )
)