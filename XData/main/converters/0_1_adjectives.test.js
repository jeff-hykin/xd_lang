import * as structure from "../structure.js"
import "./0_0_non_values.js" // need to load in Comment
import { adjectiveToNode, adjectivesPrefixToNode } from "./0_1_adjectives.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

console.log(
    toRepresentation(
        adjectiveToNode({
            remaining: `imma_adjective`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        adjectivesPrefixToNode({
            remaining: `(imma_adjective)`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        adjectivesPrefixToNode({
            remaining: `  (imma_adjective, me_too   )  `,
            context: new structure.Context({}),
        })
    )
)