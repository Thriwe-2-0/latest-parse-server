"use strict";

var https = require('https'),
    crypto = require('crypto');

var Parse = require('parse/node').Parse;

var OAuth = function (options) {
  if (!options) {
    throw new Parse.Error(Parse.Error.INTERNAL_SERVER_ERROR, 'No options passed to OAuth');
  }

  this.consumer_key = options.consumer_key;
  this.consumer_secret = options.consumer_secret;
  this.auth_token = options.auth_token;
  this.auth_token_secret = options.auth_token_secret;
  this.host = options.host;
  this.oauth_params = options.oauth_params || {};
};

OAuth.prototype.send = function (method, path, params, body) {
  var request = this.buildRequest(method, path, params, body); // Encode the body properly, the current Parse Implementation don't do it properly

  return new Promise(function (resolve, reject) {
    var httpRequest = https.request(request, function (res) {
      var data = '';
      res.on('data', function (chunk) {
        data += chunk;
      });
      res.on('end', function () {
        data = JSON.parse(data);
        resolve(data);
      });
    }).on('error', function () {
      reject('Failed to make an OAuth request');
    });

    if (request.body) {
      httpRequest.write(request.body);
    }

    httpRequest.end();
  });
};

OAuth.prototype.buildRequest = function (method, path, params, body) {
  if (path.indexOf('/') != 0) {
    path = '/' + path;
  }

  if (params && Object.keys(params).length > 0) {
    path += '?' + OAuth.buildParameterString(params);
  }

  var request = {
    host: this.host,
    path: path,
    method: method.toUpperCase()
  };
  var oauth_params = this.oauth_params || {};
  oauth_params.oauth_consumer_key = this.consumer_key;

  if (this.auth_token) {
    oauth_params['oauth_token'] = this.auth_token;
  }

  request = OAuth.signRequest(request, oauth_params, this.consumer_secret, this.auth_token_secret);

  if (body && Object.keys(body).length > 0) {
    request.body = OAuth.buildParameterString(body);
  }

  return request;
};

OAuth.prototype.get = function (path, params) {
  return this.send('GET', path, params);
};

OAuth.prototype.post = function (path, params, body) {
  return this.send('POST', path, params, body);
};
/*
	Proper string %escape encoding
*/


OAuth.encode = function (str) {
  //       discuss at: http://phpjs.org/functions/rawurlencode/
  //      original by: Brett Zamir (http://brett-zamir.me)
  //         input by: travc
  //         input by: Brett Zamir (http://brett-zamir.me)
  //         input by: Michael Grier
  //         input by: Ratheous
  //      bugfixed by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
  //      bugfixed by: Brett Zamir (http://brett-zamir.me)
  //      bugfixed by: Joris
  // reimplemented by: Brett Zamir (http://brett-zamir.me)
  // reimplemented by: Brett Zamir (http://brett-zamir.me)
  //             note: This reflects PHP 5.3/6.0+ behavior
  //             note: Please be aware that this function expects to encode into UTF-8 encoded strings, as found on
  //             note: pages served as UTF-8
  //        example 1: rawurlencode('Kevin van Zonneveld!');
  //        returns 1: 'Kevin%20van%20Zonneveld%21'
  //        example 2: rawurlencode('http://kevin.vanzonneveld.net/');
  //        returns 2: 'http%3A%2F%2Fkevin.vanzonneveld.net%2F'
  //        example 3: rawurlencode('http://www.google.nl/search?q=php.js&ie=utf-8&oe=utf-8&aq=t&rls=com.ubuntu:en-US:unofficial&client=firefox-a');
  //        returns 3: 'http%3A%2F%2Fwww.google.nl%2Fsearch%3Fq%3Dphp.js%26ie%3Dutf-8%26oe%3Dutf-8%26aq%3Dt%26rls%3Dcom.ubuntu%3Aen-US%3Aunofficial%26client%3Dfirefox-a'
  str = (str + '').toString(); // Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
  // PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.

  return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
};

OAuth.signatureMethod = 'HMAC-SHA1';
OAuth.version = '1.0';
/*
	Generate a nonce
*/

OAuth.nonce = function () {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < 30; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
};

OAuth.buildParameterString = function (obj) {
  // Sort keys and encode values
  if (obj) {
    var keys = Object.keys(obj).sort(); // Map key=value, join them by &

    return keys.map(function (key) {
      return key + '=' + OAuth.encode(obj[key]);
    }).join('&');
  }

  return '';
};
/*
	Build the signature string from the object
*/


