const Location = module.exports.Location = class {
    stringIndex = 0
    lineIndex = 0
    characterIndex = 0
    constructor({stringIndex=0, lineIndex=0, characterIndex=0}) {
        this.stringIndex = stringIndex
        this.lineIndex = lineIndex
        this.characterIndex = characterIndex
    }
    stringToDistance(string) {
        const lines = string.split(/\n/)
        return module.exports.Location({
            stringDistance: string.length,
            lineDistance: lines.length-1,
            characterDistance: lines.slice(-1)[0].length,
        })
    }
    treeNodeToDistance(node) {
        const lineDistance = node.endLocation.lineIndex - node.startLocation.lineIndex
        let characterDistance
        // if more than one line, use the length of the last line
        if (lineDistance > 0) {
            characterDistance = node.endLocation.characterIndex
        // if on the same line, then subtract to get the distance
        } else {
            characterDistance = node.endLocation.characterIndex - node.startLocation.characterIndex
        }
        
        return module.exports.Location({
            stringDistance: node.endLocation.stringIndex - node.startLocation.stringIndex,
            lineDistance,
            characterDistance,
        })
    }
    add(...elements) {
        // treat this element as a distance from 0, let the rest of the logic do the work
        elements.unshift({
            stringDistance: this.stringIndex,
            lineDistance: this.lineIndex,
            characterDistance: this.characterIndex,
        })
        const distances = elements.map(each=>{
            if (typeof each == 'string') {
                return this.stringToDistance(each)
            } else {
                return this.treeNodeToDistance(each)
            }
        })
        distances.reverse()
        let lineDistance = 0
        let characterDistance = 0
        let stringDistance = 0
        for (let each of distances) {
            if (lineDistance == 0) {
                characterDistance += each.characterDistance
            }
            lineDistance += each.lineDistance
            stringDistance += each.stringDistance
        }
        return module.exports.Location({
            lineIndex: lineDistance,
            characterIndex: characterDistance,
            stringIndex: stringDistance,
        })
    }
}

const FunctionalAdjectives = new Set([])
const FunctionalAdjective = module.exports.FunctionalAdjective = function (theFunction) {
    FunctionalAdjectives.add(theFunction)
    return theFunction
}

const Context = module.exports.Context = class extends Array {
}

const TreeNode = module.exports.TreeNode = class {
    name = ""
    adjectives = []
    data = {}
    startLocation = null
    endLocation = null
    subNodes = []
    up = null
    get parent() {
        if (this.up == null) {
            return this
        } else {
            return this.up
        }
    }
}

function parseOne({ context, cursorLocation, string, treeNode }) {
    for (let each of context) {
        // FIXME: need to send a frozen copy of args to each() instead of actual args to prevent mutation
        let result = each({ context, cursorLocation, string, treeNode })
        if (result instanceof Object) {
            // add any adjectives
            for (const each of FunctionalAdjectives) {
                each(result.additionalTreeNode)
            }
            // { newCursorLocation, additionalTreeNode }
            return result
        }
    }
    return null
}

// 
// 
// XD Stuff
// 
// 

const XdTreeNode = module.exports.XdTreeNode = class extends TreeNode {
    name = ""
    adjectives = []
    data = {
        imports: {},
        operators: {},
        keywords: {},
        items: {},
    }
    startLocation = null
    endLocation = null
    subNodes = []
    up = null
    get parent() {
        if (this.up == null) {
            return this
        } else {
            return this.up
        }
    }
}

const parseInteger = ({ context, cursorLocation, string, treeNode }) => {
    var remaining = getRemainingString({cursorLocation, string})
    var { remaining, extraction: whitespace } = extract({ pattern: / */, from: remaining })
    var { remaining, extraction: number } = extract({ pattern: /\d+\b/, from: remaining })
    if (number != null) {
        let endLocation = cursorLocation.add(whitespace, number)
        return { 
            newCursorLocation: endLocation,
            additionalTreeNode: new TreeNode({
                name: "literal:integer",
                startLocation: cursorLocation,
                endLocation: endLocation,
                data: {
                    value: number,
                },
            }),
        }
    }
}

const parseName = ({ context, cursorLocation, string, treeNode }) => {
    var remaining = getRemainingString({cursorLocation, string})
    var { remaining, extraction: whitespace } = extract({ pattern: / */, from: remaining })
    var { remaining, extraction: name } = extract({ pattern: /[a-zA-Z_]+[a-zA-Z_0-9]*\b/, from: remaining })
    if (name != null) {
        var endLocation = cursorLocation.add(whitespace, name)
        // FIXME: how to record/consolidate variable/keyword information
        if (treeNode.data.keywords[name]) {
            return {
                newCursorLocation: endLocation,
                additionalTreeNode: new TreeNode({
                    name: "keyword",
                    startLocation: cursorLocation,
                    endLocation: endLocation,
                    data: {
                        name: name,
                        is: treeNode.data.keywords[name],
                    },
                }),
                // relationships
                addConnection: {
                    nameUsage: treeNode.data.keywords[name],
                    alwaysReads: treeNode.data.keywords[name],
                    mightMutate: treeNode.data.keywords[name],
                },
                // dynamic parsing
                addKeyword
            }
        } else if (treeNode.data.items[name]) {
            return {
                newCursorLocation: endLocation,
                additionalTreeNode: new TreeNode({
                    name: "name",
                    startLocation: cursorLocation,
                    endLocation: endLocation,
                    data: {
                        name: name,
                    },
                }),
            }
        }
    }
}

// relationships: nameUsage, mightRead, alwaysReads, mightMutate, alwaysMutates, 


/**
 * file parser
 *
 * @param {Object} arg1 - ({ cursorLocation, remainingString, context, ast })
 * @return {Object} ({ success, newCursorLocation, newRemainingString, newAst })
 */
function fileParser({ cursorLocation, remainingString, context, ast }) {
    // while more than whitespace is left over
    // TODO: remove whitespace help (its more or less for debugging)
    while (remainingString.replace(/( |\t)*$/, "").length > 0) {
        let result = parse({
            cursorLocation,
            remainingString,
            context: [
                ...context,
                commentParser,
                emptyLineParser,
            ],
            ast
        })
        if (result) {

        }
    }
}



function extract({ pattern, from }) {
    const match = from.match(pattern)
    if (match && match.index === 0) {
        return {
            remaining: from.slice(0, match.index)+ from.slice(match.index + match[0].length, from.length),
            extraction: match[0]
        }
    } else {
        return {
            remaining: from,
            extraction: null
        }
    }
}