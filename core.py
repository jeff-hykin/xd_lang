# core features
    # literal handlers
        # atom
        # string
        # number
        # pair
        # list
        # hash
    # variable retrieval (controls scope)
    # assignment
    # primitives
        # atom
        # string
        # number
        # list
        # hash
    # output
    # input
    # compile time




def siphon(var_name, the_locals, lambda_true_false):
    def level2(new_func):
        old_func = the_locals[var_name]
        def wrapper(*args, **kwargs):
            # check condition
            if lambda_true_false(*args, **kwargs):
                return new_func(*args, **kwargs)
            else:
                return old_func(*args, **kwargs)
        # overwrite the old function
        the_locals[var_name] = wrapper
        return wrapper
    return level2



class GlobalBuiltInFuncs():
    root_scope = {}
    scope_stack = []
    
    # TODO: add seams for all these functions
    @classmethod
    def log(self, *arguments):
        print(arguments)

    @classmethod
    def say(self, argument):
        print(argument)
    
    @classmethod
    def send(self, argument):
        print(argument, end='')
    
    @classmethod
    def get_scope(self, key_stack=None):
        if not key_stack:
            key_stack = GlobalBuiltInFuncs.scope_stack
        
        scope = GlobalBuiltInFuncs.root_scope
        for each in key_stack:
            scope = scope[each]
        return scope
    
    @classmethod
    def get_item(self, arg1, *args):
        args = [ arg1 ] + list(args)
        # 3 cases
        #    1. a scopeless item (result of an operation)
        #    2. just the name of the variable
        #    3. an absolute-path scope
        if not isinstance(arg1, str):
            return arg1
        else:
            if len(args) == 1:
                scope_stack = GlobalBuiltInFuncs.scope_stack + [ arg1 ]
            else:
                scope_stack = args
            
            *scope_stack, name = scope_stack
            
            item = None
            scope = GlobalBuiltInFuncs.root_scope
            for each in scope_stack:
                if name in scope:
                    item = scope[name]
                scope = scope[each]
            if not item:
                scope[name] = Item(is_fresh=True)
                return scope[name]
            else:
                return item


class Operators:
    @classmethod
    def assign(self, value1, value2):
        return value1.weakly_assign(value2)


class BasicItem():
    pass

class Undefined(BasicItem):
    pass

class Item(BasicItem):
    def __init__(self, is_fresh=False):
        self.data = {}
        if is_fresh:
            self.is_fresh = is_fresh
        else:
            self.ancestors = []
            self.function = None
    
    # this is the getting of sub-things #access
    def access(*args):
        # TODO: add ancestors lookup
        
        if len(args) == 1:
            # check for system keys
            if isinstance(args[0], SystemKey):
                value = getattr(self,key,None)
                if callable(value):
                    return value
                else:
                    # called object with a system method 
                    # this is almost certainly unintentional, which is why it raises an error
                    raise Exception(f"The system key {args[0]} was trying to be accessed, however that isn't a key for this kind of data")
            # simple hash map access
            elif not self.function:
                # always follow references for access
                if self.reference:
                    return GlobalBuiltInFuncs.get_item(self.reference).access(*args)
                # otherwise try checking the local data
                return self.data.get(args[0], Item(is_fresh=True))
        
        # if no other case then try 
        if self.function:
            return self.function(args)
        else:
            # called object access with multiple arguments with no function to handle the case  
            # this is almost certainly unintentional, which is why it raises an error
            print("An object was trying to be accessed, it was given muliple arguments, but it doesn't have an function for hanlding multiple arguments")
            print("The arguments are\n")
            GlobalBuiltInFuncs.log(*args)
            raise Exception("[see message above]")
    
    # the item itself is being assigned
    def weakly_assign(self, arg):
        # basically only points to the new value
        self.reference = arg
        return self
    
    def __str__(self):
        # always follow references for access
        if self.reference:
            reference = GlobalBuiltInFuncs.get_item(self.reference)
            return reference.__str__()
        return str(self.data)
    
    def __repr__(self):
        return self.__str__()
        
# for assigning functions
class BuiltInFunctionLink(BasicItem):
    def __init__(self, source):
        self.source = source
        
    def weakly_assign(self, new_python_function):
        self.source.function = new_python_function
        return self

class SystemKey(BasicItem):
    def weakly_assign(self, arg):
        raise Exception("Most SystemKeys cannot be assigned")

class Primitive(BasicItem):
    def weakly_assign(self, arg):
        raise Exception("Primitive types cannot be assigned")



class Atom(Primitive):
    all_atoms = {}
    number_of_keys = 0
    def __init__(self, key):
        enum = Atom.all_atoms.get(key, None)
        if enum != None:
            self.reference = enum
        else:
            Atom.number_of_keys += 1
            Atom.all_atoms[key] = Atom.number_of_keys
            self.reference = Atom.number_of_keys
    
    # add some system methods
    def key(self):
        return self.reference
    
    def __str__(self):
        return '@'+str(next(key for key, value in Atom.all_atoms.items() if value == self.reference))
    
    def __repr__(self):
        return self.__str__()
    
    def __hash__(self):
        return hash('atom-'+str(self.reference))




class String(Primitive):
    def __init__(self, string):
        self.reference = string
    
    def __str__(self):
        return self.reference

    def __repr__(self):
        return '"'+self.__str__()+'"'

# var = GlobalBuiltInFuncs.log
# @siphon("var", locals(), lambda *values: isinstance(value, String))
# def literal_string(value):
#     print(f'"{value}"')
# GlobalBuiltInFuncs.log = var

# Hello World Attempt
GlobalBuiltInFuncs.say(String("hello world"))
GlobalBuiltInFuncs.say(Atom("hello"))
GlobalBuiltInFuncs.log(Atom("hello"))
GlobalBuiltInFuncs.log(String("hello world"), Atom("hello"))
GlobalBuiltInFuncs.say(Operators.assign(GlobalBuiltInFuncs.get_item("bob"), String("hello world")))
