'use strict';
const AWS = require('aws-sdk');
// Set the region 
AWS.config.update({ region: 'XX-XXXX-X' });

exports.handler = (event, context, callback) => {
    try {
        dispatch(event,
            (response) => {
                callback(null, response);
            });
    } catch (err) {
        callback(err);
    }
};

// --------------- Events -----------------------
var region = 'XX-XXXX-X';
var domain = 'https://search-XXXX-XX-elasti-XXXXXXXXXXX-klk7ixhgfitwn7bgbsyfm.XX-XXXX-X.es.amazonaws.com';
var endpoint = new AWS.Endpoint(domain);
var request = new AWS.HttpRequest(endpoint, region);
var credentials = new AWS.EnvironmentCredentials('AWS');
var signer = new AWS.Signers.V4(request, 'es');
var client = new AWS.HttpClient();

const dispatch = async (intentRequest, callback) => {
    const currIntent = intentRequest.currentIntent.name
    const sessionAttributes = intentRequest.sessionAttributes;
    const slots = intentRequest.currentIntent.slots;

    if (currIntent === 'aws_botnae_here') {
        const parentCatName = slots.term.replace(" ", "-").toLowerCase();
        var index = `elasticsearch_index`;
        var type = `_search?q=enter_search_query`;
        request.method = 'GET';
        request.path += index + '/' + encodeURI(type);

        try {
            // handleRequest() will fetch the redord from dynamoDB using the ElasticSearch endpoint 
            client.handleRequest(request, null, function (response) {
                var responseBody = '';
                response.on('data', function (chunk) {
                    responseBody += chunk;
                });
                response.on('end', function (chunkData) {
                    let serviceData = JSON.parse(responseBody);
                    if (serviceData.hits.hits.length > 0) {
                        let contentData = serviceData.hits.hits;
                        if (contentData.length >= 3) {
                            let resource = contentData.map(data => { return data._source['term'] });
                            callback(close(sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `Multiple matches for ${slots.term}:- ${resource.toLocaleString()}` }));
                        } else {
                            let resource = contentData.map(data => { return data._source['description'] });
                            callback(close(sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `${slots.term}: ${resource.toLocaleString()}` }));
                        }
                    } else {
                        callback(close(sessionAttributes, 'Fulfilled', { 'contentType': 'PlainText', 'content': `No content found for ${parentCatName} in UN Glossary` }));
                    }
                });
            }, function (error) {
                console.log('Error: ' + error);
            });
        } catch (err) {
            console.log("Error", err);
        }
    }
}

function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}