# Lackey Mongoose Utils
Adds some nice utilities for some thing mongoose doesn't yet support.

## remove
Implements promises

## save
Implements promises

## mergeData
Merges two objects

## populate
Mongoose Populate only works on the references in the requested document. This method allows you to populate any other data, including arrays, etc.

This method can only be used on top of a mongoose instance. Do not use **lean** before applying it.


## lean
In case we need to convert a mongoose instance into a literal object, after we have executed the query.