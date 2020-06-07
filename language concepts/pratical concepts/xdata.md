XData (basically XD Object Notation) was needed to address the shortcomings of JSON and YAML.
- JSON cannot self-reference and multi-line strings are non-human readable
- yaml too complex and flexible to be simultaneously human and computer editable
- yaml is nontrivial to parse
- both lack interpolation

The XD object notation can mathematically be thought of as tree-like directed graph. The only difference from a tree is that cycle are allowed (a child-value linking to a parent-value) and values can have more than one parent (two or more parents linking to same data).

XDON v1.0 can be parsed as a subset of yaml. Here is what is changed:
- multiple documents are not allowed (the ---) the document-end symbol (...) is changed to two newlines with no whitespace/indent
- directives (the %) are not allowed
- anchors/refs are removed (replaced by !link)
- keys must be primitives (not seq or map)
- tags are not allowed for keys (for v1.0)
- Every value has only one valid format, details below.
- !link, !interpolate, !template, !atomic, !json are added as standard tags
- comments are allowed, but not fully supported with editing in v1.0

Details
1. Anchor/ref replacement. The !link tag is a replacement for refs, and there is no need for anchors in XDON because all values already have anchors: the list of primitives used to reach them. Links are like file paths, they can be relative to the root ("absolute path") or relative to self ("relative path"), in XDON they can also link to data outside the document which can be thought of like templating. Self-referencing links are allowed because they are not evaluated (links are not a glorified copy-paste operation). This allows the tree structure to represent directed graphs 

2. Single format
- indentation is standardized to 3
- maps must use colon syntax (for v1.0)
- lists must use dashed syntax (for v1.0)
- integers already have effectively one format
- all other numbers are in decimal format unless tagged as scientific, hex, oct, etc
- strings are unquoted unless necessary
- strings with newlines that are used as keys will be double quoted with newlines escaped
- strings with newlines that are used as values  are always multiline
- strings with newlines that are used as values  are always started on a new line 
- - value strings with newlines are always started on a newline
- stings use single quotes (literal) whenever quotes are needed and the above rules are not broken



XDON v1.1
Some changes were not practical because they are difficult 
- format of strings is partly changed: non-ascii non-emoji characters are escaped with unicode escape codes
- inline values for map {} and seq [] are allowed if they follow JSON and don't contain newlines
- comments are effectively 'attached' to values they touch. If they're after value on the same line, then they are attached to that value. If they are above a value, they're attached to it. If a comment isn't touching any value, and it is in the root, then it isn't attached to any value. If the comment is indented inside of a mapping, but isn't touching a value then it is attached to that mapping.


XDON v2.0
Breaks backwards compatibility with YAML
- atomics are native using the @value 
- interpolation converted to 
