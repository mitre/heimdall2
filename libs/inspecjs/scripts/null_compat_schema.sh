#/bin/bash
jq '
# Check if an object is a "normal" object, IE it has properties and stuff
def is_obj: select(type == "object" and .type == "object" and has("properties"));

# Get the properties of the given object that have null as an option
def get_nullable: .properties | [to_entries[] | select(.value.type | arrays).key];

# Remove the nullable properties of an object from its required properties
def unrequire_nullables: .required -= get_nullable;

# Get the properties of an object that arent explicitly required
def get_unrequired: (.properties | keys) - .required ;

# Add null to a type if it isnt there already. Only do this if a type exists
def add_null_array: select(.type) | .type = ((.type + ["null"]) | unique);
def add_null_singular: select(.type) | .type = [.type, "null"];
def add_null_referencial: select(.["$ref"]) | {
    "anyOf": [ . , { "type": "null" } ]
};
def add_null: [add_null_referencial?, add_null_array?, add_null_singular?, .] | first;


# Make all properties that arent required nullable
def null_unrequired: reduce get_unrequired[] as $item (.; .properties[$item] = (.properties[$item] | add_null));

# Fetch all object paths, recursively
def objs: .. | select(is_obj);

. 
# Un require nullables
| (objs |= unrequire_nullables)
# Make all non required nullable
| (objs |= null_unrequired)
' <&0