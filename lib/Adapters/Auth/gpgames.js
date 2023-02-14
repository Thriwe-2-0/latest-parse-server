"use strict";

/* Google Play Game Services
https://developers.google.com/games/services/web/api/players/get

const authData = {
  id: 'playerId',
  access_token: 'token',
};
*/
const {
  Parse
} = require('parse/node');

const httpsRequest = require('./httpsRequest'); // Returns a promise that fulfills if this user id is valid.


async function validateAuthData(authData) {
  const response = await httpsRequest.get(`https://www.googleapis.com/games/v1/players/${authData.id}?access_token=${authData.access_token}`);

  if (!(response && response.playerId === authData.id)) {
    throw new Parse.Error(Parse.Error.OBJECT_NOT_FOUND, 'Google Play Games Services - authData is invalid for this user.');
  }
} // Returns a promise that fulfills if this app id is valid.


function validateAppId() {
  return Promise.resolve();
}

module.exports = {
  validateAppId,
  validateAuthData
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9BZGFwdGVycy9BdXRoL2dwZ2FtZXMuanMiXSwibmFtZXMiOlsiUGFyc2UiLCJyZXF1aXJlIiwiaHR0cHNSZXF1ZXN0IiwidmFsaWRhdGVBdXRoRGF0YSIsImF1dGhEYXRhIiwicmVzcG9uc2UiLCJnZXQiLCJpZCIsImFjY2Vzc190b2tlbiIsInBsYXllcklkIiwiRXJyb3IiLCJPQkpFQ1RfTk9UX0ZPVU5EIiwidmFsaWRhdGVBcHBJZCIsIlByb21pc2UiLCJyZXNvbHZlIiwibW9kdWxlIiwiZXhwb3J0cyJdLCJtYXBwaW5ncyI6Ijs7QUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsTUFBTTtBQUFFQSxFQUFBQTtBQUFGLElBQVlDLE9BQU8sQ0FBQyxZQUFELENBQXpCOztBQUNBLE1BQU1DLFlBQVksR0FBR0QsT0FBTyxDQUFDLGdCQUFELENBQTVCLEMsQ0FFQTs7O0FBQ0EsZUFBZUUsZ0JBQWYsQ0FBZ0NDLFFBQWhDLEVBQTBDO0FBQ3hDLFFBQU1DLFFBQVEsR0FBRyxNQUFNSCxZQUFZLENBQUNJLEdBQWIsQ0FDcEIsK0NBQThDRixRQUFRLENBQUNHLEVBQUcsaUJBQWdCSCxRQUFRLENBQUNJLFlBQWEsRUFENUUsQ0FBdkI7O0FBR0EsTUFBSSxFQUFFSCxRQUFRLElBQUlBLFFBQVEsQ0FBQ0ksUUFBVCxLQUFzQkwsUUFBUSxDQUFDRyxFQUE3QyxDQUFKLEVBQXNEO0FBQ3BELFVBQU0sSUFBSVAsS0FBSyxDQUFDVSxLQUFWLENBQ0pWLEtBQUssQ0FBQ1UsS0FBTixDQUFZQyxnQkFEUixFQUVKLGlFQUZJLENBQU47QUFJRDtBQUNGLEMsQ0FFRDs7O0FBQ0EsU0FBU0MsYUFBVCxHQUF5QjtBQUN2QixTQUFPQyxPQUFPLENBQUNDLE9BQVIsRUFBUDtBQUNEOztBQUVEQyxNQUFNLENBQUNDLE9BQVAsR0FBaUI7QUFDZkosRUFBQUEsYUFEZTtBQUVmVCxFQUFBQTtBQUZlLENBQWpCIiwic291cmNlc0NvbnRlbnQiOlsiLyogR29vZ2xlIFBsYXkgR2FtZSBTZXJ2aWNlc1xuaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vZ2FtZXMvc2VydmljZXMvd2ViL2FwaS9wbGF5ZXJzL2dldFxuXG5jb25zdCBhdXRoRGF0YSA9IHtcbiAgaWQ6ICdwbGF5ZXJJZCcsXG4gIGFjY2Vzc190b2tlbjogJ3Rva2VuJyxcbn07XG4qL1xuY29uc3QgeyBQYXJzZSB9ID0gcmVxdWlyZSgncGFyc2Uvbm9kZScpO1xuY29uc3QgaHR0cHNSZXF1ZXN0ID0gcmVxdWlyZSgnLi9odHRwc1JlcXVlc3QnKTtcblxuLy8gUmV0dXJucyBhIHByb21pc2UgdGhhdCBmdWxmaWxscyBpZiB0aGlzIHVzZXIgaWQgaXMgdmFsaWQuXG5hc3luYyBmdW5jdGlvbiB2YWxpZGF0ZUF1dGhEYXRhKGF1dGhEYXRhKSB7XG4gIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgaHR0cHNSZXF1ZXN0LmdldChcbiAgICBgaHR0cHM6Ly93d3cuZ29vZ2xlYXBpcy5jb20vZ2FtZXMvdjEvcGxheWVycy8ke2F1dGhEYXRhLmlkfT9hY2Nlc3NfdG9rZW49JHthdXRoRGF0YS5hY2Nlc3NfdG9rZW59YFxuICApO1xuICBpZiAoIShyZXNwb25zZSAmJiByZXNwb25zZS5wbGF5ZXJJZCA9PT0gYXV0aERhdGEuaWQpKSB7XG4gICAgdGhyb3cgbmV3IFBhcnNlLkVycm9yKFxuICAgICAgUGFyc2UuRXJyb3IuT0JKRUNUX05PVF9GT1VORCxcbiAgICAgICdHb29nbGUgUGxheSBHYW1lcyBTZXJ2aWNlcyAtIGF1dGhEYXRhIGlzIGludmFsaWQgZm9yIHRoaXMgdXNlci4nXG4gICAgKTtcbiAgfVxufVxuXG4vLyBSZXR1cm5zIGEgcHJvbWlzZSB0aGF0IGZ1bGZpbGxzIGlmIHRoaXMgYXBwIGlkIGlzIHZhbGlkLlxuZnVuY3Rpb24gdmFsaWRhdGVBcHBJZCgpIHtcbiAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgdmFsaWRhdGVBcHBJZCxcbiAgdmFsaWRhdGVBdXRoRGF0YSxcbn07XG4iXX0=