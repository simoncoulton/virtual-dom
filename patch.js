var render = require("./render")

var domIndex = require("./lib/dom-index")
var isArray = require("./lib/is-array")
var isString = require("./lib/is-string")

module.exports = patch

function patch(rootNode, patches) {
    var index = domIndex(rootNode, patches.a, patches)

    for (var nodeIndex in patches) {
        if (nodeIndex === "a") {
            continue
        }

        rootNode = applyPatch(rootNode, index[nodeIndex], patches[nodeIndex])
    }

    return rootNode
}

function applyPatch(rootNode, domNode, patchList) {
    if (!domNode || !isArray(patchList)) {
        return rootNode
    }

    for (var i = 0; i < patchList.length; i++) {
        var op = patchList[i]

        if (op.type === "remove") {
            remove(domNode)
            if (op.widget) {
                op.widget.destroy()
            }
        } else if (op.type ===  "insert") {
            if (op.widget) {
                insert(domNode, op.widget.init())
            } else {
                insert(domNode, render(op.b))
            }
        } else if (op.type === "replace") {
            if (domNode === rootNode) {
                rootNode = render(op.b)
            } else {
                replace(domNode, render(op.b))
            }
        } else if (op.type === "update") {
            update(domNode, op.patch)
        }
    }

    return rootNode
}

function remove(domNode) {
    var parent = domNode.parentNode
    if (parent) {
        parent.removeChild(domNode)
    }
}

function insert(domNode, child) {
    if (domNode.nodeType === 1) {
        domNode.appendChild(child)
    }
}

function replace(domNode, newNode) {
    var parent = domNode.parentNode
    if (parent) {
        parent.replaceChild(newNode, domNode)
    }
}

function update(domNode, patch) {
    if (isString(patch)) {
        if (domNode.nodeType === 3) {
            domNode.replaceData(0, patch.length, patch)
        } else  if (patch.a && patch.bl) {
            // update widget
            var wNode = patch.a.update(patch.b)
            if (domNode !== wNode) {
                replace(domNode, wNode)
            }
        } else {
            replace(domNode, render(patch))
        }
    } else {
        for (var prop in patch) {
            if (prop === "style") {
                var stylePatch = patch.style
                var domStyle = domNode.style
                for (var s in stylePatch) {
                    domStyle[s] = stylePatch[s]
                }
            } else {
                var patchValue = patch[prop]

                if (typeof patchValue === "function") {
                    patchValue(domNode, prop)
                } else {
                    domNode[prop] = patchValue
                }
            }
        }
    }
}
