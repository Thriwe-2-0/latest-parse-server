"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _cryptoUtils = require("../cryptoUtils");
var _defaults = _interopRequireDefault(require("../defaults"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const MAIN_SCHEMA = '__MAIN_SCHEMA';
const SCHEMA_CACHE_PREFIX = '__SCHEMA';
class SchemaCache {
  constructor(cacheController, ttl = _defaults.default.schemaCacheTTL, singleCache = false) {
    this.ttl = ttl;
    if (typeof ttl == 'string') {
      this.ttl = parseInt(ttl);
    }
    this.cache = cacheController;
    this.prefix = SCHEMA_CACHE_PREFIX;
    if (!singleCache) {
      this.prefix += (0, _cryptoUtils.randomString)(20);
    }
  }
  getAllClasses() {
    if (!this.ttl) {
      return Promise.resolve(null);
    }
    return this.cache.get(this.prefix + MAIN_SCHEMA);
  }
  setAllClasses(schema) {
    if (!this.ttl) {
      return Promise.resolve(null);
    }
    return this.cache.put(this.prefix + MAIN_SCHEMA, schema);
  }
  getOneSchema(className) {
    if (!this.ttl) {
      return Promise.resolve(null);
    }
    return this.cache.get(this.prefix + MAIN_SCHEMA).then(cachedSchemas => {
      cachedSchemas = cachedSchemas || [];
      const schema = cachedSchemas.find(cachedSchema => {
        return cachedSchema.className === className;
      });
      if (schema) {
        return Promise.resolve(schema);
      }
      return Promise.resolve(null);
    });
  }
  clear() {
    return this.cache.del(this.prefix + MAIN_SCHEMA);
  }
}
exports.default = SchemaCache;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNQUlOX1NDSEVNQSIsIlNDSEVNQV9DQUNIRV9QUkVGSVgiLCJTY2hlbWFDYWNoZSIsImNvbnN0cnVjdG9yIiwiY2FjaGVDb250cm9sbGVyIiwidHRsIiwiZGVmYXVsdHMiLCJzY2hlbWFDYWNoZVRUTCIsInNpbmdsZUNhY2hlIiwicGFyc2VJbnQiLCJjYWNoZSIsInByZWZpeCIsInJhbmRvbVN0cmluZyIsImdldEFsbENsYXNzZXMiLCJQcm9taXNlIiwicmVzb2x2ZSIsImdldCIsInNldEFsbENsYXNzZXMiLCJzY2hlbWEiLCJwdXQiLCJnZXRPbmVTY2hlbWEiLCJjbGFzc05hbWUiLCJ0aGVuIiwiY2FjaGVkU2NoZW1hcyIsImZpbmQiLCJjYWNoZWRTY2hlbWEiLCJjbGVhciIsImRlbCJdLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Db250cm9sbGVycy9TY2hlbWFDYWNoZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBNQUlOX1NDSEVNQSA9ICdfX01BSU5fU0NIRU1BJztcbmNvbnN0IFNDSEVNQV9DQUNIRV9QUkVGSVggPSAnX19TQ0hFTUEnO1xuXG5pbXBvcnQgeyByYW5kb21TdHJpbmcgfSBmcm9tICcuLi9jcnlwdG9VdGlscyc7XG5pbXBvcnQgZGVmYXVsdHMgZnJvbSAnLi4vZGVmYXVsdHMnO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBTY2hlbWFDYWNoZSB7XG4gIGNhY2hlOiBPYmplY3Q7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgY2FjaGVDb250cm9sbGVyLFxuICAgIHR0bCA9IGRlZmF1bHRzLnNjaGVtYUNhY2hlVFRMLFxuICAgIHNpbmdsZUNhY2hlID0gZmFsc2VcbiAgKSB7XG4gICAgdGhpcy50dGwgPSB0dGw7XG4gICAgaWYgKHR5cGVvZiB0dGwgPT0gJ3N0cmluZycpIHtcbiAgICAgIHRoaXMudHRsID0gcGFyc2VJbnQodHRsKTtcbiAgICB9XG4gICAgdGhpcy5jYWNoZSA9IGNhY2hlQ29udHJvbGxlcjtcbiAgICB0aGlzLnByZWZpeCA9IFNDSEVNQV9DQUNIRV9QUkVGSVg7XG4gICAgaWYgKCFzaW5nbGVDYWNoZSkge1xuICAgICAgdGhpcy5wcmVmaXggKz0gcmFuZG9tU3RyaW5nKDIwKTtcbiAgICB9XG4gIH1cblxuICBnZXRBbGxDbGFzc2VzKCkge1xuICAgIGlmICghdGhpcy50dGwpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmNhY2hlLmdldCh0aGlzLnByZWZpeCArIE1BSU5fU0NIRU1BKTtcbiAgfVxuXG4gIHNldEFsbENsYXNzZXMoc2NoZW1hKSB7XG4gICAgaWYgKCF0aGlzLnR0bCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY2FjaGUucHV0KHRoaXMucHJlZml4ICsgTUFJTl9TQ0hFTUEsIHNjaGVtYSk7XG4gIH1cblxuICBnZXRPbmVTY2hlbWEoY2xhc3NOYW1lKSB7XG4gICAgaWYgKCF0aGlzLnR0bCkge1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShudWxsKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuY2FjaGUuZ2V0KHRoaXMucHJlZml4ICsgTUFJTl9TQ0hFTUEpLnRoZW4oY2FjaGVkU2NoZW1hcyA9PiB7XG4gICAgICBjYWNoZWRTY2hlbWFzID0gY2FjaGVkU2NoZW1hcyB8fCBbXTtcbiAgICAgIGNvbnN0IHNjaGVtYSA9IGNhY2hlZFNjaGVtYXMuZmluZChjYWNoZWRTY2hlbWEgPT4ge1xuICAgICAgICByZXR1cm4gY2FjaGVkU2NoZW1hLmNsYXNzTmFtZSA9PT0gY2xhc3NOYW1lO1xuICAgICAgfSk7XG4gICAgICBpZiAoc2NoZW1hKSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoc2NoZW1hKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobnVsbCk7XG4gICAgfSk7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICBy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