OAuth.buildSignatureString = function (method, url, parameters) {
  return [method.toUpperCase(), OAuth.encode(url), OAuth.encode(parameters)].join('&');
};
/*
	Retuns encoded HMAC-SHA1 from key and text
*/


OAuth.signature = function (text, key) {
  crypto = require('crypto');
  return OAuth.encode(crypto.createHmac('sha1', key).update(text).digest('base64'));
};

OAuth.signRequest = function (request, oauth_parameters, consumer_secret, auth_token_secret) {
  oauth_parameters = oauth_parameters || {}; // Set default values

  if (!oauth_parameters.oauth_nonce) {
    oauth_parameters.oauth_nonce = OAuth.nonce();
  }

  if (!oauth_parameters.oauth_timestamp) {
    oauth_parameters.oauth_timestamp = Math.floor(new Date().getTime() / 1000);
  }

  if (!oauth_parameters.oauth_signature_method) {
    oauth_parameters.oauth_signature_method = OAuth.signatureMethod;
  }

  if (!oauth_parameters.oauth_version) {
    oauth_parameters.oauth_version = OAuth.version;
  }

  if (!auth_token_secret) {
    auth_token_secret = '';
  } // Force GET method if unset


  if (!request.method) {
    request.method = 'GET';
  } // Collect  all the parameters in one signatureParameters object


  var signatureParams = {};
  var parametersToMerge = [request.params, request.body, oauth_parameters];

  for (var i in parametersToMerge) {
    var parameters = parametersToMerge[i];

    for (var k in parameters) {
      signatureParams[k] = parameters[k];
    }
  } // Create a string based on the parameters


  var parameterString = OAuth.buildParameterString(signatureParams); // Build the signature string

  var url = 'https://' + request.host + '' + request.path;
  var signatureString = OAuth.buildSignatureString(request.method, url, parameterString); // Hash the signature string

  var signatureKey = [OAuth.encode(consumer_secret), OAuth.encode(auth_token_secret)].join('&');
  var signature = OAuth.signature(signatureString, signatureKey); // Set the signature in the params

  oauth_parameters.oauth_signature = signature;

  if (!request.headers) {
    request.headers = {};
  } // Set the authorization header


  var authHeader = Object.keys(oauth_parameters).sort().map(function (key) {
    var value = oauth_parameters[key];
    return key + '="' + value + '"';
  }).join(', ');
  request.headers.Authorization = 'OAuth ' + authHeader; // Set the content type header

  request.headers['Content-Type'] = 'application/x-www-form-urlencoded';
  return request;
};

