
# TODO: make everything work with asyncio




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
            scope = GlobalBuiltInFuncs.root_scope
            item = None
            if name in scope:
                item = scope[name]
            for each in scope_stack:
                if name in scope:
                    item = scope[name]
                scope = scope[each]
            if not item:
                scope[name] = Item()
                return scope[name]
            else:
                return item
G = GlobalBuiltInFuncs

class Operators:
    @classmethod
    def assign(self, value1, value2):
        return value1.weakly_assign(value2)
O = Operators

class BasicItem():
    pass

class Undefined(BasicItem):
    pass

class Item(BasicItem):
    # TODO: create the deep_copy method
    # TODO: make reference assignment do a shallow copy
    def __init__(self):
        self.data = {}
        self.ancestors = []
        self.function = None
        self.reference = None
    
    def is_fresh(self):
        if self.function == None and len(self.data.keys()) == 0:
            return True
        return False
        
    def base_access(self, *args):
        # TODO: add ancestors lookup
        if len(args) == 1:
            # check for system keys
            if isinstance(args[0], SystemKey):
                value = getattr(self, args[0].name, None)
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
                sub_data = self.data.get(args[0], None)
                if sub_data == None:
                    return None
                else:
                    return sub_data
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
    
    # this is the getting of sub-things #access
    def access(self, *args):
        # TODO: add ancestors lookup
        print('args = ', args)
        print('self.data = ', self.data)
        value = self.base_access(*args)
        if value == None:
            for each in self.ancestors:
                try:
                    value = each.base_access(*args)
                    if value:
                        return value
                except:
                    pass
            # if no ancestors have it, then create a value on the current object
            new_item = Item()
            self.data[args[0]] = new_item
            return new_item
        else:
            return value
        
        if len(args) == 1:
            # check for system keys
            if isinstance(args[0], SystemKey):
                value = getattr(self, args[0].name, None)
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
                sub_data = self.data.get(args[0], None)
                if sub_data == None:
                    new_item = Item()
                    self.data[args[0]] = new_item
                    return new_item
                else:
                    return sub_data
        
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
        if isinstance(arg, Primitive):
            wrapped = Item()
            wrapped.ancestors.append(arg)
            self.reference = wrapped
        else:
            self.reference = arg
            
        return self
    
    def __str__(self):
        # always follow references for access
        if self.reference:
            reference = GlobalBuiltInFuncs.get_item(self.reference)
            return reference.__str__()
        return str(self.data)
    
    def __repr__(self):
        if self.reference:
            reference = GlobalBuiltInFuncs.get_item(self.reference)
            return reference.__repr__()
        return f'Item{{{self.__str__()}}}' 
        
# for assigning functions
class BuiltInFunctionLink(BasicItem):
    def __init__(self, source):
        self.source = source
        
    def weakly_assign(self, new_python_function):
        self.source.function = new_python_function
        return self

class SystemKey(BasicItem):
    def __init__(self, name):
        self.name = name
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


# TODO: create a Pair class
# TODO: create a Map class
# TODO: create a List class

class Function():
    # TODO: figure out how to represent a function as list/mapping of literals
    # TODO: make all functions async using asyncio, 
    pass
# Hello World Attempt
G.say(String("hello world"))
G.say(Atom("hello"))
G.log(Atom("hello"))
G.log(String("hello world"), Atom("hello"))
G.say(O.assign(G.get_item("bob"), String("hello world")))
print('G. = ', G.root_scope)
print(" ")
G.say(G.get_item("bob"))
G.say(G.get_item("bob").access('nickname'))
print(" ")
G.say(O.assign(G.get_item("bob").access('nickname'), String("bobby")))
print('G. = ', G.root_scope)
print(" ")
G.say(G.get_item("bob"))
G.say(G.get_item("bob").access('nickname'))
