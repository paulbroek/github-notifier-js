// test.js
const request = require('request');
const rp = require('request-promise');

const demo = module.exports.demo = async function() {
  try {
    const res = await rp.post( {
      uri: 'https://httpbin.org/anything',
      body: { hi: 'there', },
    }, function (error, response, body) {
      return error ? error : body;
    } )
    console.log( res )
    return res;
  }
  catch ( e ) {
    console.error( e );
  }
};