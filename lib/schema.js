'use strict';

var Joi      = require('joi'),
    dateType = require('./types/date'),
    nodeUUID = require('node-uuid'),
    _        = require('lodash');

var internals =  {};

internals.parseOptions = function (schema, name, options) {
  options = options || {};

  if(options.hashKey) {
    schema.hashKey = name;
  } else if(options.rangeKey) {
    schema.rangeKey = name;
  } else if(options.secondaryIndex) {
    schema.secondaryIndexes.push(name);
  }
};

internals.buildSchemaObj = function (attrs) {
  return _.reduce(attrs, function (result, val, key) {
    result[key] = val.type;

    return result;
  }, {});
};

internals.baseSetup = function (schema, attrName, type, options) {
  internals.parseOptions(schema, attrName, options);

  schema.attrs[attrName] = {
    type: type,
    options: options || {}
  };

  if(options && options.hashKey) {
    schema.attrs[attrName].type.required();
  }

  return schema.attrs[attrName].type;
};

var Schema = module.exports = function () {
  this.attrs = {};
  this.secondaryIndexes = [];
};

Schema.types = Joi.types;

Schema.types.Date = dateType;

Schema.types.StringSet = function () {
  var set = Joi.types.Array().includes(Schema.types.String());

  set.type = 'StringSet';

  return set;
};

Schema.types.NumberSet = function () {
  var set = Joi.types.Array().includes(Schema.types.Number());

  set.type = 'NumberSet';
  return set;
};

Schema.types.UUID = function () {
  var uuidType = Joi.types.String();

  uuidType.type = 'UUID';

  return uuidType;
};

Schema.types.TimeUUID = function () {
  var uuidType = Joi.types.String();

  uuidType.type = 'TimeUUID';

  return uuidType;
};

Schema.prototype.String = function (attrName, options) {
  return internals.baseSetup(this, attrName, Schema.types.String(), options);
};

Schema.prototype.Number = function (attrName, options) {
  return internals.baseSetup(this, attrName, Schema.types.Number(), options);
};

Schema.prototype.Boolean = function (attrName, options) {
  return internals.baseSetup(this, attrName, Schema.types.Boolean(), options);
};

Schema.prototype.Date = function (attrName, options) {
  return internals.baseSetup(this, attrName, Schema.types.Date(), options);
};

Schema.prototype.StringSet = function (attrName, options) {
  return internals.baseSetup(this, attrName, Schema.types.StringSet(), options);
};

Schema.prototype.NumberSet = function (attrName, options) {
  return internals.baseSetup(this, attrName, Schema.types.NumberSet(), options);
};

Schema.prototype.UUID = function (attrName, options) {
  var opts = _.merge({}, {default: nodeUUID.v4}, options);

  return internals.baseSetup(this, attrName, Schema.types.UUID(), opts);
};

Schema.prototype.TimeUUID = function (attrName, options) {
  var opts = _.merge({}, {default: nodeUUID.v1}, options);

  return internals.baseSetup(this, attrName, Schema.types.TimeUUID(), opts);
};

Schema.prototype.validate = function (params) {
  var schema = internals.buildSchemaObj(this.attrs);

  return Joi.validate(params, schema);
};

Schema.prototype.defaults = function () {
  return _.reduce(this.attrs, function (result, attr, key) {
    if(attr.options.default) {
      result[key] = attr;
    }

    return result;
  }, {});
};

Schema.prototype.applyDefaults = function (data) {

  var defaults = _.reduce(this.defaults(), function (results, attr, key) {
    if(_.isUndefined(data[key])) {
      if(_.isFunction(attr.options.default)) {
        results[key] = attr.options.default();
      } else {
        results[key] = attr.options.default;
      }
    }

    return results;
  }, {});

  return _.defaults(data, defaults);
};
