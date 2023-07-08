import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"
import { capitalize, indent, toCamelCase, toPascalCase, toKebabCase, toSnakeCase, toScreamingtoKebabCase, toScreamingtoSnakeCase, toRepresentation, toString } from "https://deno.land/x/good@1.3.0.4/string.js"

import { inlineValueToNode } from "./values.js"

import "./1_1_special_value.js"
import "./1_2_atom.js"
import "./1_3_number.js"
import "./1_4_string.js"
import "./1_5_list.js"
import "./1_6_map.js"
// FIXME: import reference.js

console.log(`\nspecial values`)
    console.log(
        toRepresentation(
            inlineValueToNode({
                remaining: `infinite`,
                context: new structure.Context({}),
            })
        )
    )
    console.log(
        toRepresentation(
            inlineValueToNode({
                remaining: `false`,
                context: new structure.Context({}),
            })
        )
    )

console.log(`\natoms`)
    console.log(
        toRepresentation(
            inlineValueToNode({
                remaining: `@imma_atom`,
                context: new structure.Context({}),
            })
        )
    )
    console.log(`\natoms`)
    console.log(
        toRepresentation(
            inlineValueToNode({
                remaining: `(color) @red`,
                context: new structure.Context({}),
            })
        )
    )

console.log(`\nnumbers`)
    console.log(
        toRepresentation(
            inlineValueToNode({
                remaining: `(color) 000`,
                context: new structure.Context({}),
            })
        )
    )

console.log(`\nempty map`)
        console.log(
            toRepresentation(
                inlineValueToNode({
                    remaining: `{}`,
                    context: new structure.Context({}),
                })
            )
        )

    console.log(`\nempty map with comment`)
    console.log(
        toRepresentation(
            inlineValueToNode({
                remaining: ` {} # Howdy`,
                context: new structure.Context({}),
            })
        )
    )
    console.log(`\nempty map with comment and adjective`)
    console.log(
        toRepresentation(
            inlineValueToNode({
                remaining: `(set) {} # Howdy`,
                context: new structure.Context({}),
            })
        )
    )

console.log(`\nempty list`)
        console.log(
            toRepresentation(
                inlineValueToNode({
                    remaining: `[]`,
                    context: new structure.Context({}),
                })
            )
        )

    console.log(`\nempty map with comment`)
    console.log(
        toRepresentation(
            inlineValueToNode({
                remaining: ` [] # Howdy`,
                context: new structure.Context({}),
            })
        )
    )
    console.log(`\nempty map with comment and adjective`)
    console.log(
        toRepresentation(
            inlineValueToNode({
                remaining: `(set) [] # Howdy`,
                context: new structure.Context({}),
            })
        )
    )

// 
// toString
// 
    console.log(
        toRepresentation(
        structure.toString({
                context: new structure.Context({}),
                node: inlineValueToNode({
                    remaining: ` { } `,
                    context: new structure.Context({}),
                }),
        })
        )
    )