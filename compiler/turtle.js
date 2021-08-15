let _ = require("lodash")


class Keyword {
    constructor({name, handleLine, chunkGenerator, namePattern=null}) {
        this.name = name
        this.handleLine = handleLine
        this.chunkGenerator = chunkGenerator
        this.namePattern = namePattern || RegExp(`^( *${name}) +\\S.*`)
    }
    handleLine({context, remainingLine, fullLine}) {
                    
    }
    chunkGenerator({context, firstChunk}) {
        // false = done
        yield false
    }
}

class Statement {
    constructor({ name, runtimeContext, contents, ...other }) {
        this.name = name
        this.runtimeContext = runtimeContext
        this.contents = contents
        this.other = other
    }
}

function parseStringAsFile(string) {
    let context = {
        parentContext: null,
        variableScope: {},
        statements: [],
        keywordScope: [
            new Keyword({
                name: "",
                namePattern: /^( +)$/,
                handleLine: ({context, remainingLine, fullLine}) => {
                    context.statements.push(new Statement({
                        name: "emptyLine",
                        runtimeContext: context,
                        contents: fullLine,
                    }))
                    return true
                },
                chunkGenerator: ({context, firstChunk}) => {
                    // TODO
                },
            }),

            new Keyword({
                name: "note",
                handleLine: ({context, remainingLine, fullLine}) => {
                    context.statements.push(new Statement({
                        name: "note",
                        runtimeContext: context,
                        contents: {
                            note: remainingLine,
                        },
                    }))
                    return true
                },
                chunkGenerator: ({context, firstChunk}) => {
                    // TODO
                    yield false
                },
            }),
        ],
    }

    function buildStatementTree({context, string}) {
        while (true) {
            let foundSomething = false
            for (let eachKeyword of context.keywordScope) {
                // 
                // check for single line patterns
                // 
                const nextLine = string.match(/.*/)[0]
                let matchResult = string.match(eachKeyword.namePattern)
                if (matchResult) {
                    let keywordEndIndex = matchResult.index + matchResult[1].length
                    let parseResult = handleLine({
                        context,
                        remainingLine:string.slice(keywordEndIndex),
                        fullLine: string.match(/.*/)[0],
                    })
                    if (parseResult) {
                        foundSomething = true
                        string = string.slin
                        break
                    }
                } else {
                    // TODO: error
                }
                
                // 
                // check for multiline
                // 
                startLinePattern = RegExp(`^( *${eachKeyword.name}) +\\S.*`)
                let matchResult = string.match(startPattern)
                if (matchResult) {
                    let keywordEndIndex = matchResult.index + matchResult[1].length
                    let parseResult = handleLine({
                        context,
                        remainingLine:string.slice(keywordEndIndex),
                        fullLine: string.match(/.*/)[0],
                    })
                    if (parseResult) {
                        foundSomething = true
                        break
                    }
                } else {
                    // TODO: error
                }
            }
            if (foundSomething == false) {
                // TODO: check if string empty / error if not empty
                return {context, string}
            }
        }
    }


    if line empty
    then
        skip
    end if 
    if line starts with non-keyword
    then
        error
    end if 
    if line starts with keyword
    and if the line contains non-whitespace
    then
        copy the rest of the line
        delete the line from the lines
        do tree.push(keywords[name](line, tree))
    else 
        set sub_tree
        to new TreeObject(parent=tree)
        
        copy all the indented code
        when finding unindented code, look up the keywords[keyword].validNames
        if it unindented code starts with a valid name, let it continue to the next unindented/equal part
        expect it to be closed with "end "+keyword
        process those blocks recursively using run top-level-mode(sub_tree)
        delete all those lines
    end if

}




// 
// tools
// 

/**
 * Regex interpolation
 *
 * @param {Array} strings - an array of strings
 * @return {Boolean} the output is a string 
 *
 * @example
 *     regexString` this *is* text (escaped) ${/this *is* regex/}`
 */
function regexString(strings, ...values) {
    let output = ""
    for (let [eachString, eachValue] of _.zip(strings, values)) {
        output += eachString
        if (eachValue !== undefined) {
            // escape everything other than regex
            if (!(eachValue instanceof RegExp)) {
                output += _.escapeRegExp(`${eachValue}`)
            } else {
                // remove the starting/ending slashes
                output += `${eachValue}`.replace(/(^\/|\/$)/g, "")
            }
        }
    }
    return output
}

function regex(strings, ...values) {
    return RegExp(regexString(strings, ...values))
}

function globalRegex(strings, ...values) {
    return RegExp(regexString(strings, ...values), "g")
}