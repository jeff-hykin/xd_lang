




root_scope = {}
scope_stack = []


class Container():
    def __init__(self, args):
        self.ancestors = []
        self.primitive = False
        self.data = {}
        self.function = None
    
    def access(args):
        if self.function == None:
            self.data[args[0]]
        else:
            self.function(args)


def get_value(the_dict, key_list):
    ret = the_dict
    for k in key_list:
        ret = ret[k]
    return ret


def get_var(name):
    scope_level = list(scope_stack)
    while get_value(root_scope, scope_level):