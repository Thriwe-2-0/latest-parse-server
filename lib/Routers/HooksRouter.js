"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.HooksRouter = void 0;

var _node = require("parse/node");

var _PromiseRouter = _interopRequireDefault(require("../PromiseRouter"));

var middleware = _interopRequireWildcard(require("../middlewares"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class HooksRouter extends _PromiseRouter.default {
  createHook(aHook, config) {
    return config.hooksController.createHook(aHook).then(hook => ({
      response: hook
    }));
  }

  updateHook(aHook, config) {
    return config.hooksController.updateHook(aHook).then(hook => ({
      response: hook
    }));
  }

  handlePost(req) {
    return this.createHook(req.body, req.config);
  }

  handleGetFunctions(req) {
    var hooksController = req.config.hooksController;

    if (req.params.functionName) {
      return hooksController.getFunction(req.params.functionName).then(foundFunction => {
        if (!foundFunction) {
          throw new _node.Parse.Error(143, `no function named: ${req.params.functionName} is defined`);
        }

        return Promise.resolve({
          response: foundFunction
        });
      });
    }

    return hooksController.getFunctions().then(functions => {
      return {
        response: functions || []
      };
    }, err => {
      throw err;
    });
  }

  handleGetTriggers(req) {
    var hooksController = req.config.hooksController;

    if (req.params.className && req.params.triggerName) {
      return hooksController.getTrigger(req.params.className, req.params.triggerName).then(foundTrigger => {
        if (!foundTrigger) {
          throw new _node.Parse.Error(143, `class ${req.params.className} does not exist`);
        }

        return Promise.resolve({
          response: foundTrigger
        });
      });
    }

    return hooksController.getTriggers().then(triggers => ({
      response: triggers || []
    }));
  }

  handleDelete(req) {
    var hooksController = req.config.hooksController;

    if (req.params.functionName) {
      return hooksController.deleteFunction(req.params.functionName).then(() => ({
        response: {}
      }));
    } else if (req.params.className && req.params.triggerName) {
      return hooksController.deleteTrigger(req.params.className, req.params.triggerName).then(() => ({
        response: {}
      }));
    }

    return Promise.resolve({
      response: {}
    });
  }

  handleUpdate(req) {
    var hook;

    if (req.params.functionName && req.body.url) {
      hook = {};
      hook.functionName = req.params.functionName;
      hook.url = req.body.url;
    } else if (req.params.className && req.params.triggerName && req.body.url) {
      hook = {};
      hook.className = req.params.className;
      hook.triggerName = req.params.triggerName;
      hook.url = req.body.url;
    } else {
      throw new _node.Parse.Error(143, 'invalid hook declaration');
    }

    return this.updateHook(hook, req.config);
  }

  handlePut(req) {
    var body = req.body;

    if (body.__op == 'Delete') {
      return this.handleDelete(req);
    } else {
      return this.handleUpdate(req);
    }
  }

  mountRoutes() {
    this.route('GET', '/hooks/functions', middleware.promiseEnforceMasterKeyAccess, this.handleGetFunctions.bind(this));
    this.route('GET', '/hooks/triggers', middleware.promiseEnforceMasterKeyAccess, this.handleGetTriggers.bind(this));
    this.route('GET', '/hooks/functions/:functionName', middleware.promiseEnforceMasterKeyAccess, this.handleGetFunctions.bind(this));
    this.route('GET', '/hooks/triggers/:className/:triggerName', middleware.promiseEnforceMasterKeyAccess, this.handleGetTriggers.bind(this));
    this.route('POST', '/hooks/functions', middleware.promiseEnforceMasterKeyAccess, this.handlePost.bind(this));
    this.route('POST', '/hooks/triggers', middleware.promiseEnforceMasterKeyAccess, this.handlePost.bind(this));
    this.route('PUT', '/hooks/functions/:functionName', middleware.promiseEnforceMasterKeyAccess, this.handlePut.bind(this));
    this.route('PUT', '/hooks/triggers/:className/:triggerName', middleware.promiseEnforceMasterKeyAccess, this.handlePut.bind(this));
  }

}

exports.HooksRouter = HooksRouter;
var _default = HooksRouter;
exports.default = _default;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9Sb3V0ZXJzL0hvb2tzUm91dGVyLmpzIl0sIm5hbWVzIjpbIkhvb2tzUm91dGVyIiwiUHJvbWlzZVJvdXRlciIsImNyZWF0ZUhvb2siLCJhSG9vayIsImNvbmZpZyIsImhvb2tzQ29udHJvbGxlciIsInRoZW4iLCJob29rIiwicmVzcG9uc2UiLCJ1cGRhdGVIb29rIiwiaGFuZGxlUG9zdCIsInJlcSIsImJvZHkiLCJoYW5kbGVHZXRGdW5jdGlvbnMiLCJwYXJhbXMiLCJmdW5jdGlvbk5hbWUiLCJnZXRGdW5jdGlvbiIsImZvdW5kRnVuY3Rpb24iLCJQYXJzZSIsIkVycm9yIiwiUHJvbWlzZSIsInJlc29sdmUiLCJnZXRGdW5jdGlvbnMiLCJmdW5jdGlvbnMiLCJlcnIiLCJoYW5kbGVHZXRUcmlnZ2VycyIsImNsYXNzTmFtZSIsInRyaWdnZXJOYW1lIiwiZ2V0VHJpZ2dlciIsImZvdW5kVHJpZ2dlciIsImdldFRyaWdnZXJzIiwidHJpZ2dlcnMiLCJoYW5kbGVEZWxldGUiLCJkZWxldGVGdW5jdGlvbiIsImRlbGV0ZVRyaWdnZXIiLCJoYW5kbGVVcGRhdGUiLCJ1cmwiLCJoYW5kbGVQdXQiLCJfX29wIiwibW91bnRSb3V0ZXMiLCJyb3V0ZSIsIm1pZGRsZXdhcmUiLCJwcm9taXNlRW5mb3JjZU1hc3RlcktleUFjY2VzcyIsImJpbmQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7QUFBQTs7QUFDQTs7QUFDQTs7Ozs7Ozs7QUFFTyxNQUFNQSxXQUFOLFNBQTBCQyxzQkFBMUIsQ0FBd0M7QUFDN0NDLEVBQUFBLFVBQVUsQ0FBQ0MsS0FBRCxFQUFRQyxNQUFSLEVBQWdCO0FBQ3hCLFdBQU9BLE1BQU0sQ0FBQ0MsZUFBUCxDQUF1QkgsVUFBdkIsQ0FBa0NDLEtBQWxDLEVBQXlDRyxJQUF6QyxDQUE4Q0MsSUFBSSxLQUFLO0FBQUVDLE1BQUFBLFFBQVEsRUFBRUQ7QUFBWixLQUFMLENBQWxELENBQVA7QUFDRDs7QUFFREUsRUFBQUEsVUFBVSxDQUFDTixL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QixDQUpGO0FBTUEsU0FBS0gsS0FBTCxDQUNFLE1BREYsRUFFRSxrQkFGRixFQUdFQyxVQUFVLENBQUNDLDZCQUhiLEVBSUUsS0FBS2hDLFVBQUwsQ0FBZ0JpQyxJQUFoQixDQUFxQixJQUFyQixDQUpGO0FBTUEsU0FBS0gsS0FBTCxDQUNFLE1BREYsRUFFRSxpQkFGRixFQUdFQyxVQUFVLENBQUNDLDZCQUhiLEVBSUUsS0FBS2hDLFVBQUwsQ0FBZ0JpQyxJQUFoQixDQUFxQixJQUFyQixDQUpGO0FBTUEsU0FBS0gsS0FBTCxDQUNFLEtBREYsRUFFRSxnQ0FGRixFQUdFQyxVQUFVLENBQUNDLDZCQUhiLEVBSUUsS0FBS0wsU0FBTCxDQUFlTSxJQUFmLENBQW9CLElBQXBCLENBSkY7QUFNQSxTQUFLSCxLQUFMLENBQ0UsS0FERixFQUVFLHlDQUZGLEVBR0VDLFVBQVUsQ0FBQ0MsNkJBSGIsRUFJRSxLQUFLTCxTQUFMLENBQWVNLElBQWYsQ0FBb0IsSUFBcEIsQ0FKRjtBQU1EOztBQXpJNEM7OztlQTRJaEMzQyxXIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUGFyc2UgfSBmcm9tICdwYXJzZS9ub2RlJztcbmltcG9ydCBQcm9taXNlUm91dGVyIGZyb20gJy4uL1Byb21pc2VSb3V0ZXInO1xuaW1wb3J0ICogYXMgbWlkZGxld2FyZSBmcm9tICcuLi9taWRkbGV3YXJlcyc7XG5cbmV4cG9ydCBjbGFzcyBIb29rc1JvdXRlciBleHRlbmRzIFByb21pc2VSb3V0ZXIge1xuICBjcmVhdGVIb29rKGFIb29rLCBjb25maWcpIHtcbiAgICByZXR1cm4gY29uZmlnLmhvb2tzQ29udHJvbGxlci5jcmVhdGVIb29rKGFIb29rKS50aGVuKGhvb2sgPT4gKHsgcmVzcG9uc2U6IGhvb2sgfSkpO1xuICB9XG5cbiAgdXBkYXRlSG9vayhhSG9vaywgY29uZmlnKSB7XG4gICAgcmV0dXJuIGNvbmZpZy5ob29rc0NvbnRyb2xsZXIudXBkYXRlSG9vayhhSG9vaykudGhlbihob29rID0+ICh7IHJlc3BvbnNlOiBob29rIH0pKTtcbiAgfVxuXG4gIGhhbmRsZVBvc3QocmVxKSB7XG4gICAgcmV0dXJuIHRoaXMuY3JlYXRlSG9vayhyZXEuYm9keSwgcmVxLmNvbmZpZyk7XG4gIH1cblxuICBoYW5kbGVHZXRGdW5jdGlvbnMocmVxKSB7XG4gICAgdmFyIGhvb2tzQ29udHJvbGxlciA9IHJlcS5jb25maWcuaG9va3NDb250cm9sbGVyO1xuICAgIGlmIChyZXEucGFyYW1zLmZ1bmN0aW9uTmFtZSkge1xuICAgICAgcmV0dXJuIGhvb2tzQ29udHJvbGxlci5nZXRGdW5jdGlvbihyZXEucGFyYW1zLmZ1bmN0aW9uTmFtZSkudGhlbihmb3VuZEZ1bmN0aW9uID0+IHtcbiAgICAgICAgaWYgKCFmb3VuZEZ1bmN0aW9uKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKDE0MywgYG5vIGZ1bmN0aW9uIG5hbWVkOiAke3JlcS5wYXJhbXMuZnVuY3Rpb25OYW1lfSBpcyBkZWZpbmVkYCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHJlc3BvbnNlOiBmb3VuZEZ1bmN0aW9uIH0pO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGhvb2tzQ29udHJvbGxlci5nZXRGdW5jdGlvbnMoKS50aGVuKFxuICAgICAgZnVuY3Rpb25zID0+IHtcbiAgICAgICAgcmV0dXJuIHsgcmVzcG9uc2U6IGZ1bmN0aW9ucyB8fCBbXSB9O1xuICAgICAgfSxcbiAgICAgIGVyciA9PiB7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaGFuZGxlR2V0VHJpZ2dlcnMocmVxKSB7XG4gICAgdmFyIGhvb2tzQ29udHJvbGxlciA9IHJlcS5jb25maWcuaG9va3NDb250cm9sbGVyO1xuICAgIGlmIChyZXEucGFyYW1zLmNsYXNzTmFtZSAmJiByZXEucGFyYW1zLnRyaWdnZXJOYW1lKSB7XG4gICAgICByZXR1cm4gaG9va3NDb250cm9sbGVyXG4gICAgICAgIC5nZXRUcmlnZ2VyKHJlcS5wYXJhbXMuY2xhc3NOYW1lLCByZXEucGFyYW1zLnRyaWdnZXJOYW1lKVxuICAgICAgICAudGhlbihmb3VuZFRyaWdnZXIgPT4ge1xuICAgICAgICAgIGlmICghZm91bmRUcmlnZ2VyKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgUGFyc2UuRXJyb3IoMTQzLCBgY2xhc3MgJHtyZXEucGFyYW1zLmNsYXNzTmFtZX0gZG9lcyBub3QgZXhpc3RgKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHJlc3BvbnNlOiBmb3VuZFRyaWdnZXIgfSk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJldHVybiBob29rc0NvbnRyb2xsZXIuZ2V0VHJpZ2dlcnMoKS50aGVuKHRyaWdnZXJzID0+ICh7IHJlc3BvbnNlOiB0cmlnZ2VycyB8fCBbXSB9KSk7XG4gIH1cblxuICBoYW5kbGVEZWxldGUocmVxKSB7XG4gICAgdmFyIGhvb2tzQ29udHJvbGxlciA9IHJlcS5jb25maWcuaG9va3NDb250cm9sbGVyO1xuICAgIGlmIChyZXEucGFyYW1zLmZ1bmN0aW9uTmFtZSkge1xuICAgICAgcmV0dXJuIGhvb2tzQ29udHJvbGxlci5kZWxldGVGdW5jdGlvbihyZXEucGFyYW1zLmZ1bmN0aW9uTmFtZSkudGhlbigoKSA9PiAoeyByZXNwb25zZToge30gfSkpO1xuICAgIH0gZWxzZSBpZiAocmVxLnBhcmFtcy5jbGFzc05hbWUgJiYgcmVxLnBhcmFtcy50cmlnZ2VyTmFtZSkge1xuICAgICAgcmV0dXJuIGhvb2tzQ29udHJvbGxlclxuICAgICAgICAuZGVsZXRlVHJpZ2dlcihyZXEucGFyYW1zLmNsYXNzTmFtZSwgcmVxLnBhcmFtcy50cmlnZ2VyTmFtZSlcbiAgICAgICAgLnRoZW4oKCkgPT4gKHsgcmVzcG9uc2U6IHt9IH0pKTtcbiAgICB9XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh7IHJlc3BvbnNlOiB7fSB9KTtcbiAgfVxuXG4gIGhhbmRsZVVwZGF0ZShyZXEpIHtcbiAgICB2YXIgaG9vaztcbiAgICBpZiAocmVxLnBhcmFtcy5mdW5jdGlvbk5hbWUgJiYgcmVxLmJvZHkudXJsKSB7XG4gICAgICBob29rID0ge307XG4gICAgICBob29rLmZ1bmN0aW9uTmFtZSA9IHJlcS5wYXJhbXMuZnVuY3Rpb25OYW1lO1xuICAgICAgaG9vay51cmwgPSByZXEuYm9keS51cmw7XG4gICAgfSBlbHNlIGlmIChyZXEucGFyYW1zLmNsYXNzTmFtZSAmJiByZXEucGFyYW1zLnRyaWdnZXJOYW1lICYmIHJlcS5ib2R5LnVybCkge1xuICAgICAgaG9vayA9IHt9O1xuICAgICAgaG9vay5jbGFzc05hbWUgPSByZXEucGFyYW1zLmNsYXNzTmFtZTtcbiAgICAgIGhvb2sudHJpZ2dlck5hbWUgPSByZXEucGFyYW1zLnRyaWdnZXJOYW1lO1xuICAgICAgaG9vay51cmwgPSByZXEuYm9keS51cmw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcigxNDMsICdpbnZhbGlkIGhvb2sgZGVjbGFyYXRpb24nKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMudXBkYXRlSG9vayhob29rLCByZXEuY29uZmlnKTtcbiAgfVxuXG4gIGhhbmRsZVB1dChyZXEpIHtcbiAgICB2YXIgYm9keSA9IHJlcS5ib2R5O1xuICAgIGlmIChib2R5Ll9fb3AgPT0gJ0RlbGV0ZScpIHtcbiAgICAgIHJldHVybiB0aGlzLmhhbmRsZURlbGV0ZShyZXEpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhpcy5oYW5kbGVVcGRhdGUocmVxKTtcbiAgICB9XG4gIH1cblxuICBtb3VudFJvdXRlcygpIHtcbiAgICB0aGlzLnJvdXRlKFxuICAgICAgJ0dFVCcsXG4gICAgICAnL2hvb2tzL2Z1bmN0aW9ucycsXG4gICAgICBtaWRkbGV3YXJlLnByb21pc2VFbmZvcmNlTWFzdGVyS2V5QWNjZXNzLFxuICAgICAgdGhpcy5oYW5kbGVHZXRGdW5jdGlvbnMuYmluZCh0aGlzKVxuICAgICk7XG4gICAgdGhpcy5yb3V0ZShcbiAgICAgICdHRVQnLFxuICAgICAgJy9ob29rcy90cmlnZ2VycycsXG4gICAgICBtaWRkbGV3YXJlLnByb21pc2VFbmZvcmNlTWFzdGVyS2V5QWNjZXNzLFxuICAgICAgdGhpcy5oYW5kbGVHZXRUcmlnZ2Vycy5iaW5kKHRoaXMpXG4gICAgKTtcbiAgICB0aGlzLnJvdXRlKFxuICAgICAgJ0dFVCcsXG4gICAgICAnL2hvb2tzL2Z1bmN0aW9ucy86ZnVuY3Rpb25OYW1lJyxcbiAgICAgIG1pZGRsZXdhcmUucHJvbWlzZUVuZm9yY2VNYXN0ZXJLZXlBY2Nlc3MsXG4gICAgICB0aGlzLmhhbmRsZUdldEZ1bmN0aW9ucy5iaW5kKHRoaXMpXG4gICAgKTtcbiAgICB0aGlzLnJvdXRlKFxuICAgICAgJ0dFVCcsXG4gICAgICAnL2hvb2tzL3RyaWdnZXJzLzpjbGFzc05hbWUvOnRyaWdnZXJOYW1lJyxcbiAgICAgIG1pZGRsZXdhcmUucHJvbWlzZUVuZm9yY2VNYXN0ZXJLZXlBY2Nlc3MsXG4gICAgICB0aGlzLmhhbmRsZUdldFRyaWdnZXJzLmJpbmQodGhpcylcbiAgICApO1xuICAgIHRoaXMucm91dGUoXG4gICAgICAnUE9TVCcsXG4gICAgICAnL2hvb2tzL2Z1bmN0aW9ucycsXG4gICAgICBtaWRkbGV3YXJlLnByb21pc2VFbmZvcmNlTWFzdGVyS2V5QWNjZXNzLFxuICAgICAgdGhpcy5oYW5kbGVQb3N0LmJpbmQodGhpcylcbiAgICApO1xuICAgIHRoaXMucm91dGUoXG4gICAgICAnUE9TVCcsXG4gICAgICAnL2hvb2tzL3RyaWdnZXJzJyxcbiAgICAgIG1pZGRsZXdhcmUucHJvbWlzZUVuZm9yY2VNYXN0ZXJLZXlBY2Nlc3MsXG4gICAgICB0aGlzLmhhbmRsZVBvc3QuYmluZCh0aGlzKVxuICAgICk7XG4gICAgdGhpcy5yb3V0ZShcbiAgICAgICdQVVQnLFxuICAgICAgJy9ob29rcy9mdW5jdGlvbnMvOmZ1bmN0aW9uTmFtZScsXG4gICAgICBtaWRkbGV3YXJlLnByb21pc2VFbmZvcmNlTWFzdGVyS2V5QWNjZXNzLFxuICAgICAgdGhpcy5oYW5kbGVQdXQuYmluZCh0aGlzKVxuICAgICk7XG4gICAgdGhpcy5yb3V0ZShcbiAgICAgICdQVVQnLFxuICAgICAgJy9ob29rcy90cmlnZ2Vycy86Y2xhc3NOYW1lLzp0cmlnZ2VyTmFtZScsXG4gICAgICBtaWRkbGV3YXJlLnByb21pc2VFbmZvcmNlTWFzdGVyS2V5QWNjZXNzLFxuICAgICAgdGhpcy5oYW5kbGVQdXQuYmluZCh0aGlzKVxuICAgICk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgSG9va3NSb3V0ZXI7XG4iXX0=