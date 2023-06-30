import * as structure from "../structure.js"
import { encodeBlankLine, encodeComment } from "./non_values.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

console.log(
    toRepresentation(
        encodeBlankLine({
            remaining: `\n\n`,
            context: new structure.Context(),
        })
    )
)
console.log(
    toRepresentation(
        encodeComment({
            remaining: `# Howdy`,
            context: new structure.Context(),
        })
    )
)
console.log(
    toRepresentation(
        encodeComment({
            remaining: `#  Howdy\n`,
            context: new structure.Context(),
        })
    )
)