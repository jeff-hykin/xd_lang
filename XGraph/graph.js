// TODO:
    // delete method (yourself.delete, someoneElse[actionMapping.delete], Node { delete() {} }) + Proxy delete
    // onShallowUpdate hooks
        // once
        // everytime
    // save transactions to disk, the load and reapply them from disk
    // add authentication to someoneElse actions
        // add authorPublicKey to all transactions
        // add signature to all transactions
        // look up permissions based on authorPublicKey, verify the signature
    // networking transactions
        // whenAskedForValue(nodeId, timestep)

const now = ()=>`${(new Date()).getTime()}${`${Math.random()}`.slice(2,6)}`-0 // timestamp in units of 100-nanoseconds, but last 4 digits are random
const isPrimitive = (val)=>!(val instanceof Object)

const defaultAccount = {
    authorPublicKey: null,
}
const actionMapping = {
    create: 1,
    set: 2,
}

const allTransactions = {}
const nodeIdToNode = {}
const possiblyDanglingNodes = new Set()

const yourself = {
    set(parent, key, value) {
        const time = now()

        if (value instanceof Node) {
            // 
            // get child
            // 
            const node = value
            node.parents.add(parent)
            // 
            // update parent
            // 
            if (isPrimitive(parent.innerValue)) {
                parent.innerValue = {}
            } else {
                const prevChild = nodeIdToNode[ parent.innerValue[key] ]
                delete parent.innerValue[key]
                if (prevChild instanceof Node) {
                    const stillAChild = Object.values(parent.innerValue).includes(prevChild)
                    if (!stillAChild) {
                        prevChild.parents.delete(parent)
                        if (prevChild.parents.size == 0) {
                            delete nodeIdToNode[prevChild.id]
                        }
                    }
                }
            }
            parent.innerValue[key] = node.id
            allTransactions[time] = Object.freeze([ actionMapping.set, parent.id, [key, node.id] ])
            return node
        } else {
            // 
            // create child
            // 
            const node = new Node({
                id: time,
                lastEditTime: time,
                parents: new Set([parent]),
            })
            const valueIsObject = value instanceof Object
            if (valueIsObject) {
                node.innerValue = {}
            } else {
                node.innerValue = value
            }
            allTransactions[time] = Object.freeze([ actionMapping.create, node.id, [ node.innerValue ] ])
            // 
            // recusive create
            // 
            if (valueIsObject) {
                for (const [subKey, subValue] of Object.entries(value)) {
                    yourself.set(node, subKey, subValue)
                }
            }
            // 
            // update parent
            // 
            if (isPrimitive(parent.innerValue)) {
                parent.innerValue = {}
            } else {
                const prevChild = nodeIdToNode[ parent.innerValue[key] ]
                delete parent.innerValue[key]
                if (prevChild instanceof Node) {
                    const stillAChild = Object.values(parent.innerValue).includes(prevChild)
                    if (!stillAChild) {
                        prevChild.parents.delete(parent)
                        if (prevChild.parents.size == 0) {
                            delete nodeIdToNode[prevChild.id]
                        }
                    }
                }
            }
            parent.innerValue[key] = node.id
            allTransactions[time] = Object.freeze([ actionMapping.set, parent.id, [key, node.id] ])
            return node
        }
    },
}
const someoneElse = {
    [actionMapping.create]: (timestamp, nodeId, args) => {
        const [ value ] = args
        possiblyDanglingNodes.add(
            new Node({ id: nodeId, lastEditTime: timestamp, value, })
        )
    },
    [actionMapping.set]: (timestamp, parentId, args) => {
        // presumably the node exists
        const [ key, nodeId ] = args
        const parent = nodeIdToNode[parentId]
        const node   = nodeIdToNode[nodeId]
        // 
        // update child
        // 
        node.parents.add(parent)
        possiblyDanglingNodes.delete(node)
        // 
        // update parent
        // 
        if (isPrimitive(parent.innerValue)) {
            parent.innerValue = {}
        } else {
            const prevChild = nodeIdToNode[ parent.innerValue[key] ]
            delete parent.innerValue[key]
            if (prevChild instanceof Node) {
                const stillAChild = Object.values(parent.innerValue).includes(prevChild)
                if (!stillAChild) {
                    prevChild.parents.delete(parent)
                    if (prevChild.parents.size == 0) {
                        delete nodeIdToNode[prevChild.id]
                    }
                }
            }
        }
        parent.innerValue[key] = node.id
    },
}
// const receiveTransactions = (timestamp, [ action, ...args ])=> {
//     return someoneElse[action](timestamp, ...args)
// }

const valueCache = Symbol("valueCache")
class Node {
    constructor({id, lastEditTime, value, parents, onShallowChange }) {
        this.id              = id || Math.random()
        this.lastEditTime    = lastEditTime || now()
        this.innerValue      = value
        this.parents         = parents || new Set()
        this.onShallowChange = onShallowChange
        nodeIdToNode[this.id] = this
    }

    set(key, value) {
        yourself.set(this, key, value)
        return this
    }

    get(key) {
        if (this.innerValue instanceof Object) {
            const nodeId = this.innerValue[key]
            if (nodeId) {
                return nodeIdToNode[nodeId]
            }
        } else {
            this.innerValue = {}
        }
        const newNode = yourself.set(this, key, null)
        return newNode
    }

    get value() {
        if (isPrimitive(this.innerValue)) {
            return this.innerValue
        } else {
            if (!this[valueCache]) {
                this[valueCache] = new Proxy(this.innerValue, {
                    has: Reflect.has,
                    ownKeys: Reflect.ownKeys, // Object.keys

                    get: (original, key) => {
                        return nodeIdToNode[ this.innerValue[key] ]
                    },
                    set: (original, key, value) => {
                        return this.set(key, value)
                    },
                    // FIXME: add delete
                    deleteProperty: Reflect.deleteProperty,
                })
            }
            return this[valueCache]
        }
    }
}
const Root = new Node({ id: 1 })
Root.parents.add(Root) // to prevent it from being deleted