module.exports = OAuth;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BZGFwdGVycy9BdXRoL09BdXRoMUNsaWVudC5qcyJdLCJuYW1lcyI6WyJodHRwcyIsInJlcXVpcmUiLCJjcnlwdG8iLCJQYXJzZSIsIk9BdXRoIiwib3B0aW9ucyIsIkVycm9yIiwiSU5URVJOQUxfU0VSVkVSX0VSUk9SIiwiY29uc3VtZXJfa2V5IiwiY29uc3VtZXJfc2VjcmV0IiwiYXV0aF90b2tlbiIsImF1dGhfdG9rZW5fc2VjcmV0IiwiaG9zdCIsIm9hdXRoX3BhcmFtcyIsInByb3RvdHlwZSIsInNlbmQiLCJtZXRob2QiLCJwYXRoIiwicGFyYW1zIiwiYm9keSIsInJlcXVlc3QiLCJidWlsZFJlcXVlc3QiLCJQcm9taXNlIiwicmVzb2x2ZSIsInJlamVjdCIsImh0dHBSZXF1ZXN0IiwicmVzIiwiZGF0YSIsIm9uIiwiY2h1bmsiLCJKU09OIiwicGFyc2UiLCJ3cml0ZSIsImVuZCIsImluZGV4T2YiLCJPYmplY3QiLCJrZXlzIiwibGVuZ3RoIiwiYnVpbGRQYXJhbWV0ZXJTdHJpbmciLCJ0b1VwcGVyQ2FzZSIsIm9hdXRoX2NvbnN1bWVyX2tleSIsInNpZ25SZXF1ZXN0IiwiZ2V0IiwicG9zdCIsImVuY29kZSIsInN0ciIsInRvU3RyaW5nIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwicmVwbGFjZSIsInNpZ25hdHVyZU1ldGhvZCIsInZlcnNpb24iLCJub25jZSIsInRleHQiLCJwb3NzaWJsZSIsImkiLCJjaGFyQXQiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJvYmoiLCJzb3J0IiwibWFwIiwia2V5Iiwiam9pbiIsImJ1aWxkU2lnbmF0dXJlU3RyaW5nIiwidXJsIiwicGFyYW1ldGVycyIsInNpZ25hdHVyZSIsImNyZWF0ZUhtYWMiLCJ1cGRhdGUiLCJkaWdlc3QiLCJvYXV0aF9wYXJhbWV0ZXJzIiwib2F1dGhfbm9uY2UiLCJvYXV0aF90aW1lc3RhbXAiLCJEYXRlIiwiZ2V0VGltZSIsIm9hdXRoX3NpZ25hdHVyZV9tZXRob2QiLCJvYXV0aF92ZXJzaW9uIiwic2lnbmF0dXJlUGFyYW1zIiwicGFyYW1ldGVyc1RvTWVyZ2UiLCJrIiwicGFyYW1ldGVyU3RyaW5nIiwic2lnbmF0dXJlU3RyaW5nIiwic2lnbmF0dXJlS2V5Iiwib2F1dGhfc2lnbmF0dXJlIiwiaGVhZGVycyIsImF1dGhIZWFkZXIiLCJ2YWx1ZSIsIkF1dGhvcml6YXRpb24iLCJtb2R1bGUiLCJleHBvcnRzIl0sIm1hcHBpbmdzIjoiOztBQUFBLElBQUlBLEtBQUssR0FBR0MsT0FBTyxDQUFDLE9BQUQsQ0FBbkI7QUFBQSxJQUNFQyxNQUFNLEdBQUdELE9BQU8sQ0FBQyxRQUFELENBRGxCOztBQUVBLElBQUlFLEtBQUssR0FBR0YsT0FBTyxDQUFDLFlBQUQsQ0FBUCxDQUFzQkUsS0FBbEM7O0FBRUEsSUFBSUMsS0FBSyxHQUFHLFVBQVVDLE9BQVYsRUFBbUI7QUFDN0IsTUFBSSxDQUFDQSxPQUFMLEVBQWM7QUFDWixVQUFNLElBQUlGLEtBQUssQ0FBQ0csS0FBVixDQUFnQkgsS0FBSyxDQUFDRyxLQUFOLENBQVlDLHFCQUE1QixFQUFtRCw0QkFBbkQsQ0FBTjtBQUNEOztBQUNELE9BQUtDLFlBQUwsR0FBb0JILE9BQU8sQ0FBQ0csWUFBNUI7QUFDQSxPQUFLQyxlQUFMLEdBQXVCSixPQUFPLENBQUNJLGVBQS9CO0FBQ0EsT0FBS0MsVUFBTCxHQUFrQkwsT0FBTyxDQUFDSyxVQUExQjtBQUNBLE9BQUtDLGlCQUFMLEdBQXlCTixPQUFPLENBQUNNLGlCQUFqQztBQUNBLE9BQUtDLElBQUwsR0FBWVAsT0FBTyxDQUFDTyxJQUFwQjtBQUNBLE9BQUtDLFlBQUwsR0FBb0JSLE9BQU8sQ0FBQ1EsWUFBUixJQUF3QixFQUE1QztBQUNELENBVkQ7O0FBWUFULEtBQUssQ0FBQ1UsU0FBTixDQUFnQkMsSUFBaEIsR0FBdUIsVUFBVUMsTUFBVixFQUFrQkMsSUFBbEIsRUFBd0JDLE1BQXhCLEVBQWdDQyxJQUFoQyxFQUFzQztBQUMzRCxNQUFJQyxPQUFPLEdBQUcsS0FBS0Ms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LGVBQWpCLEdBQW1DakIsU0FBbkM7O0FBQ0EsTUFBSSxDQUFDL0MsT0FBTyxDQUFDaUUsT0FBYixFQUFzQjtBQUNwQmpFLElBQUFBLE9BQU8sQ0FBQ2lFLE9BQVIsR0FBa0IsRUFBbEI7QUFDRCxHQW5EMEYsQ0FxRDNGOzs7QUFDQSxNQUFJQyxVQUFVLEdBQUduRCxNQUFNLENBQUNDLElBQVAsQ0FBWW1DLGdCQUFaLEVBQ2RYLElBRGMsR0FFZEMsR0FGYyxDQUVWLFVBQVVDLEdBQVYsRUFBZTtBQUNsQixRQUFJeUIsS0FBSyxHQUFHaEIsZ0JBQWdCLENBQUNULEdBQUQsQ0FBNUI7QUFDQSxXQUFPQSxHQUFHLEdBQUcsSUFBTixHQUFheUIsS0FBYixHQUFxQixHQUE1QjtBQUNELEdBTGMsRUFNZHhCLElBTmMsQ0FNVCxJQU5TLENBQWpCO0FBUUEzQyxFQUFBQSxPQUFPLENBQUNpRSxPQUFSLENBQWdCRyxhQUFoQixHQUFnQyxXQUFXRixVQUEzQyxDQTlEMkYsQ0FnRTNGOztBQUNBbEUsRUFBQUEsT0FBTyxDQUFDaUUsT0FBUixDQUFnQixjQUFoQixJQUFrQyxtQ0FBbEM7QUFDQSxTQUFPakUsT0FBUDtBQUNELENBbkVEOztBQXFFQXFFLE1BQU0sQ0FBQ0MsT0FBUCxHQUFpQnRGLEtBQWpCIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGh0dHBzID0gcmVxdWlyZSgnaHR0cHMnKSxcbiAgY3J5cHRvID0gcmVxdWlyZSgnY3J5cHRvJyk7XG52YXIgUGFyc2UgPSByZXF1aXJlKCdwYXJzZS9ub2RlJykuUGFyc2U7XG5cbnZhciBPQXV0aCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gIGlmICghb3B0aW9ucykge1xuICAgIHRocm93IG5ldyBQYXJzZS5FcnJvcihQYXJzZS5FcnJvci5JTlRFUk5BTF9TRVJWRVJfRVJST1IsICdObyBvcHRpb25zIHBhc3NlZCB0byBPQXV0aCcpO1xuICB9XG4gIHRoaXMuY29uc3VtZXJfa2V5ID0gb3B0aW9ucy5jb25zdW1lcl9rZXk7XG4gIHRoaXMuY29uc3VtZXJfc2VjcmV0ID0gb3B0aW9ucy5jb25zdW1lcl9zZWNyZXQ7XG4gIHRoaXMuYXV0aF90b2tlbiA9IG9wdGlvbnMuYXV0aF90b2tlbjtcbiAgdGhpcy5hdXRoX3Rva2VuX3NlY3JldCA9IG9wdGlvbnMuYXV0aF90b2tlbl9zZWNyZXQ7XG4gIHRoaXMuaG9zdCA9IG9wdGlvbnMuaG9zdDtcbiAgdGhpcy5vYXV0aF9wYXJhbXMgPSBvcHRpb25zLm9hdXRoX3BhcmFtcyB8fCB7fTtcbn07XG5cbk9BdXRoLnByb3RvdHlwZS5zZW5kID0gZnVuY3Rpb24gKG1ldGhvZCwgcGF0aCwgcGFyYW1zLCBib2R5KSB7XG4gIHZhciByZXF1ZXN0ID0gdGhpcy5idWlsZFJlcXVlc3QobWV0aG9kLCBwYXRoLCBwYXJhbXMsIGJvZHkpO1xuICAvLyBFbmNvZGUgdGhlIGJvZHkgcHJvcGVybHksIHRoZSBjdXJyZW50IFBhcnNlIEltcGxlbWVudGF0aW9uIGRvbid0IGRvIGl0IHByb3Blcmx5XG4gIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgdmFyIGh0dHBSZXF1ZXN0ID0gaHR0cHNcbiAgICAgIC5yZXF1ZXN0KHJlcXVlc3QsIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSAnJztcbiAgICAgICAgcmVzLm9uKCdkYXRhJywgZnVuY3Rpb24gKGNodW5rKSB7XG4gICAgICAgICAgZGF0YSArPSBjaHVuaztcbiAgICAgICAgfSk7XG4gICAgICAgIHJlcy5vbignZW5kJywgZnVuY3Rpb24gKCkge1xuICAgICAgICAgIGRhdGEgPSBKU09OLnBhcnNlKGRhdGEpO1xuICAgICAgICAgIHJlc29sdmUoZGF0YSk7XG4gICAgICAgIH0pO1xuICAgICAgfSlcbiAgICAgIC5vbignZXJyb3InLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHJlamVjdCgnRmFpbGVkIHRvIG1ha2UgYW4gT0F1dGggcmVxdWVzdCcpO1xuICAgICAgfSk7XG4gICAgaWYgKHJlcXVlc3QuYm9keSkge1xuICAgICAgaHR0cFJlcXVlc3Qud3JpdGUocmVxdWVzdC5ib2R5KTtcbiAgICB9XG4gICAgaHR0cFJlcXVlc3QuZW5kKCk7XG4gIH0pO1xufTtcblxuT0F1dGgucHJvdG90eXBlLmJ1aWxkUmVxdWVzdCA9IGZ1bmN0aW9uIChtZXRob2QsIHBhdGgsIHBhcmFtcywgYm9keSkge1xuICBpZiAocGF0aC5pbmRleE9mKCcvJykgIT0gMCkge1xuICAgIHBhdGggPSAnLycgKyBwYXRoO1xuICB9XG4gIGlmIChwYXJhbXMgJiYgT2JqZWN0LmtleXMocGFyYW1zKS5sZW5ndGggPiAwKSB7XG4gICAgcGF0aCArPSAnPycgKyBPQXV0aC5idWlsZFBhcmFtZXRlclN0cmluZyhwYXJhbXMpO1xuICB9XG5cbiAgdmFyIHJlcXVlc3QgPSB7XG4gICAgaG9zdDogdGhpcy5ob3N0LFxuICAgIHBhdGg6IHBhdGgsXG4gICAgbWV0aG9kOiBtZXRob2QudG9VcHBlckNhc2UoKSxcbiAgfTtcblxuICB2YXIgb2F1dGhfcGFyYW1zID0gdGhpcy5vYXV0aF9wYXJhbXMgfHwge307XG4gIG9hdXRoX3BhcmFtcy5vYXV0aF9jb25zdW1lcl9rZXkgPSB0aGlzLmNvbnN1bWVyX2tleTtcbiAgaWYgKHRoaXMuYXV0aF90b2tlbikge1xuICAgIG9hdXRoX3BhcmFtc1snb2F1dGhfdG9rZW4nXSA9IHRoaXMuYXV0aF90b2tlbjtcbiAgfVxuXG4gIHJlcXVlc3QgPSBPQXV0aC5zaWduUmVxdWVzdChyZXF1ZXN0LCBvYXV0aF9wYXJhbXMsIHRoaXMuY29uc3VtZXJfc2VjcmV0LCB0aGlzLmF1dGhfdG9rZW5fc2VjcmV0KTtcblxuICBpZiAoYm9keSAmJiBPYmplY3Qua2V5cyhib2R5KS5sZW5ndGggPiAwKSB7XG4gICAgcmVxdWVzdC5ib2R5ID0gT0F1dGguYnVpbGRQYXJhbWV0ZXJTdHJpbmcoYm9keSk7XG4gIH1cbiAgcmV0dXJuIHJlcXVlc3Q7XG59O1xuXG5PQXV0aC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKHBhdGgsIHBhcmFtcykge1xuICByZXR1cm4gdGhpcy5zZW5kKCdHRVQnLCBwYXRoLCBwYXJhbXMpO1xufTtcblxuT0F1dGgucHJvdG90eXBlLnBvc3QgPSBmdW5jdGlvbiAocGF0aCwgcGFyYW1zLCBib2R5KSB7XG4gIHJldHVybiB0aGlzLnNlbmQoJ1BPU1QnLCBwYXRoLCBwYXJhbXMsIGJvZHkpO1xufTtcblxuLypcblx0UHJvcGVyIHN0cmluZyAlZXNjYXBlIGVuY29kaW5nXG4qL1xuT0F1dGguZW5jb2RlID0gZnVuY3Rpb24gKHN0cikge1xuICAvLyAgICAgICBkaXNjdXNzIGF0OiBodHRwOi8vcGhwanMub3JnL2Z1bmN0aW9ucy9yYXd1cmxlbmNvZGUvXG4gIC8vICAgICAgb3JpZ2luYWwgYnk6IEJyZXR0IFphbWlyIChodHRwOi8vYnJldHQtemFtaXIubWUpXG4gIC8vICAgICAgICAgaW5wdXQgYnk6IHRyYXZjXG4gIC8vICAgICAgICAgaW5wdXQgYnk6IEJyZXR0IFphbWlyIChodHRwOi8vYnJldHQtemFtaXIubWUpXG4gIC8vICAgICAgICAgaW5wdXQgYnk6IE1pY2hhZWwgR3JpZXJcbiAgLy8gICAgICAgICBpbnB1dCBieTogUmF0aGVvdXNcbiAgLy8gICAgICBidWdmaXhlZCBieTogS2V2aW4gdmFuIFpvbm5ldmVsZCAoaHR0cDovL2tldmluLnZhbnpvbm5ldmVsZC5uZXQpXG4gIC8vICAgICAgYnVnZml4ZWQgYnk6IEJyZXR0IFphbWlyIChodHRwOi8vYnJldHQtemFtaXIubWUpXG4gIC8vICAgICAgYnVnZml4ZWQgYnk6IEpvcmlzXG4gIC8vIHJlaW1wbGVtZW50ZWQgYnk6IEJyZXR0IFphbWlyIChodHRwOi8vYnJldHQtemFtaXIubWUpXG4gIC8vIHJlaW1wbGVtZW50ZWQgYnk6IEJyZXR0IFphbWlyIChodHRwOi8vYnJldHQtemFtaXIubWUpXG4gIC8vICAgICAgICAgICAgIG5vdGU6IFRoaXMgcmVmbGVjdHMgUEhQIDUuMy82LjArIGJlaGF2aW9yXG4gIC8vICAgICAgICAgICAgIG5vdGU6IFBsZWFzZSBiZSBhd2FyZSB0aGF0IHRoaXMgZnVuY3Rpb24gZXhwZWN0cyB0byBlbmNvZGUgaW50byBVVEYtOCBlbmNvZGVkIHN0cmluZ3MsIGFzIGZvdW5kIG9uXG4gIC8vICAgICAgICAgICAgIG5vdGU6IHBhZ2VzIHNlcnZlZCBhcyBVVEYtOFxuICAvLyAgICAgICAgZXhhbXBsZSAxOiByYXd1cmxlbmNvZGUoJ0tldmluIHZhbiBab25uZXZlbGQhJyk7XG4gIC8vICAgICAgICByZXR1cm5zIDE6ICdLZXZpbiUyMHZhbiUyMFpvbm5ldmVsZCUyMSdcbiAgLy8gICAgICAgIGV4YW1wbGUgMjogcmF3dXJsZW5jb2RlKCdodHRwOi8va2V2aW4udmFuem9ubmV2ZWxkLm5ldC8nKTtcbiAgLy8gICAgICAgIHJldHVybnMgMjogJ2h0dHAlM0ElMkYlMkZrZXZpbi52YW56b25uZXZlbGQubmV0JTJGJ1xuICAvLyAgICAgICAgZXhhbXBsZSAzOiByYXd1cmxlbmNvZGUoJ2h0dHA6Ly93d3cuZ29vZ2xlLm5sL3NlYXJjaD9xPXBocC5qcyZpZT11dGYtOCZvZT11dGYtOCZhcT10JnJscz1jb20udWJ1bnR1OmVuLVVTOnVub2ZmaWNpYWwmY2xpZW50PWZpcmVmb3gtYScpO1xuICAvLyAgICAgICAgcmV0dXJucyAzOiAnaHR0cCUzQSUyRiUyRnd3dy5nb29nbGUubmwlMkZzZWFyY2glM0ZxJTNEcGhwLmpzJTI2aWUlM0R1dGYtOCUyNm9lJTNEdXRmLTglMjZhcSUzRHQlMjZybHMlM0Rjb20udWJ1bnR1JTNBZW4tVVMlM0F1bm9mZmljaWFsJTI2Y2xpZW50JTNEZmlyZWZveC1hJ1xuXG4gIHN0ciA9IChzdHIgKyAnJykudG9TdHJpbmcoKTtcblxuICAvLyBUaWxkZSBzaG91bGQgYmUgYWxsb3dlZCB1bmVzY2FwZWQgaW4gZnV0dXJlIHZlcnNpb25zIG9mIFBIUCAoYXMgcmVmbGVjdGVkIGJlbG93KSwgYnV0IGlmIHlvdSB3YW50IHRvIHJlZmxlY3QgY3VycmVudFxuICAvLyBQSFAgYmVoYXZpb3IsIHlvdSB3b3VsZCBuZWVkIHRvIGFkZCBcIi5yZXBsYWNlKC9+L2csICclN0UnKTtcIiB0byB0aGUgZm9sbG93aW5nLlxuICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHN0cilcbiAgICAucmVwbGFjZSgvIS9nLCAnJTIxJylcbiAgICAucmVwbGFjZSgvJy9nLCAnJTI3JylcbiAgICAucmVwbGFjZSgvXFwoL2csICclMjgnKVxuICAgIC5yZXBsYWNlKC9cXCkvZywgJyUyOScpXG4gICAgLnJlcGxhY2UoL1xcKi9nLCAnJTJBJyk7XG59O1xuXG5PQXV0aC5zaWduYXR1cmVNZXRob2QgPSAnSE1BQy1TSEExJztcbk9BdXRoLnZlcnNpb24gPSAnMS4wJztcblxuLypcblx0R2VuZXJhdGUgYSBub25jZVxuKi9cbk9BdXRoLm5vbmNlID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdGV4dCA9ICcnO1xuICB2YXIgcG9zc2libGUgPSAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODknO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgMzA7IGkrKykgdGV4dCArPSBwb3NzaWJsZS5jaGFyQXQoTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogcG9zc2libGUubGVuZ3RoKSk7XG5cbiAgcmV0dXJuIHRleHQ7XG59O1xuXG5PQXV0aC5idWlsZFBhcmFtZXRlclN0cmluZyA9IGZ1bmN0aW9uIChvYmopIHtcbiAgLy8gU29ydCBrZXlzIGFuZCBlbmNvZGUgdmFsdWVzXG4gIGlmIChvYmopIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKG9iaikuc29ydCgpO1xuXG4gICAgLy8gTWFwIGtleT12YWx1ZSwgam9pbiB0aGVtIGJ5ICZcbiAgICByZXR1cm4ga2V5c1xuICAgICAgLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgIHJldHVybiBrZXkgKyAnPScgKyBPQXV0aC5lbmNvZGUob2JqW2tleV0pO1xuICAgICAgfSlcbiAgICAgIC5qb2luKCcmJyk7XG4gIH1cblxuICByZXR1cm4gJyc7XG59O1xuXG4vKlxuXHRCdWlsZCB0aGUgc2lnbmF0dXJlIHN0cmluZyBmcm9tIHRoZSBvYmplY3RcbiovXG5cbk9BdXRoLmJ1aWxkU2lnbmF0dXJlU3RyaW5nID0gZnVuY3Rpb24gKG1ldGhvZCwgdXJsLCBwYXJhbWV0ZXJzKSB7XG4gIHJldHVybiBbbWV0aG9kLnRvVXBwZXJDYXNlKCksIE9BdXRoLmVuY29kZSh1cmwpLCBPQXV0aC5lbmNvZGUocGFyYW1ldGVycyldLmpvaW4oJyYnKTtcbn07XG5cbi8qXG5cdFJldHVucyBlbmNvZGVkIEhNQUMtU0hBMSBmcm9tIGtleSBhbmQgdGV4dFxuKi9cbk9BdXRoLnNpZ25hdHVyZSA9IGZ1bmN0aW9uICh0ZXh0LCBrZXkpIHtcbiAgY3J5cHRvID0gcmVxdWlyZSgnY3J5cHRvJyk7XG4gIHJldHVybiBPQXV0aC5lbmNvZGUoY3J5cHRvLmNyZWF0ZUhtYWMoJ3NoYTEnLCBrZXkpLnVwZGF0ZSh0ZXh0KS5kaWdlc3QoJ2Jhc2U2NCcpKTtcbn07XG5cbk9BdXRoLnNpZ25SZXF1ZXN0ID0gZnVuY3Rpb24gKHJlcXVlc3QsIG9hdXRoX3BhcmFtZXRlcnMsIGNvbnN1bWVyX3NlY3JldCwgYXV0aF90b2tlbl9zZWNyZXQpIHtcbiAgb2F1dGhfcGFyYW1ldGVycyA9IG9hdXRoX3BhcmFtZXRlcnMgfHwge307XG5cbiAgLy8gU2V0IGRlZmF1bHQgdmFsdWVzXG4gIGlmICghb2F1dGhfcGFyYW1ldGVycy5vYXV0aF9ub25jZSkge1xuICAgIG9hdXRoX3BhcmFtZXRlcnMub2F1dGhfbm9uY2UgPSBPQXV0aC5ub25jZSgpO1xuICB9XG4gIGlmICghb2F1dGhfcGFyYW1ldGVycy5vYXV0aF90aW1lc3RhbXApIHtcbiAgICBvYXV0aF9wYXJhbWV0ZXJzLm9hdXRoX3RpbWVzdGFtcCA9IE1hdGguZmxvb3IobmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwKTtcbiAgfVxuICBpZiAoIW9hdXRoX3BhcmFtZXRlcnMub2F1dGhfc2lnbmF0dXJlX21ldGhvZCkge1xuICAgIG9hdXRoX3BhcmFtZXRlcnMub2F1dGhfc2lnbmF0dXJlX21ldGhvZCA9IE9BdXRoLnNpZ25hdHVyZU1ldGhvZDtcbiAgfVxuICBpZiAoIW9hdXRoX3BhcmFtZXRlcnMub2F1dGhfdmVyc2lvbikge1xuICAgIG9hdXRoX3BhcmFtZXRlcnMub2F1dGhfdmVyc2lvbiA9IE9BdXRoLnZlcnNpb247XG4gIH1cblxuICBpZiAoIWF1dGhfdG9rZW5fc2VjcmV0KSB7XG4gICAgYXV0aF90b2tlbl9zZWNyZXQgPSAnJztcbiAgfVxuICAvLyBGb3JjZSBHRVQgbWV0aG9kIGlmIHVuc2V0XG4gIGlmICghcmVxdWVzdC5tZXRob2QpIHtcbiAgICByZXF1ZXN0Lm1ldGhvZCA9ICdHRVQnO1xuICB9XG5cbiAgLy8gQ29sbGVjdCAgYWxsIHRoZSBwYXJhbWV0ZXJzIGluIG9uZSBzaWduYXR1cmVQYXJhbWV0ZXJzIG9iamVjdFxuICB2YXIgc2lnbmF0dXJlUGFyYW1zID0ge307XG4gIHZhciBwYXJhbWV0ZXJzVG9NZXJnZSA9IFtyZXF1ZXN0LnBhcmFtcywgcmVxdWVzdC5ib2R5LCBvYXV0aF9wYXJhbWV0ZXJzXTtcbiAgZm9yICh2YXIgaSBpbiBwYXJhbWV0ZXJzVG9NZXJnZSkge1xuICAgIHZhciBwYXJhbWV0ZXJzID0gcGFyYW1ldGVyc1RvTWVyZ2VbaV07XG4gICAgZm9yICh2YXIgayBpbiBwYXJhbWV0ZXJzKSB7XG4gICAgICBzaWduYXR1cmVQYXJhbXNba10gPSBwYXJhbWV0ZXJzW2tdO1xuICAgIH1cbiAgfVxuXG4gIC8vIENyZWF0ZSBhIHN0cmluZyBiYXNlZCBvbiB0aGUgcGFyYW1ldGVyc1xuICB2YXIgcGFyYW1ldGVyU3RyaW5nID0gT0F1dGguYnVpbGRQYXJhbWV0ZXJTdHJpbmcoc2lnbmF0dXJlUGFyYW1zKTtcblxuICAvLyBCdWlsZCB0aGUgc2lnbmF0dXJlIHN0cmluZ1xuICB2YXIgdXJsID0gJ2h0dHBzOi8vJyArIHJlcXVlc3QuaG9zdCArICcnICsgcmVxdWVzdC5wYXRoO1xuXG4gIHZhciBzaWduYXR1cmVTdHJpbmcgPSBPQXV0aC5idWlsZFNpZ25hdHVyZVN0cmluZyhyZXF1ZXN0Lm1ldGhvZCwgdXJsLCBwYXJhbWV0ZXJTdHJpbmcpO1xuICAvLyBIYXNoIHRoZSBzaWduYXR1cmUgc3RyaW5nXG4gIHZhciBzaWduYXR1cmVLZXkgPSBbT0F1dGguZW5jb2RlKGNvbnN1bWVyX3NlY3JldCksIE9BdXRoLmVuY29kZShhdXRoX3Rva2VuX3NlY3JldCldLmpvaW4oJyYnKTtcblxuICB2YXIgc2lnbmF0dXJlID0gT0F1dGguc2lnbmF0dXJlKHNpZ25hdHVyZVN0cmluZywgc2lnbmF0dXJlS2V5KTtcblxuICAvLyBTZXQgdGhlIHNpZ25hdHVyZSBpbiB0aGUgcGFyYW1zXG4gIG9hdXRoX3BhcmFtZXRlcnMub2F1dGhfc2lnbmF0dXJlID0gc2lnbmF0dXJlO1xuICBpZiAoIXJlcXVlc3QuaGVhZGVycykge1xuICAgIHJlcXVlc3QuaGVhZGVycyA9IHt9O1xuICB9XG5cbiAgLy8gU2V0IHRoZSBhdXRob3JpemF0aW9uIGhlYWRlclxuICB2YXIgYXV0aEhlYWRlciA9IE9iamVjdC5rZXlzKG9hdXRoX3BhcmFtZXRlcnMpXG4gICAgLnNvcnQoKVxuICAgIC5tYXAoZnVuY3Rpb24gKGtleSkge1xuICAgICAgdmFyIHZhbHVlID0gb2F1dGhfcGFyYW1ldGVyc1trZXldO1xuICAgICAgcmV0dXJuIGtleSArICc9XCInICsgdmFsdWUgKyAnXCInO1xuICAgIH0pXG4gICAgLmpvaW4oJywgJyk7XG5cbiAgcmVxdWVzdC5oZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnT0F1dGggJyArIGF1dGhIZWFkZXI7XG5cbiAgLy8gU2V0IHRoZSBjb250ZW50IHR5cGUgaGVhZGVyXG4gIHJlcXVlc3QuaGVhZGVyc1snQ29udGVudC1UeXBlJ10gPSAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJztcbiAgcmV0dXJuIHJlcXVlc3Q7XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IE9BdXRoO1xuIl19