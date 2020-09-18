let { testParse } = require("./tools")
let { components } = require("./to_node_json")
let {
    parseComment,
    parseNumber,
    parseLiteralInlineString,
    parseStaticInlineValue,
    parseReference,
    extractInterpolations,
    parseFigurativeInlineString,
    parseBlockString,
    parseValue,
    parseListElement,
    parseMapElement,
    parseContainer,
    parseRoot,
} = components


testParse({ifParsedWith: parseComment,
    expectedIo: [
        {
            input: "#hello",
            output: { remaining: '#hello', extraction: null                                          },
        },
        {
            input: "    # it means literally literally \n   there werw",
            output: {
                "remaining": "   there werw",
                "extraction": {
                    "type": "#comment",
                    "content": "it means literally literally ",
                    "leadingWhitespace": "    "
                }
            },
        },
        {
            input: " # hello",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#comment",
                    "content": "hello",
                    "leadingWhitespace": " "
                }
            },
        },
        {
            input: "#",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#comment",
                    "content": ""
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseNumber,
    expectedIo: [
        {
            input: "1",
            output: {"remaining":"","extraction":{"type":"#number","value":"1"}},
        },
        {
            input: "-1",
            output: {"remaining":"","extraction":{"type":"#number","value":"-1"}},
        },
        {
            input: "123.43232",
            output: {"remaining":"","extraction":{"type":"#number","value":"123.43232"}},
        },
        {
            input: "1.1",
            output: {"remaining":"","extraction":{"type":"#number","value":"1.1"}},
        },
        {
            input: ".1",
            output: {"remaining":".1","extraction":null},
        },
        {
            input: ".",
            output: {"remaining":".","extraction":null},
        },
        {
            input: "1.",
            output: {"remaining":"1.","extraction":null},
        },
        {
            input: "-123.43232",
            output: {"remaining":"","extraction":{"type":"#number","value":"-123.43232"}},
        },
        {
            input: "-@123.43232",
            output: {"remaining":"-@123.43232","extraction":null},
        },
        {
            input: "-@539035",
            output: {"remaining":"","extraction":{"type":"#number","value":"-539035","format":"@"}},
        },
        {
            input: "@539035",
            output: {"remaining":"","extraction":{"type":"#number","value":"539035","format":"@"}},
        },
    ],
})
testParse({ifParsedWith: parseLiteralInlineString,
    expectedIo: [
        {
            input: "\"string\"",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "\"",
                    "value": "string"
                }
            },
        },
        {
            input: "\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "\"",
                    "value": ""
                }
            },
        },
        {
            input: "\"\"\"string\"\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "\"\"\"",
                    "value": "string"
                }
            },
        },
        {
            input: "\"\"\"\"string\"\"\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "\"\"\"",
                    "value": "\"string\""
                }
            },
        },
        {
            input: "\"\"\"\"\"string\"\"\"\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "\"\"\"",
                    "value": "\"\"string\"\""
                }
            },
        },
        {
            input: "\"\"\"\"\"\"",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "\"\"\"",
                    "value": ""
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseStaticInlineValue,
    expectedIo: [
        {
            input: "1",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#number",
                    "value": "1"
                }
            },
        },
        {
            input: "\"hello world\"",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "\"",
                    "value": "hello world"
                }
            },
        },
        {
            input: "@atom",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#namedAtom",
                    "format": "@",
                    "value": "atom"
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseReference,
    expectedIo: [
        {
            input: "#thisDocument",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[1]",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#number",
                            "value": "1"
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[\"thing\"][  \"thing\"]",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "thing",
                            "leadingWhitespace": "  "
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[\"thing\"][  1]",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "type": "#number",
                            "value": "1",
                            "leadingWhitespace": "  "
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[\"thing\"][1  ]",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "type": "#number",
                            "value": "1",
                            "trailingWhitespace": "  "
                        }
                    ]
                }
            },
        },
        {
            input: "#thisDocument[\"thing\"][1 ]",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#reference",
                    "accessList": [
                        {
                            "type": "#system",
                            "value": "#thisDocument"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "thing"
                        },
                        {
                            "type": "#number",
                            "value": "1",
                            "trailingWhitespace": " "
                        }
                    ]
                }
            },
        },
    ],
})
testParse({ifParsedWith: extractInterpolations,
    expectedIo: [
        {
            input: "hello world",
            output: {
                "type": "#string",
                "value": "hello world"
            },
        },
        {
            input: "hello world {#thisDocument}",
            output: {
                "type": "#string",
                "contains": [
                    {
                        "type": "#stringPiece",
                        "value": "hello world "
                    },
                    {
                        "type": "#reference",
                        "accessList": [
                            {
                                "type": "#system",
                                "value": "#thisDocument"
                            }
                        ]
                    }
                ]
            },
        },
        {
            input: "hello world\nThis is {#thisDocument} so ",
            output: {
                "type": "#string",
                "contains": [
                    {
                        "type": "#stringPiece",
                        "value": "hello world\nThis is "
                    },
                    {
                        "type": "#reference",
                        "accessList": [
                            {
                                "type": "#system",
                                "value": "#thisDocument"
                            }
                        ]
                    },
                    {
                        "type": "#stringPiece",
                        "value": " so "
                    }
                ]
            },
        },
        {
            input: "\n    testing\n    {#thisDocument}     testing",
            output: {
                "type": "#string",
                "contains": [
                    {
                        "type": "#stringPiece",
                        "value": "\n    testing\n    "
                    },
                    {
                        "type": "#reference",
                        "accessList": [
                            {
                                "type": "#system",
                                "value": "#thisDocument"
                            }
                        ]
                    },
                    {
                        "type": "#stringPiece",
                        "value": "     testing"
                    }
                ]
            },
        },
    ],
})
testParse({ifParsedWith: parseFigurativeInlineString,
    expectedIo: [
        {
            input: "'strings'",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "'",
                    "value": "strings"
                }
            },
        },
        {
            input: "'''strings'''",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "'''",
                    "value": "strings"
                }
            },
        },
        {
            input: "''''strings''''",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "'''",
                    "value": "'strings'"
                }
            },
        },
        {
            input: "'''strings and {@interpolations}'''",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "'''",
                    "contains": [
                        {
                            "type": "#stringPiece",
                            "value": "strings and "
                        },
                        {
                            "type": "#namedAtom",
                            "format": "@",
                            "value": "interpolations"
                        }
                    ]
                }
            },
        },
        {
            input: "'''strings and {@interpolations} with more {#thisDocument} interpolations'''",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "'''",
                    "contains": [
                        {
                            "type": "#stringPiece",
                            "value": "strings and "
                        },
                        {
                            "type": "#namedAtom",
                            "format": "@",
                            "value": "interpolations"
                        },
                        {
                            "type": "#stringPiece",
                            "value": " with more "
                        },
                        {
                            "type": "#reference",
                            "accessList": [
                                {
                                    "type": "#system",
                                    "value": "#thisDocument"
                                }
                            ]
                        },
                        {
                            "type": "#stringPiece",
                            "value": " interpolations"
                        }
                    ]
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseBlockString,
    expectedIo: [
        {
            input: `#textLiteral: like a billion`,
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "literal:InlineBlock",
                    "value": " like a billion"
                }
            },
        },
        {
            input: `#textFigurative: like a billion`,
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "figurative:InlineBlock",
                    "value": " like a billion"
                }
            },
        },
        {
            input: "#textFigurative:\n    like a billion",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "figurative:MultilineBlock",
                    "value": "like a billion"
                }
            },
        },
        {
            input: "#textLiteral:\n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "literal:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half"
                }
            },
        },
        {
            input: "#textLiteral:  \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "literal:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half",
                },
            },
        },
        {
            input: "#textLiteral:   # it means literally literally \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "literal:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half",
                    "comment": {
                        "type": "#comment",
                        "content": "it means literally literally ",
                        "leadingWhitespace": "   "
                    }
                }
            },
        },
        {
            input: "#textFigurative:   # it means kinda \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "figurative:MultilineBlock",
                    "value": "like a billion\nlike a billion and a half",
                    "comment": {
                        "type": "#comment",
                        "content": "it means kinda ",
                        "leadingWhitespace": "   "
                    }
                }
            },
        },
        {
            input: "#textFigurative:  asodfsdf  # it means kinda \n    like a billion\n    like a billion and a half",
            output: {
                "remaining": "#textFigurative:  asodfsdf  # it means kinda \n    like a billion\n    like a billion and a half",
                "extraction": null
            },
        },
        {
            input: "'''\n    testing\n        testing\n    '''\n                ",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "''':MultilineBlock",
                    "value": "testing\n    testing"
                },
            },
        },
        {
            input: "\"\"\"\n    testing\n        testing\n    \"\"\"\n                ",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "\"\"\":MultilineBlock",
                    "value": "testing\n    testing"
                },
            },
        },
        {
            input: "\"\n    testing\n        testing\n    \"\n                ",
            output: {
                "remaining": "\n",
                "extraction": {
                    "format": "\":MultilineBlock",
                    "value": "testing\n    testing",
                },
            },
        },
        {
            input: "\n    bleh forgot quotes:\n    {#thisDocument}     testing",
            output: {
                "remaining": "\n    bleh forgot quotes:\n    {#thisDocument}     testing",
                "extraction": null
            },
        },
        {
            input: "'''\n    testing\n       {10} testing{   \"dataaaa\"}\n    '''\n                ",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "''':MultilineBlock",
                    "contains": [
                        {
                            "type": "#stringPiece",
                            "value": "testing\n   "
                        },
                        {
                            "type": "#number",
                            "value": "10"
                        },
                        {
                            "type": "#stringPiece",
                            "value": " testing"
                        },
                        {
                            "type": "#string",
                            "format": "\"",
                            "value": "dataaaa",
                            "leadingWhitespace": "   "
                        }
                    ]
                },
            },
        },
        {
            input: "#textFigurative:\n    bleh forgot quotes:\n    {#thisDocument}     testing\nunindented: 10",
            output: {
                "remaining": "\n\nunindented: 10",
                "extraction": {
                    "type": "#string",
                    "format": "figurative:MultilineBlock",
                    "contains": [
                        {
                            "type": "#stringPiece",
                            "value": "bleh forgot quotes:\n"
                        },
                        {
                            "type": "#reference",
                            "accessList": [
                                {
                                    "type": "#system",
                                    "value": "#thisDocument"
                                }
                            ]
                        },
                        {
                            "type": "#stringPiece",
                            "value": "     testing"
                        }
                    ]
                }
            },
        },
        {
            input: "#textLiteral: like a billion\n",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "literal:InlineBlock",
                    "value": " like a billion"
                }
            },
        },
        {
            input:
                `'''\n`+
                `    testing, i forgot the quote\n`+
                "",
            output: {
                "remaining": "'''\n    testing, i forgot the quote\n",
                "extraction": null,
                "was": "testing, i forgot the quote",
                "errorMessage": "For the quoted block: '''\ntesting, i forgot the quote\n\nI think you just need to add a ''' to the end of it.\nMake sure it:\n  - is on a newline (not at the end of text)\n  - its indented exactly right (not too much or too little)"
            },
        },
        {
            input:
                `'''\n`+
                `    testing, i forgot the quote\n`+
                `     '''\n`+
                "",
            output: {
                "remaining": "'''\n    testing, i forgot the quote\n     '''\n",
                "extraction": null,
                "was": "testing, i forgot the quote\n '''",
                "errorMessage": "For the quoted block: '''\ntesting, i forgot the quote\n '''\n\nI think you just need to add a ''' to the end of it.\nMake sure it:\n  - is on a newline (not at the end of text)\n  - its indented exactly right (not too much or too little)"
            },
        },
        {
            input: "'''\n    testing, i forgot the quote\n    '''\n",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#string",
                    "format": "''':MultilineBlock",
                    "value": "testing, i forgot the quote"
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseValue,
    expectedIo: [
        {
            input: "null",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#namedAtom",
                    "format": "keyword",
                    "value": "null"
                }
            },
        },
        {
            input: "   1000",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#number",
                    "value": "1000",
                    "leadingWhitespace": "   "
                }
            },
        },
        {
            input: "this is a test",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "unquotedStrong",
                    "value": "this is a test"
                }
            },
        },
        {
            input: "this is a test\n",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "unquotedStrong",
                    "value": "this is a test"
                }
            },
        },
        // FIXME
        // {
        //     input: "#create[date]: this is a test\n",
        //     output: {
        //         "remaining": "",
        //         "extraction": {
        //             "type": "#string",
        //             "customTypes": ["date"],
        //             "format": "unquotedStrong",
        //             "value": "this is a test"
        //         }
        //     },
        // },
        {
            input: "#create[date]: #textLiteral: 1/1/1010\n",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "literal:InlineBlock",
                    "value": " 1/1/1010",
                    "customTypes": ["date"],
                }
            },
        },
        {
            input: "#create[number,rational]: @pi\n",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#namedAtom",
                    "format": "@",
                    "value": "pi",
                    "customTypes": ["number","rational"],
                }
            },
        },
        {
            input: "\n    test: @this",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#namedAtom",
                            "format": "@",
                            "value": "this",
                            "key": {
                                "type": "#string",
                                "format": "unquotedWeak",
                                "value": "test"
                            }
                        }
                    ]
                }
            },
        },
        {
            input: "\n    test: @this\n    test: @2",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "test"
                            },
                            "value": {
                                "type": "#namedAtom",
                                "format": "@",
                                "value": "this"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "test"
                            },
                            "value": {
                                "type": "#number",
                                "value": "2",
                                "format": "@"
                            }
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    test: @this\n`+
                `    test: @2\n`+
                `    test: \n`+
                `        nested: 1\n`+
                `        nested2: 2\n`+
                "",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "test"
                            },
                            "value": {
                                "type": "#namedAtom",
                                "format": "@",
                                "value": "this"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "test"
                            },
                            "value": {
                                "type": "#number",
                                "value": "2",
                                "format": "@"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "test"
                            },
                            "value": {
                                "type": "#mapping",
                                "contains": [
                                    {
                                        "type": "#keyedValue",
                                        "key": {
                                            "type": "#string",
                                            "format": "unquotedStrong",
                                            "value": "nested"
                                        },
                                        "value": {
                                            "type": "#number",
                                            "value": "1"
                                        }
                                    },
                                    {
                                        "type": "#keyedValue",
                                        "key": {
                                            "type": "#string",
                                            "format": "unquotedStrong",
                                            "value": "nested2"
                                        },
                                        "value": {
                                            "type": "#number",
                                            "value": "2"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    test: @this\n`+
                `    test: @2\n`+
                `    test: \n`+
                `        nested: 1\n`+
                `   \n`+
                `        \n`+
                `   \n`+
                `        nested2: 2\n`+
                "",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "test"
                            },
                            "value": {
                                "type": "#namedAtom",
                                "format": "@",
                                "value": "this"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "test"
                            },
                            "value": {
                                "type": "#number",
                                "value": "2",
                                "format": "@"
                            }
                        },
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "test"
                            },
                            "value": {
                                "type": "#mapping",
                                "contains": [
                                    {
                                        "type": "#keyedValue",
                                        "key": {
                                            "type": "#string",
                                            "format": "unquotedStrong",
                                            "value": "nested"
                                        },
                                        "value": {
                                            "type": "#number",
                                            "value": "1"
                                        }
                                    },
                                    {
                                        "type": "#blankLines",
                                        "content": "\n\n"
                                    },
                                    {
                                        "type": "#keyedValue",
                                        "key": {
                                            "type": "#string",
                                            "format": "unquotedStrong",
                                            "value": "nested2"
                                        },
                                        "value": {
                                            "type": "#number",
                                            "value": "2"
                                        }
                                    }
                                ]
                            }
                        }
                    ]
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseListElement,
    expectedIo: [
        {
            input: "- 10",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#number",
                    "value": "10"
                }
            },
        },
        {
            input: "- #textLiteral:100",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "literal:InlineBlock",
                    "value": "100"
                }
            },
        },
        {
            input: "- #textFigurative:\n    200",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#string",
                    "format": "figurative:MultilineBlock",
                    "value": "200"
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseMapElement,
    expectedIo: [
        {
            input: "myKey: 10",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#string",
                        "format": "unquotedStrong",
                        "value": "myKey"
                    },
                    "value": {
                        "type": "#number",
                        "value": "10"
                    }
                }
            },
        },
        {
            input: "infinite: @infinite",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#string",
                        "format": "unquotedStrong",
                        "value": "infinite"
                    },
                    "value": {
                        "type": "#namedAtom",
                        "format": "@",
                        "value": "infinite"
                    }
                }
            },
        },
        {
            input: "1: #textLiteral:\n     hi",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#number",
                        "value": "1"
                    },
                    "value": {
                        "format": "literal:MultilineBlock",
                        "value": " hi"
                    }
                }
            },
        },
        {
            input: "Hello World: whats up",
            output: {
                "remaining": "Hello World: whats up",
                "extraction": null
            },
        },
        {
            input: "\"Hello World\": whats up",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#string",
                        "format": "\"",
                        "value": "Hello World"
                    },
                    "value": {
                        "type": "#string",
                        "format": "unquotedStrong",
                        "value": "whats up"
                    }
                }
            },
        },
        {
            input: "\"list of \":\n    - 1",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#string",
                        "format": "\"",
                        "value": "list of "
                    },
                    "value": {
                        "type": "#listing",
                        "contains": [
                            {
                                "type": "#number",
                                "value": "1",
                                "key": 1
                            }
                        ]
                    }
                }
            },
        },
        {
            input: "@Hello  : @world",
            output: {
                "remaining": "",
                "extraction": {
                    "type": "#keyedValue",
                    "key": {
                        "type": "#namedAtom",
                        "format": "@",
                        "value": "Hello",
                        "leadingWhitespace": "  "
                    },
                    "value": {
                        "type": "#namedAtom",
                        "format": "@",
                        "value": "world"
                    }
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseContainer,
    expectedIo: [
        {
            input:
                `\n`+
                `    testing: does this work?`+
                "",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "testing"
                            },
                            "value": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "does this work?"
                            }
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    testing: does this work?\n`+
                `    - how about this?\n`+
                `    - or this @atom\n`+
                `    `+
                "",
            output: {
                "remaining": "\n    testing: does this work?\n    - how about this?\n    - or this @atom\n    ",
                "extraction": null,
                "was": "testing: does this work?\n- how about this?\n- or this @atom\n",
                "errorMessage": "Having both keys (key: value) and list elements (- value) in the same container currently isn't supported\nJust change:\n\n    testing: does this work?\n    - how about this?\n    - or this @atom\n    \nTo be:\n\n    testing: does this work?\n    1:how about this?\n    2:or this @atom\n    "
            },
        },
        {
            input:
                `\n`+
                `    # Im doing tests wbu\n`+
                `    - how about this?\n`+
                `    - or this @atom\n`+
                `    `+
                "",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#listing",
                    "contains": [
                        {
                            "type": "#comment",
                            "content": "Im doing tests wbu"
                        },
                        {
                            "type": "#string",
                            "format": "unquotedStrong",
                            "value": "how about this?",
                            "key": 1
                        },
                        {
                            "type": "#string",
                            "format": "unquotedStrong",
                            "value": "or this @atom",
                            "key": 2
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    testing: does this work?\n`+
                `    # so I was thinking\n`+
                `    `+
                "",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "testing"
                            },
                            "value": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "does this work?"
                            }
                        },
                        {
                            "type": "#comment",
                            "content": "so I was thinking"
                        }
                    ]
                }
            },
        },
        {
            input:
                `\n`+
                `    # so I was thinking\n`+
                `        # thses are actually\n`+
                `\n`+
                `        # just blank lines\n`+
                `        # not a container\n`+
                `    `+
                "",
            output: {
                "remaining": "\n    # so I was thinking\n        # thses are actually\n\n        # just blank lines\n        # not a container\n    ",
                "extraction": null
            },
        },
        {
            input: "\n    hello: world",
            output: {
                "remaining": "\n",
                "extraction": {
                    "type": "#mapping",
                    "contains": [
                        {
                            "type": "#keyedValue",
                            "key": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "hello"
                            },
                            "value": {
                                "type": "#string",
                                "format": "unquotedStrong",
                                "value": "world"
                            }
                        }
                    ]
                }
            },
        },
    ],
})
testParse({ifParsedWith: parseRoot,
    expectedIo: [
        {
            input: "5",
            output: {
                "isContainer": false,
                "documentNodes": [
                    {
                        "type": "#number",
                        "value": "5"
                    }
                ],
            },
        },
        {
            input: "-5000",
            output: {
                "isContainer": false,
                "documentNodes": [
                    {
                        "type": "#number",
                        "value": "-5000"
                    }
                ],
            },
        },
        {
            input: "hello: world",
            output: {
                "isContainer": true,
                "documentNodes": [
                    {
                        "type": "#mapping",
                        "contains": [
                            {
                                "type": "#keyedValue",
                                "key": {
                                    "type": "#string",
                                    "format": "unquotedStrong",
                                    "value": "hello"
                                },
                                "value": {
                                    "type": "#string",
                                    "format": "unquotedStrong",
                                    "value": "world"
                                }
                            }
                        ]
                    }
                ],
            },
        },
        {
            input:
                `"list of lists":\n`+
                `    - \n`+
                `        - 1.1\n`+
                `        - 1.2\n`+
                `        - 1.3\n`+
                `    -\n`+
                `        - 2.1\n`+
                `        - 2.2\n`+
                `        - 2.3\n`+
                `        - 2.4\n`+
                "",
            output: {
                "isContainer": true,
                "endsWithSingleNewline": true,
                "documentNodes": [
                    {
                        "type": "#mapping",
                        "contains": [
                            {
                                "type": "#keyedValue",
                                "key": {
                                    "type": "#string",
                                    "format": "\"",
                                    "value": "list of lists"
                                },
                                "value": {
                                    "type": "#listing",
                                    "contains": [
                                        {
                                            "type": "#listing",
                                            "contains": [
                                                {
                                                    "type": "#number",
                                                    "value": "1.1",
                                                    "key": 1
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "1.2",
                                                    "key": 2
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "1.3",
                                                    "key": 3
                                                }
                                            ],
                                            "key": 1
                                        },
                                        {
                                            "type": "#blankLines",
                                            "content": ""
                                        },
                                        {
                                            "type": "#listing",
                                            "contains": [
                                                {
                                                    "type": "#number",
                                                    "value": "2.1",
                                                    "key": 1
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "2.2",
                                                    "key": 2
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "2.3",
                                                    "key": 3
                                                },
                                                {
                                                    "type": "#number",
                                                    "value": "2.4",
                                                    "key": 4
                                                }
                                            ],
                                            "key": 2
                                        }
                                    ]
                                }
                            }
                        ]
                    }
                ],
            },
        },
        {
            input: "5\n",
            output: {
                "isContainer": false,
                "endsWithSingleNewline": true,
                "documentNodes": [
                    {
                        "type": "#number",
                        "value": "5"
                    }
                ]
            },
        },
    ],
})

