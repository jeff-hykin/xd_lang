# 
# pseudo code skeleton for the three main kinds of assignment
# 
    # deep copy assignment
    # shallow reference
    # deep reference

global scope = []
global objStorage = {}

def foundUnknownName(name, scope):
    # create a new object
    # give it a name
    # return it
    pass

def getObject(name, scope)
    # if the resulting object is a deep reference, it won't matter because
    # it changes the keys that are stored in objStore
    pass

def assignDeepReference(obj1, obj2):
    # find all the objStorage keys of obj1
    # make all of them point to obj2 (obj2 now has more keys)
    pass

def createCopyOf(value):
    if value isPrimitive:
        # custom stuff
        # if it's a container it 
        # becomes recursive
        pass 
    else:
        # create a new object
        # copy all primitive attributes deeply
        # however, this means 
        # object-references are shallow
        # copied, because the reference
        # attribute is a primitive
        pass

def referenceAssignment(obj1, obj2):
    # find all objStorage keys for obj1
    # change all objStorage entries from being
    # an object to being a reference-object 
    # and have the reference object point to obj2 
    pass

def copyAssignment():
    pass


class ObjectReference:
    pass

class Object:
    # - value
    # - reference
    # - data
    # - accessFunction
    # - objStorageKeys
    # - inheritance

    # accessFunction =
    #     if not arg in data:
    #         if arg in parents:
    #             return parents[arg]
    #         else:
    #             data.at(arg) = new object
    #     return data.at(arg)
    pass
    

