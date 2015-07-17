# Lackey Mongoose Utils
Adds some nice utilities for some thing mongoose doesn't yet support.

Usage example:

```
Page
    .findOne({
    	_id: '55a8d7613cdf59aa677c2d03'
	})
    .exec()
    .then(handle404()) // some function that returns 404
    .then(mongooseUtils.update(req.body)) // could also use .patch
    .then(mongooseUtils.save) // could also use .remove
    .then(res.json.bind(res), console.log.bind(console));
```

Populating sub items in an array:

```
// doc schema:
// { 
//	  items: [{
//       type: Schema.Types.ObjectId,
//       ref: 'item'
//   }]
// }
//
// item schema:
// {
//   title: String,
//   tag: {
//     type: Schema.Types.ObjectId,
//     ref: 'tag'
//   }
// }

Page
    .findOne({
    	_id: '55a8d7613cdf59aa677c2d03'
	})
    .exec()
    .then(handle404()) // some function that returns 404
    .then(mongooseUtils.populate('items'))
    .then(mongooseUtils.populate('items.tag'))
    .then(mongooseUtils.lean(true))
    .then(res.json.bind(res))
    .then(handle404(), console.log.bind(console));
```


## remove
Implements promises

## save
Implements promises

## mergeData
DEPRECATED - Use .update or .patch instead

## update
Replaces the current database document with the one provided, except for properties starting with underscore, considered private, which will remain untouched.

## patch
Merges the current database document with the new document. 

Properties starting with underscore, eg. _id, will not be changed no matter what data is provided.

## populate
Mongoose Populate only works on the references in the requested document. This method allows you to populate any other data, including arrays, etc.

This method can only be used on top of a mongoose instance. Do not use **lean** before applying it.

## lean
In case we need to convert a mongoose instance into a literal object, after we have executed the query.