import * as structure from "../structure.js"
import { ParserError, ContextIds }   from "../structure.js"
import * as tools from "../xdata_tools.js"
import * as utils from "../utils.js"

// can't import because of (inherently required) circular imports
    // import("./1_1_special_value.js"),
    // import("./1_2_atom.js"),
    // import("./1_3_number.js"),
    // import("./1_4_string.js"),
    // import("./1_5_list.js"),
    // import("./1_6_map.js"),
    // // FIXME: import reference.js

export const inlineValueToNode = ({remaining, context})=>{
    const pretendInlineContext = new structure.Context({ context, id: ContextIds.inlineValue })
    
    var { remaining, extraction, context } = tools.extract({
        oneOf: [
            structure.toNodeifiers.SpecialValue,
            structure.toNodeifiers.Atom,
            structure.toNodeifiers.Number,
            structure.toNodeifiers.String,
            structure.toNodeifiers.String,
            structure.toNodeifiers.List,
            structure.toNodeifiers.Map,
        ],
        from: remaining,
        context: pretendInlineContext,
    })

    return extraction
}