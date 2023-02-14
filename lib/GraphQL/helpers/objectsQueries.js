"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.needToGetAllKeys = exports.calculateSkipAndLimit = exports.findObjects = exports.getObject = void 0;

var _node = _interopRequireDefault(require("parse/node"));

var _graphqlRelay = require("graphql-relay");

var _rest = _interopRequireDefault(require("../../rest"));

var _query = require("../transformers/query");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Eslint/Prettier conflict

/* eslint-disable*/
const needToGetAllKeys = (fields, keys, parseClasses) => keys ? keys.split(',').some(keyName => {
  const key = keyName.split('.');

  if (fields[key[0]]) {
    if (fields[key[0]].type === 'Relation') return false;

    if (fields[key[0]].type === 'Pointer') {
      const subClass = parseClasses[fields[key[0]].targetClass];

      if (subClass && subClass.fields[key[1]]) {
        // Current sub key is not custom
        return false;
      }
    } else if (!key[1] || fields[key[0]].type === 'Array' || fields[key[0]].type === 'Object') {
      // current key is not custom
      return false;
    }
  } // Key not found into Parse Schema so it's custom


  return true;
}) : true;
/* eslint-enable*/


exports.needToGetAllKeys = needToGetAllKeys;

const getObject = async (className, objectId, keys, include, readPreference, includeReadPreference, config, auth, info, parseClasses) => {
  const options = {};

  try {
    if (!needToGetAllKeys(parseClasses[className].fields, keys, parseClasses)) {
      options.keys = keys;
    }
  } catch (e) {
    console.error(e);
  }

  if (include) {
    options.include = include;

    if (includeReadPreference) {
      options.includeReadPreference = includeReadPreference;
    }
  }

  if (readPreference) {
    options.readPreference = readPreference;
  }

  const response = await _rest.default.get(config, auth, className, objectId, options, info.clientSDK, info.context);

  if (!response.results || response.results.length == 0) {
    throw new _node.default.Error(_node.default.Error.OBJECT_NOT_FOUND, 'Object not found.');
  }

  const object = response.results[0];

  if (className === '_User') {
    delete object.sessionToken;
  }

  return object;
};

exports.getObject = getObject;

const findObjects = async (className, where, order, skipInput, first, after, last, before, keys, include, includeAll, readPreference, includeReadPreference, subqueryReadPreference, config, auth, info, selectedFields, parseClasses) => {
  if (!where) {
    where = {};
  }

  (0, _query.transformQueryInputToParse)(where, className, parseClasses);
  const skipAndLimitCalculation = calculateSkipAndLimit(skipInput, first, after, last, before, config.maxLimit);
  let {
    skip
  } = skipAndLimitCalculation;
  const {
    limit,
    needToPreCount
  } = skipAndLimitCalculation;
  let preCount = undefined;

  if (needToPreCount) {
    const preCountOptions = {
      limit: 0,
      count: true
    };

    if (readPreference) {
      preCountOptions.readPreference = readPreference;
    }

    if (Object.keys(where).length > 0 && subqueryReadPreference) {
      preCountOptions.subqueryReadPreference = subqueryReadPreference;
    }

    preCount = (await _rest.default.find(config, auth, className, where, preCountOptions, info.clientSDK, info.context)).count;

    if ((skip || 0) + limit < preCount) {
      skip = preCount - limit;
    }
  }

  const options = {};

  if (selectedFields.find(field => field.startsWith('edges.') || field.startsWith('pageInfo.'))) {
    if (limit || limit === 0) {
      options.limit = limit;
    } else {
      options.limit = 100;
    }

    if (options.limit !== 0) {
      if (order) {
        options.order = order;
      }

      if (skip) {
        options.skip = skip;
      }

      if (config.maxLimit && options.limit > config.maxLimit) {
        // Silently replace the limit on the query with the max configured
        options.limit = config.maxLimit;
      }

      if (!needToGetAllKeys(parseClasses[className].fields, keys, parseClasses)) {
        options.keys = keys;
      }

      if (includeAll === true) {
        options.includeAll = includeAll;
      }

      if (!options.includeAll && include) {
        options.include = include;
      }

      if ((options.includeAll || options.include) && includeReadPreference) {
        options.includeReadPreference = includeReadPreference;
      }
    }
  } else {
    options.limit = 0;
  }

  if ((selectedFields.includes('count') || selectedFields.includes('pageInfo.hasPreviousPage') || selectedFields.includes('pageInfo.hasNextPage')) && !needToPreCount) {
    options.count = true;
  }

  if (readPreference) {
    options.readPreference = readPreference;
  }

  if (Object.keys(where).length > 0 && subqueryReadPreference) {
    options.subqueryReadPreference = subqueryReadPreference;
  }

  let results, count;

  if (options.count || !options.limit || options.limit && options.limit > 0) {
    const findResult = await _rest.default.find(config, auth, className, where, options, info.clientSDK, info.context);
    results = findResult.results;
    count = findResult.count;
  }

  let edges = null;
  let pageInfo = null;

  if (results) {
    edges = results.map((result, index) => ({
      cursor: (0, _graphqlRelay.offsetToCursor)((skip || 0) + index),
      node: result
    }));
    pageInfo = {
      hasPreviousPage: (preCount && preCount > 0 || count && count > 0) && skip !== undefined && skip > 0,
      startCursor: (0, _graphqlRelay.offsetToCursor)(skip || 0),
      endCursor: (0, _graphqlRelay.offsetToCursor)((skip || 0) + (results.length || 1) - 1),
      hasNextPage: (preCount || count) > (skip || 0) + results.length
    };
  }

  return {
    edges,
    pageInfo,
    count: preCount || count
  };
};

