import * as structure from "../structure.js"
import "./non_values.js" // need to load in Comment
import { stringToNode, stringNodeToString, blockStringLiteralToNode } from "./string.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

console.log(
    toRepresentation(
        stringToNode({
            remaining: `"testing"`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        stringToNode({
            remaining: `"""howdy"""`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        stringToNode({
            remaining: `""" "howdy" """`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        stringToNode({
            remaining: `""`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        stringToNode({
            remaining: `""""""`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        stringNodeToString({
            node: stringToNode({
                remaining: `""""""`,
                context: new structure.Context({}),
            }),
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        blockStringLiteralToNode({
            remaining: `
    """
    Howdy howdy howdy
    """
`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        blockStringLiteralToNode({
            remaining: `
    """
    Howdy howdy howdy
    Howdy howdy howdy
    Howdy howdy howdy
    """
`,
            context: new structure.Context({}),
        })
    )
)
console.log(
    toRepresentation(
        stringToNode({
            remaining: `
    """
    Howdy howdy howdy
    Howdy howdy howdy
    Howdy howdy howdy
    """
`,
            context: new structure.Context({
                id: structure.ContextIds.block,
            }),
        })
    )
)
console.log(
    toRepresentation(
        stringToNode({
            remaining: `
            
    """    
    Howdy howdy howdy
    Howdy howdy howdy
    Howdy howdy howdy
    """    
`,
            context: new structure.Context({
                id: structure.ContextIds.block,
            }),
        })
    )
)
console.log(
    toRepresentation(
        stringToNode({
            remaining: `

    """    
    Howdy howdy howdy
    Howdy howdy howdy
    Howdy howdy howdy
    """
    # testing    
`,
            context: new structure.Context({
                id: structure.ContextIds.block,
            }),
        })
    )
)