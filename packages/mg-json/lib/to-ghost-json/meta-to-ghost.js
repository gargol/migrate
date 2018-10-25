const _ = require('lodash');
const schema = require('../utils/schema');
const hydrate = require('./hydrate');
/**
 * A resource might be a plain resource ready for import, or if it came from our migrate tooling,
 * probably an object with some metadata (like URL) and a `data` key with the resource fields
 * E.g.
 * {
 *   url: 'http://theoriginal.url/of/the/resource',
 *   data: {
 *     title: 'the data we've managed to get so far
 *   }
 * }
 *
 * It's expected that the data object represents known Ghost keys
 * We also need to ensure that each object has at least the bare minimum properties required for an import
 *
 */
const removeMeta = (resource) => {
    return resource.data || resource;
};

const ensureValid = (resource, type) => {
    let obj = removeMeta(resource);

    if (_.has(hydrate, type)) {
        obj = hydrate[type](obj);
    }

    return obj;
};

const normalizeKey = (key) => {
    let outputKey = null;

    if (_.includes(schema.RESOURCES, key)) {
        outputKey = key;
        // If this key is singular, convert to plural form
    } else if (_.includes(_.keys(schema.RESOURCE_SINGULAR_TO_PLURAL), key)) {
        outputKey = schema.RESOURCE_SINGULAR_TO_PLURAL[key];
    }

    return outputKey;
};

const normalizeValue = (value) => {
    if (!_.isArray(value)) {
        value = [value];
    }

    return value;
};

/**
 * We expect an object with keys that match Ghost resources
 * Iterate over each key and return only ones that we recognise
 */
module.exports = (input) => {
    return _.reduce(input, (data, inputValue, inputKey) => {
        let key = normalizeKey(inputKey);
        let entries = normalizeValue(inputValue);

        if (!key) {
            // We don't recognise this key, skip
            return data;
        }

        data[key] = _.map(entries, entry => ensureValid(entry, key));

        return data;
    }, {});
};