exports.findObjects = findObjects;

const calculateSkipAndLimit = (skipInput, first, after, last, before, maxLimit) => {
  let skip = undefined;
  let limit = undefined;
  let needToPreCount = false; // Validates the skip input

  if (skipInput || skipInput === 0) {
    if (skipInput < 0) {
      throw new _node.default.Error(_node.default.Error.INVALID_QUERY, 'Skip should be a positive number');
    }

    skip = skipInput;
  } // Validates the after param


  if (after) {
    after = (0, _graphqlRelay.cursorToOffset)(after);

    if (!after && after !== 0 || after < 0) {
      throw new _node.default.Error(_node.default.Error.INVALID_QUERY, 'After is not a valid cursor');
    } // If skip and after are passed, a new skip is calculated by adding them


    skip = (skip || 0) + (after + 1);
  } // Validates the first param


  if (first || first === 0) {
    if (first < 0) {
      throw new _node.default.Error(_node.default.Error.INVALID_QUERY, 'First should be a positive number');
    } // The first param is translated to the limit param of the Parse legacy API


    limit = first;
  } // Validates the before param


  if (before || before === 0) {
    // This method converts the cursor to the index of the object
    before = (0, _graphqlRelay.cursorToOffset)(before);

    if (!before && before !== 0 || before < 0) {
      throw new _node.default.Error(_node.default.Error.INVALID_QUERY, 'Before is not a valid cursor');
    }

    if ((skip || 0) >= before) {
      // If the before index is less then the skip, no objects will be returned
      limit = 0;
    } else if (!limit && limit !== 0 || (skip || 0) + limit > before) {
      // If there is no limit set, the limit is calculated. Or, if the limit (plus skip) is bigger than the before index, the new limit is set.
      limit = before - (skip || 0);
    }
  } // Validates the last param


  if (last || last === 0) {
    if (last < 0) {
      throw new _node.default.Error(_node.default.Error.INVALID_QUERY, 'Last should be a positive number');
    }

    if (last > maxLimit) {
      // Last can't be bigger than Parse server maxLimit config.
      last = maxLimit;
    }

    if (limit || limit === 0) {
      // If there is a previous limit set, it may be adjusted
      if (last < limit) {
        // if last is less than the current limit
        skip = (skip || 0) + (limit - last); // The skip is adjusted

        limit = last; // the limit is adjusted
      }
    } else if (last === 0) {
      // No objects will be returned
      limit = 0;
    } else {
      // No previous limit set, the limit will be equal to last and pre count is needed.
      limit = last;
      needToPreCount = true;
    }
  }

  return {
    skip,
    limit,
    needToPreCount
  };
};

