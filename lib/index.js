/*jslint node:true */
'use strict';
/*
    Copyright 2015 Enigma Marketing Services Limited

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

var mongoose = require('mongoose'),
    deep = require('deep-get-set'),
    Q = require('q'),
    MongooseUtils = {};

//-------------------
// implements promises on the methods that still don't support it
// should be a temporary fix. The new version will have this sorted

MongooseUtils.remove = function (mongooseObj) {
    var promise = new mongoose.Promise();

    mongooseObj.remove(function (err) {
        if (err) {
            promise.error(err);
            return;
        }
        promise.complete(mongooseObj);
    });

    return promise;
};

MongooseUtils.save = function (mongooseObj) {
    var promise = new mongoose.Promise();

    mongooseObj.save(function (err) {
        if (err) {
            promise.error(err);
            return;
        }
        promise.complete(mongooseObj);
    });

    return promise;
};

// method can be "put" (default) or "patch"
// with "patch" literal objects get merged and everything else is replaced
//
// we consider arrays as values and replace the old data with the provided 
// array. The same happens to dates and objectIds. For now, there is no consistent 
// way to change only one element of an array
MongooseUtils.mergeData = function (newObj, method) {
    if (!method) {
        method = 'put';
    }

    function mergeNestedObject(oldObj, newObj) {
        Object.keys(newObj).forEach(function (key) {
            var isObject = (typeof newObj[key] === 'object'),
                isDate = (newObj[key] instanceof Date);

            if (!isObject || isDate) {
                oldObj[key] = newObj[key];
            } else {
                if (!oldObj[key]) {
                    oldObj[key] = newObj[key];
                } else {
                    mergeNestedObject(oldObj[key], newObj[key]);
                }
            }
        });
    }

    return function (mongooseObj) {
        if (!mongooseObj) {
            return mongooseObj;
        }

        var objKeys = Object.keys((mongooseObj.toObject && mongooseObj.toObject()) || mongooseObj); // Object.keys(mongooseObj.schema.paths);

        objKeys.forEach(function (key) {
            var newVal = deep(newObj, key),
                isPut,
                isObject,
                isDate,
                isArray,
                isObjectId;
            // we do not allow changing of keys starting 
            // with "_". Those are private.
            if (key.charAt(0) === '_') {
                return;
            }

            if (method === 'put' && newVal === undefined) {
                delete mongooseObj[key];
            } else if (newVal !== undefined && newVal !== null) {
                isPut = (method === 'put');
                isObject = (typeof newVal === 'object');
                isDate = (newVal instanceof Date);
                isArray = Array.isArray(newVal);
                isObjectId = /[0-9a-f]{24}/.test(newVal.toString());

                if (isPut || !isObject || isDate || isArray || isObjectId) {
                    deep(mongooseObj, key, newVal);
                } else {
                    mergeNestedObject(mongooseObj[key], newVal);
                }
            }
        });

        return mongooseObj;
    };
};

// populate nested objects
MongooseUtils.populate = function (objPath, path, selectFields) {
    var pathItems = [],
        promises = [];

    if (arguments.length < 3) {
        selectFields = path;
        path = objPath;
        pathItems = [];
    } else {
        pathItems = objPath.split('.');
    }

    function parsePath(doc) {
        var obj = doc;

        pathItems.forEach(function (path) {
            obj = doc[path];

            if (obj === undefined) {
                throw new Error('invalid path ' + path + ' in ' + objPath);
            }
        });
        return obj;
    }

    function populate(obj, path, selectFields) {
        var deferred = Q.defer();

        if (!obj.populate) {
            return;
        }

        promises.push(deferred.promise);

        obj.populate(path, selectFields, function (err) {
            if (err) {
                deferred.reject(err);
            } else {
                deferred.resolve();
            }
        });
    }

    return function (doc) {
        var promise = new mongoose.Promise(),
            obj = parsePath(doc);

        if (obj.length) {
            obj.forEach(function (item) {
                populate(item, path, selectFields);
            });
        } else {
            populate(obj, path, selectFields);
        }

        Q.all(promises)
            .then(function () {
                promise.complete(doc);
            })
            .fail(function (err) {
                promise.error(err);
            });

        return promise;
    };
};

MongooseUtils.lean = function (convertToObject) {
    if (convertToObject === undefined) {
        convertToObject = true;
    }

    return function (doc) {
        var data;

        if (!convertToObject) {
            return doc;
        }

        if (Array.isArray(doc)) {
            data = [];
            doc.forEach(function (item) {
                data.push(item.toObject());
            });
        } else {
            data = doc.toObject();
        }

        return data;
    };
};


module.exports = MongooseUtils;