exports.calculateSkipAndLimit = calculateSkipAndLimit;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9HcmFwaFFML2hlbHBlcnMvb2JqZWN0c1F1ZXJpZXMuanMiXSwibmFtZXMiOlsibmVlZFRvR2V0QWxsS2V5cyIsImZpZWxkcyIsImtleXMiLCJwYXJzZUNsYXNzZXMiLCJzcGxpdCIsInNvbWUiLCJrZXlOYW1lIiwia2V5IiwidHlwZSIsInN1YkNsYXNzIiwidGFyZ2V0Q2xhc3MiLCJnZXRPYmplY3QiLCJjbGFzc05hbWUiLCJvYmplY3RJZCIsImluY2x1ZGUiLCJyZWFkUHJlZmVyZW5jZSIsImluY2x1ZGVSZWFkUHJlZmVyZW5jZSIsImNvbmZpZyIsImF1dGgiLCJpbmZvIiwib3B0aW9ucyIsImUiLCJjb25zb2xlIiwiZXJyb3IiLCJyZXNwb25zZSIsInJlc3QiLCJnZXQiLCJjbGllbnRTREsiLCJjb250ZXh0IiwicmVzdWx0cyIsImxlbmd0aCIsIlBhcnNlIiwiRXJyb3IiLCJPQkpFQ1RfTk9UX0ZPVU5EIiwib2JqZWN0Iiwic2Vzc2lvblRva2VuIiwiZmluZE9iamVjdHMiLCJ3aGVyZSIsIm9yZGVyIiwic2tpcElucHV0IiwiZmlyc3QiLCJhZnRlciIsImxhc3QiLCJiZWZvcmUiLCJpbmNsdWRlQWxsIiwic3VicXVlcnlSZWFkUHJlZmVyZW5jZSIsInNlbGVjdGVkRmllbGRzIiwic2tpcEFuZExpbWl0Q2FsY3VsYXRpb24iLCJjYWxjdWxhdGVTa2lwQW5kTGltaXQiLCJtYXhMaW1pdCIsInNraXAiLCJsaW1pdCIsIm5lZWRUb1ByZUNvdW50IiwicHJlQ291bnQiLCJ1bmRlZmluZWQiLCJwcmVDb3VudE9wdGlvbnMiLCJjb3VudCIsIk9iamVjdCIsImZpbmQiLCJmaWVsZCIsInN0YXJ0c1dpdGgiLCJpbmNsdWRlcyIsImZpbmRSZXN1bHQiLCJlZGdlcyIsInBhZ2VJbmZvIiwibWFwIiwicmVzdWx0IiwiaW5kZXgiLCJjdXJzb3IiLCJub2RlIiwiaGFzUHJldmlvdXNQYWdlIiwic3RhcnRDdXJzb3IiLCJlbmRDdXJzb3IiLCJoYXNO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QSxLQUFLLEdBQUcsQ0FBUjtBQUNELEtBSE0sTUFHQTtBQUNMO0FBQ0FBLE1BQUFBLEtBQUssR0FBR1QsSUFBUjtBQUNBVSxNQUFBQSxjQUFjLEdBQUcsSUFBakI7QUFDRDtBQUNGOztBQUNELFNBQU87QUFDTEYsSUFBQUEsSUFESztBQUVMQyxJQUFBQSxLQUZLO0FBR0xDLElBQUFBO0FBSEssR0FBUDtBQUtELENBbkZEIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFBhcnNlIGZyb20gJ3BhcnNlL25vZGUnO1xuaW1wb3J0IHsgb2Zmc2V0VG9DdXJzb3IsIGN1cnNvclRvT2Zmc2V0IH0gZnJvbSAnZ3JhcGhxbC1yZWxheSc7XG5pbXBvcnQgcmVzdCBmcm9tICcuLi8uLi9yZXN0JztcbmltcG9ydCB7IHRyYW5zZm9ybVF1ZXJ5SW5wdXRUb1BhcnNlIH0gZnJvbSAnLi4vdHJhbnNmb3JtZXJzL3F1ZXJ5JztcblxuLy8gRXNsaW50L1ByZXR0aWVyIGNvbmZsaWN0XG4vKiBlc2xpbnQtZGlzYWJsZSovXG5jb25zdCBuZWVkVG9HZXRBbGxLZXlzID0gKGZpZWxkcywga2V5cywgcGFyc2VDbGFzc2VzKSA9PlxuICBrZXlzXG4gICAgPyBrZXlzLnNwbGl0KCcsJykuc29tZShrZXlOYW1lID0+IHtcbiAgICAgICAgY29uc3Qga2V5ID0ga2V5TmFtZS5zcGxpdCgnLicpO1xuICAgICAgICBpZiAoZmllbGRzW2tleVswXV0pIHtcbiAgICAgICAgICBpZiAoZmllbGRzW2tleVswXV0udHlwZSA9PT0gJ1JlbGF0aW9uJykgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIGlmIChmaWVsZHNba2V5WzBdXS50eXBlID09PSAnUG9pbnRlcicpIHtcbiAgICAgICAgICAgIGNvbnN0IHN1YkNsYXNzID0gcGFyc2VDbGFzc2VzW2ZpZWxkc1trZXlbMF1dLnRhcmdldENsYXNzXTtcbiAgICAgICAgICAgIGlmIChzdWJDbGFzcyAmJiBzdWJDbGFzcy5maWVsZHNba2V5WzFdXSkge1xuICAgICAgICAgICAgICAvLyBDdXJyZW50IHN1YiBrZXkgaXMgbm90IGN1c3RvbVxuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICFrZXlbMV0gfHxcbiAgICAgICAgICAgIGZpZWxkc1trZXlbMF1dLnR5cGUgPT09ICdBcnJheScgfHxcbiAgICAgICAgICAgIGZpZWxkc1trZXlbMF1dLnR5cGUgPT09ICdPYmplY3QnXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICAvLyBjdXJyZW50IGtleSBpcyBub3QgY3VzdG9tXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIEtleSBub3QgZm91bmQgaW50byBQYXJzZSBTY2hlbWEgc28gaXQncyBjdXN0b21cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9KVxuICAgIDogdHJ1ZTtcbi8qIGVzbGludC1lbmFibGUqL1xuXG5jb25zdCBnZXRPYmplY3QgPSBhc3luYyAoXG4gIGNsYXNzTmFtZSxcbiAgb2JqZWN0SWQsXG4gIGtleXMsXG4gIGluY2x1ZGUsXG4gIHJlYWRQcmVmZXJlbmNlLFxuICBpbmNsdWRlUmVhZFByZWZlcmVuY2UsXG4gIGNvbmZpZyxcbiAgYXV0aCxcbiAgaW5mbyxcbiAgcGFyc2VDbGFzc2VzXG4pID0+IHtcbiAgY29uc3Qgb3B0aW9ucyA9IHt9O1xuICB0cnkge1xuICAgIGlmICghbmVlZFRvR2V0QWxsS2V5cyhwYXJzZUNsYXNzZXNbY2xhc3NOYW1lXS5maWVsZHMsIGtleXMsIHBhcnNlQ2xhc3NlcykpIHtcbiAgICAgIG9wdGlvbnMua2V5cyA9IGtleXM7XG4gICAgfVxuICB9IGNhdGNoIChlKSB7XG4gICAgY29uc29sZS5lcnJvcihlKTtcbiAgfVxuICBpZiAoaW5jbHVkZSkge1xuICAgIG9wdGlvbnMuaW5jbHVkZSA9IGluY2x1ZGU7XG4gICAgaWYgKGluY2x1ZGVSZWFkUHJlZmVyZW5jZSkge1xuICAgICAgb3B0aW9ucy5pbmNsdWRlUmVhZFByZWZlcmVuY2UgPSBpbmNsdWRlUmVhZFByZWZlcmVuY2U7XG4gICAgfVxuICB9XG4gIGlmIChyZWFkUHJlZmVyZW5jZSkge1xuICAgIG9wdGlvbnMucmVhZFByZWZlcmVuY2UgPSByZWFkUHJlZmVyZW5jZTtcbiAgfVxuXG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgcmVzdC5nZXQoXG4gICAgY29uZmlnLFxuICAgIGF1dGgsXG4gICAgY2xhc3NOYW1lLFxuICAgIG9iamVjdElkLFxuICAgIG9wdGlvbnMsXG4gICAgaW5mby5jbGllbnRTREssXG4gICAgaW5mby5jb250ZXh0XG4gICk7XG5cbiAgaWYgKCFyZXNwb25zZS5yZXN1bHRzIHx8IHJlc3BvbnNlLnJlc3VsdHMubGVuZ3RoID09IDApIHtcbiAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuT0JKRUNUX05PVF9GT1VORCwgJ09iamVjdCBub3QgZm91bmQuJyk7XG4gIH1cblxuICBjb25zdCBvYmplY3QgPSByZXNwb25zZS5yZXN1bHRzWzBdO1xuICBpZiAoY2xhc3NOYW1lID09PSAnX1VzZXInKSB7XG4gICAgZGVsZXRlIG9iamVjdC5zZXNzaW9uVG9rZW47XG4gIH1cbiAgcmV0dXJuIG9iamVjdDtcbn07XG5cbmNvbnN0IGZpbmRPYmplY3RzID0gYXN5bmMgKFxuICBjbGFzc05hbWUsXG4gIHdoZXJlLFxuICBvcmRlcixcbiAgc2tpcElucHV0LFxuICBmaXJzdCxcbiAgYWZ0ZXIsXG4gIGxhc3QsXG4gIGJlZm9yZSxcbiAga2V5cyxcbiAgaW5jbHVkZSxcbiAgaW5jbHVkZUFsbCxcbiAgcmVhZFByZWZlcmVuY2UsXG4gIGluY2x1ZGVSZWFkUHJlZmVyZW5jZSxcbiAgc3VicXVlcnlSZWFkUHJlZmVyZW5jZSxcbiAgY29uZmlnLFxuICBhdXRoLFxuICBpbmZvLFxuICBzZWxlY3RlZEZpZWxkcyxcbiAgcGFyc2VDbGFzc2VzXG4pID0+IHtcbiAgaWYgKCF3aGVyZSkge1xuICAgIHdoZXJlID0ge307XG4gIH1cbiAgdHJhbnNmb3JtUXVlcnlJbnB1dFRvUGFyc2Uod2hlcmUsIGNsYXNzTmFtZSwgcGFyc2VDbGFzc2VzKTtcbiAgY29uc3Qgc2tpcEFuZExpbWl0Q2FsY3VsYXRpb24gPSBjYWxjdWxhdGVTa2lwQW5kTGltaXQoXG4gICAgc2tpcElucHV0LFxuICAgIGZpcnN0LFxuICAgIGFmdGVyLFxuICAgIGxhc3QsXG4gICAgYmVmb3JlLFxuICAgIGNvbmZpZy5tYXhMaW1pdFxuICApO1xuICBsZXQgeyBza2lwIH0gPSBza2lwQW5kTGltaXRDYWxjdWxhdGlvbjtcbiAgY29uc3QgeyBsaW1pdCwgbmVlZFRvUHJlQ291bnQgfSA9IHNraXBBbmRMaW1pdENhbGN1bGF0aW9uO1xuICBsZXQgcHJlQ291bnQgPSB1bmRlZmluZWQ7XG4gIGlmIChuZWVkVG9QcmVDb3VudCkge1xuICAgIGNvbnN0IHByZUNvdW50T3B0aW9ucyA9IHtcbiAgICAgIGxpbWl0OiAwLFxuICAgICAgY291bnQ6IHRydWUsXG4gICAgfTtcbiAgICBpZiAocmVhZFByZWZlcmVuY2UpIHtcbiAgICAgIHByZUNvdW50T3B0aW9ucy5yZWFkUHJlZmVyZW5jZSA9IHJlYWRQcmVmZXJlbmNlO1xuICAgIH1cbiAgICBpZiAoT2JqZWN0LmtleXMod2hlcmUpLmxlbmd0aCA+IDAgJiYgc3VicXVlcnlSZWFkUHJlZmVyZW5jZSkge1xuICAgICAgcHJlQ291bnRPcHRpb25zLnN1YnF1ZXJ5UmVhZFByZWZlcmVuY2UgPSBzdWJxdWVyeVJlYWRQcmVmZXJlbmNlO1xuICAgIH1cbiAgICBwcmVDb3VudCA9IChcbiAgICAgIGF3YWl0IHJlc3QuZmluZChjb25maWcsIGF1dGgsIGNsYXNzTmFtZSwgd2hlcmUsIHByZUNvdW50T3B0aW9ucywgaW5mby5jbGllbnRTREssIGluZm8uY29udGV4dClcbiAgICApLmNvdW50O1xuICAgIGlmICgoc2tpcCB8fCAwKSArIGxpbWl0IDwgcHJlQ291bnQpIHtcbiAgICAgIHNraXAgPSBwcmVDb3VudCAtIGxpbWl0O1xuICAgIH1cbiAgfVxuXG4gIGNvbnN0IG9wdGlvbnMgPSB7fTtcblxuICBpZiAoc2VsZWN0ZWRGaWVsZHMuZmluZChmaWVsZCA9PiBmaWVsZC5zdGFydHNXaXRoKCdlZGdlcy4nKSB8fCBmaWVsZC5zdGFydHNXaXRoKCdwYWdlSW5mby4nKSkpIHtcbiAgICBpZiAobGltaXQgfHwgbGltaXQgPT09IDApIHtcbiAgICAgIG9wdGlvbnMubGltaXQgPSBsaW1pdDtcbiAgICB9IGVsc2Uge1xuICAgICAgb3B0aW9ucy5saW1pdCA9IDEwMDtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMubGltaXQgIT09IDApIHtcbiAgICAgIGlmIChvcmRlcikge1xuICAgICAgICBvcHRpb25zLm9yZGVyID0gb3JkZXI7XG4gICAgICB9XG4gICAgICBpZiAoc2tpcCkge1xuICAgICAgICBvcHRpb25zLnNraXAgPSBza2lwO1xuICAgICAgfVxuICAgICAgaWYgKGNvbmZpZy5tYXhMaW1pdCAmJiBvcHRpb25zLmxpbWl0ID4gY29uZmlnLm1heExpbWl0KSB7XG4gICAgICAgIC8vIFNpbGVudGx5IHJlcGxhY2UgdGhlIGxpbWl0IG9uIHRoZSBxdWVyeSB3aXRoIHRoZSBtYXggY29uZmlndXJlZFxuICAgICAgICBvcHRpb25zLmxpbWl0ID0gY29uZmlnLm1heExpbWl0O1xuICAgICAgfVxuICAgICAgaWYgKCFuZWVkVG9HZXRBbGxLZXlzKHBhcnNlQ2xhc3Nlc1tjbGFzc05hbWVdLmZpZWxkcywga2V5cywgcGFyc2VDbGFzc2VzKSkge1xuICAgICAgICBvcHRpb25zLmtleXMgPSBrZXlzO1xuICAgICAgfVxuICAgICAgaWYgKGluY2x1ZGVBbGwgPT09IHRydWUpIHtcbiAgICAgICAgb3B0aW9ucy5pbmNsdWRlQWxsID0gaW5jbHVkZUFsbDtcbiAgICAgIH1cbiAgICAgIGlmICghb3B0aW9ucy5pbmNsdWRlQWxsICYmIGluY2x1ZGUpIHtcbiAgICAgICAgb3B0aW9ucy5pbmNsdWRlID0gaW5jbHVkZTtcbiAgICAgIH1cbiAgICAgIGlmICgob3B0aW9ucy5pbmNsdWRlQWxsIHx8IG9wdGlvbnMuaW5jbHVkZSkgJiYgaW5jbHVkZVJlYWRQcmVmZXJlbmNlKSB7XG4gICAgICAgIG9wdGlvbnMuaW5jbHVkZVJlYWRQcmVmZXJlbmNlID0gaW5jbHVkZVJlYWRQcmVmZXJlbmNlO1xuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBvcHRpb25zLmxpbWl0ID0gMDtcbiAgfVxuXG4gIGlmIChcbiAgICAoc2VsZWN0ZWRGaWVsZHMuaW5jbHVkZXMoJ2NvdW50JykgfHxcbiAgICAgIHNlbGVjdGVkRmllbGRzLmluY2x1ZGVzKCdwYWdlSW5mby5oYXNQcmV2aW91c1BhZ2UnKSB8fFxuICAgICAgc2VsZWN0ZWRGaWVsZHMuaW5jbHVkZXMoJ3BhZ2VJbmZvLmhhc05leHRQYWdlJykpICYmXG4gICAgIW5lZWRUb1ByZUNvdW50XG4gICkge1xuICAgIG9wdGlvbnMuY291bnQgPSB0cnVlO1xuICB9XG5cbiAgaWYgKHJlYWRQcmVmZXJlbmNlKSB7XG4gICAgb3B0aW9ucy5yZWFkUHJlZmVyZW5jZSA9IHJlYWRQcmVmZXJlbmNlO1xuICB9XG4gIGlmIChPYmplY3Qua2V5cyh3aGVyZSkubGVuZ3RoID4gMCAmJiBzdWJxdWVyeVJlYWRQcmVmZXJlbmNlKSB7XG4gICAgb3B0aW9ucy5zdWJxdWVyeVJlYWRQcmVmZXJlbmNlID0gc3VicXVlcnlSZWFkUHJlZmVyZW5jZTtcbiAgfVxuXG4gIGxldCByZXN1bHRzLCBjb3VudDtcbiAgaWYgKG9wdGlvbnMuY291bnQgfHwgIW9wdGlvbnMubGltaXQgfHwgKG9wdGlvbnMubGltaXQgJiYgb3B0aW9ucy5saW1pdCA+IDApKSB7XG4gICAgY29uc3QgZmluZFJlc3VsdCA9IGF3YWl0IHJlc3QuZmluZChcbiAgICAgIGNvbmZpZyxcbiAgICAgIGF1dGgsXG4gICAgICBjbGFzc05hbWUsXG4gICAgICB3aGVyZSxcbiAgICAgIG9wdGlvbnMsXG4gICAgICBpbmZvLmNsaWVudFNESyxcbiAgICAgIGluZm8uY29udGV4dFxuICAgICk7XG4gICAgcmVzdWx0cyA9IGZpbmRSZXN1bHQucmVzdWx0cztcbiAgICBjb3VudCA9IGZpbmRSZXN1bHQuY291bnQ7XG4gIH1cblxuICBsZXQgZWRnZXMgPSBudWxsO1xuICBsZXQgcGFnZUluZm8gPSBudWxsO1xuICBpZiAocmVzdWx0cykge1xuICAgIGVkZ2VzID0gcmVzdWx0cy5tYXAoKHJlc3VsdCwgaW5kZXgpID0+ICh7XG4gICAgICBjdXJzb3I6IG9mZnNldFRvQ3Vyc29yKChza2lwIHx8IDApICsgaW5kZXgpLFxuICAgICAgbm9kZTogcmVzdWx0LFxuICAgIH0pKTtcblxuICAgIHBhZ2VJbmZvID0ge1xuICAgICAgaGFzUHJldmlvdXNQYWdlOlxuICAgICAgICAoKHByZUNvdW50ICYmIHByZUNvdW50ID4gMCkgfHwgKGNvdW50ICYmIGNvdW50ID4gMCkpICYmIHNraXAgIT09IHVuZGVmaW5lZCAmJiBza2lwID4gMCxcbiAgICAgIHN0YXJ0Q3Vyc29yOiBvZmZzZXRUb0N1cnNvcihza2lwIHx8IDApLFxuICAgICAgZW5kQ3Vyc29yOiBvZmZzZXRUb0N1cnNvcigoc2tpcCB8fCAwKSArIChyZXN1bHRzLmxlbmd0aCB8fCAxKSAtIDEpLFxuICAgICAgaGFzTmV4dFBhZ2U6IChwcmVDb3VudCB8fCBjb3VudCkgPiAoc2tpcCB8fCAwKSArIHJlc3VsdHMubGVuZ3RoLFxuICAgIH07XG4gIH1cblxuICByZXR1cm4ge1xuICAgIGVkZ2VzLFxuICAgIHBhZ2VJbmZvLFxuICAgIGNvdW50OiBwcmVDb3VudCB8fCBjb3VudCxcbiAgfTtcbn07XG5cbmNvbnN0IGNhbGN1bGF0ZVNraXBBbmRMaW1pdCA9IChza2lwSW5wdXQsIGZpcnN0LCBhZnRlciwgbGFzdCwgYmVmb3JlLCBtYXhMaW1pdCkgPT4ge1xuICBsZXQgc2tpcCA9IHVuZGVmaW5lZDtcbiAgbGV0IGxpbWl0ID0gdW5kZWZpbmVkO1xuICBsZXQgbmVlZFRvUHJlQ291bnQgPSBmYWxzZTtcblxuICAvLyBWYWxpZGF0ZXMgdGhlIHNraXAgaW5wdXRcbiAgaWYgKHNraXBJbnB1dCB8fCBza2lwSW5wdXQgPT09IDApIHtcbiAgICBpZiAoc2tpcElucHV0IDwgMCkge1xuICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFBhcnNlLkVycm9yLklOVkFMSURfUVVFUlksICdTa2lwIHNob3VsZCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICAgIH1cbiAgICBza2lwID0gc2tpcElucHV0O1xuICB9XG5cbiAgLy8gVmFsaWRhdGVzIHRoZSBhZnRlciBwYXJhbVxuICBpZiAoYWZ0ZXIpIHtcbiAgICBhZnRlciA9IGN1cnNvclRvT2Zmc2V0KGFmdGVyKTtcbiAgICBpZiAoKCFhZnRlciAmJiBhZnRlciAhPT0gMCkgfHwgYWZ0ZXIgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5WQUxJRF9RVUVSWSwgJ0FmdGVyIGlzIG5vdCBhIHZhbGlkIGN1cnNvcicpO1xuICAgIH1cblxuICAgIC8vIElmIHNraXAgYW5kIGFmdGVyIGFyZSBwYXNzZWQsIGEgbmV3IHNraXAgaXMgY2FsY3VsYXRlZCBieSBhZGRpbmcgdGhlbVxuICAgIHNraXAgPSAoc2tpcCB8fCAwKSArIChhZnRlciArIDEpO1xuICB9XG5cbiAgLy8gVmFsaWRhdGVzIHRoZSBmaXJzdCBwYXJhbVxuICBpZiAoZmlyc3QgfHwgZmlyc3QgPT09IDApIHtcbiAgICBpZiAoZmlyc3QgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5WQUxJRF9RVUVSWSwgJ0ZpcnN0IHNob3VsZCBiZSBhIHBvc2l0aXZlIG51bWJlcicpO1xuICAgIH1cblxuICAgIC8vIFRoZSBmaXJzdCBwYXJhbSBpcyB0cmFuc2xhdGVkIHRvIHRoZSBsaW1pdCBwYXJhbSBvZiB0aGUgUGFyc2UgbGVnYWN5IEFQSVxuICAgIGxpbWl0ID0gZmlyc3Q7XG4gIH1cblxuICAvLyBWYWxpZGF0ZXMgdGhlIGJlZm9yZSBwYXJhbVxuICBpZiAoYmVmb3JlIHx8IGJlZm9yZSA9PT0gMCkge1xuICAgIC8vIFRoaXMgbWV0aG9kIGNvbnZlcnRzIHRoZSBjdXJzb3IgdG8gdGhlIGluZGV4IG9mIHRoZSBvYmplY3RcbiAgICBiZWZvcmUgPSBjdXJzb3JUb09mZnNldChiZWZvcmUpO1xuICAgIGlmICgoIWJlZm9yZSAmJiBiZWZvcmUgIT09IDApIHx8IGJlZm9yZSA8IDApIHtcbiAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihQYXJzZS5FcnJvci5JTlZBTElEX1FVRVJZLCAnQmVmb3JlIGlzIG5vdCBhIHZhbGlkIGN1cnNvcicpO1xuICAgIH1cblxuICAgIGlmICgoc2tpcCB8fCAwKSA+PSBiZWZvcmUpIHtcbiAgICAgIC8vIElmIHRoZSBiZWZvcmUgaW5kZXggaXMgbGVzcyB0aGVuIHRoZSBza2lwLCBubyBvYmplY3RzIHdpbGwgYmUgcmV0dXJuZWRcbiAgICAgIGxpbWl0ID0gMDtcbiAgICB9IGVsc2UgaWYgKCghbGltaXQgJiYgbGltaXQgIT09IDApIHx8IChza2lwIHx8IDApICsgbGltaXQgPiBiZWZvcmUpIHtcbiAgICAgIC8vIElmIHRoZXJlIGlzIG5vIGxpbWl0IHNldCwgdGhlIGxpbWl0IGlzIGNhbGN1bGF0ZWQuIE9yLCBpZiB0aGUgbGltaXQgKHBsdXMgc2tpcCkgaXMgYmlnZ2VyIHRoYW4gdGhlIGJlZm9yZSBpbmRleCwgdGhlIG5ldyBsaW1pdCBpcyBzZXQuXG4gICAgICBsaW1pdCA9IGJlZm9yZSAtIChza2lwIHx8IDApO1xuICAgIH1cbiAgfVxuXG4gIC8vIFZhbGlkYXRlcyB0aGUgbGFzdCBwYXJhbVxuICBpZiAobGFzdCB8fCBsYXN0ID09PSAwKSB7XG4gICAgaWYgKGxhc3QgPCAwKSB7XG4gICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoUGFyc2UuRXJyb3IuSU5WQUxJRF9RVUVSWSwgJ0xhc3Qgc2hvdWxkIGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gICAgfVxuXG4gICAgaWYgKGxhc3QgPiBtYXhMaW1pdCkge1xuICAgICAgLy8gTGFzdCBjYW4ndCBiZSBiaWdnZXIgdGhhbiBQYXJzZSBzZXJ2ZXIgbWF4TGltaXQgY29uZmlnLlxuICAgICAgbGFzdCA9IG1heExpbWl0O1xuICAgIH1cblxuICAgIGlmIChsaW1pdCB8fCBsaW1pdCA9PT0gMCkge1xuICAgICAgLy8gSWYgdGhlcmUgaXMgYSBwcmV2aW91cyBsaW1pdCBzZXQsIGl0IG1heSBiZSBhZGp1c3RlZFxuICAgICAgaWYgKGxhc3QgPCBsaW1pdCkge1xuICAgICAgICAvLyBpZiBsYXN0IGlzIGxlc3MgdGhhbiB0aGUgY3VycmVudCBsaW1pdFxuICAgICAgICBza2lwID0gKHNraXAgfHwgMCkgKyAobGltaXQgLSBsYXN0KTsgLy8gVGhlIHNraXAgaXMgYWRqdXN0ZWRcbiAgICAgICAgbGltaXQgPSBsYXN0OyAvLyB0aGUgbGltaXQgaXMgYWRqdXN0ZWRcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGxhc3QgPT09IDApIHtcbiAgICAgIC8vIE5vIG9iamVjdHMgd2lsbCBiZSByZXR1cm5lZFxuICAgICAgbGltaXQgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBObyBwcmV2aW91cyBsaW1pdCBzZXQsIHRoZSBsaW1pdCB3aWxsIGJlIGVxdWFsIHRvIGxhc3QgYW5kIHByZSBjb3VudCBpcyBuZWVkZWQuXG4gICAgICBsaW1pdCA9IGxhc3Q7XG4gICAgICBuZWVkVG9QcmVDb3VudCA9IHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiB7XG4gICAgc2tpcCxcbiAgICBsaW1pdCxcbiAgICBuZWVkVG9QcmVDb3VudCxcbiAgfTtcbn07XG5cbmV4cG9ydCB7IGdldE9iamVjdCwgZmluZE9iamVjdHMsIGNhbGN1bGF0ZVNraXBBbmRMaW1pdCwgbmVlZFRvR2V0QWxsS2V5cyB9O1xuIl19