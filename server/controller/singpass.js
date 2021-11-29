require('dotenv/config')

const restClient = require('superagent-bluebird-promise');
const path = require('path');
const url = require('url');
const util = require('util');
const Promise = require('bluebird');
const _ = require('lodash');
const querystring = require('querystring');
const securityHelper = require('../helpers/security');
const crypto = require('crypto');
const colors = require('colors');
const axios = require('axios')

// process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// LOADED FRON ENV constIABLE: public key from MyInfo Consent Platform given to you during onboarding for RSA digital signature
const _publicCertContent = process.env.MYINFO_SIGNATURE_CERT_PUBLIC_CERT;
// LOADED FRON ENV constIABLE: your private key for RSA digital signature
const _privateKeyContent = process.env.DEMO_APP_SIGNATURE_CERT_PRIVATE_KEY;
// LOADED FRON ENV constIABLE: your client_id provided to you during onboarding
const _clientId = process.env.MYINFO_APP_CLIENT_ID;
// LOADED FRON ENV constIABLE: your client_secret provided to you during onboarding
const _clientSecret = process.env.MYINFO_APP_CLIENT_SECRET;
// redirect URL for your web application
const _redirectUrl = process.env.MYINFO_APP_REDIRECT_URL;


// URLs for MyInfo APIs
const _authLevel = process.env.AUTH_LEVEL;

const _authApiUrl = process.env.MYINFO_API_AUTHORISE;
const _tokenApiUrl = process.env.MYINFO_API_TOKEN;
const _personApiUrl = process.env.MYINFO_API_PERSON;

const _attributes = "uinfin,name,sex,race,nationality,dob,email,mobileno,regadd,housingtype,hdbtype,marital,edulevel,noa-basic,ownerprivate,cpfcontributions,cpfbalances";

class SingpassController {
    static check = async (req,res) => {
        try {
            console.log(_publicCertContent)
            res.status(200).json({
                message : 'singpass controller ready'
            })
        } catch (error) {
            throw error
        }
    }

    static callback = async (req,res) => {
        const code = req.query.code;
        console.log(code)
        res.status(200).json({
            code : code
        })
    }

    static getEnv = async (req,res) => {
        try {
            if (_clientId == undefined || _clientId == null){
                res.status(500).json({
                    status: "ERROR",
                    msg: "client_id not found"
                });
            }
                
            else {
                res.status(200).json({
                    status: "OK",
                    clientId: _clientId,
                    redirectUrl: _redirectUrl,
                    authApiUrl: _authApiUrl,
                    attributes: _attributes,
                    authLevel: _authLevel
                });
            }       
        } catch (error) {
            throw error
        }
    }

    static getPersonData = async (req,res) => {
        try {
            // get variables from frontend
        var code = req.body.code;

        var data;
        var request;

        request = await this.createTokenRequest(code);
        console.log(request)
 
        request
        .buffer(true)
        .end(function(callErr, callRes) {
        if (callErr) {
            // ERROR
            console.error("Token Call Error: ",callErr.status);
            console.error(callErr.response.req.res.text);
            res.jsonp({
            status: "ERROR",
            msg: callErr
            });
        } else {
            // SUCCESSFUL
            var data = {
            body: callRes.body,
            text: callRes.text
            };
            console.log("Response from Token API:".green);
            console.log(JSON.stringify(data.body));

            var accessToken = data.body.access_token;
            if (accessToken == undefined || accessToken == null) {
            res.jsonp({
                status: "ERROR",
                msg: "ACCESS TOKEN NOT FOUND"
            });
            }

            console.log("Contoh Access Token Sebelum Call Person API:".green);
            console.log(accessToken)
            // everything ok, call person API
            callPersonAPI(accessToken, res);
        }
        });
        } catch (error) {
            throw error
        }
        

    }

    static async callPersonAPI (accessToken, res){
        console.log("AUTH_LEVEL:".green,_authLevel);

        // validate and decode token to get SUB
        var decoded = securityHelper.verifyJWS(accessToken, _publicCertContent);
        if (decoded == undefined || decoded == null) {
            res.jsonp({
            status: "ERROR",
            msg: "INVALID TOKEN"
            })
        }

        console.log("Decoded Access Token:".green);
        console.log(JSON.stringify(decoded));

        var sub = decoded.sub;
        if (sub == undefined || sub == null) {
            res.jsonp({
            status: "ERROR",
            msg: "SUB NOT FOUND"
            });
        }

        // **** CALL PERSON API ****
        var request = createPersonRequest(sub, accessToken);

        // Invoke asynchronous call
        request
            .buffer(true)
            .end(function(callErr, callRes) {
            if (callErr) {
                console.error("Person Call Error: ",callErr.status);
                console.error(callErr.response.req.res.text);
                res.jsonp({
                status: "ERROR",
                msg: callErr
                });
            } else {
                // SUCCESSFUL
                var data = {
                body: callRes.body,
                text: callRes.text
                };
                var personData = data.text;
                if (personData == undefined || personData == null) {
                res.jsonp({
                    status: "ERROR",
                    msg: "PERSON DATA NOT FOUND"
                });
                } else {

                if (_authLevel == "L0") {
                    console.log("Person Data:".green);
                    console.log(personData);
                    personData = JSON.parse(personData);
                    // personData = securityHelper.verifyJWS(personData, _publicCertContent);

                    if (personData == undefined || personData == null) {
                    res.jsonp({
                        status: "ERROR",
                        msg: "INVALID DATA OR SIGNATURE FOR PERSON DATA"
                    });
                    }
                    
                    // successful. return data back to frontend
                    res.jsonp({
                    status: "OK",
                    text: personData
                    });

                }
                else if(_authLevel == "L2"){
                    console.log("Person Data (JWE):".green);
                    console.log(personData);

                    var jweParts = personData.split("."); // header.encryptedKey.iv.ciphertext.tag
                    securityHelper.decryptJWE(jweParts[0], jweParts[1], jweParts[2], jweParts[3], jweParts[4], _privateKeyContent)
                    .then(personDataJWS => {
                        if (personDataJWS == undefined || personDataJWS == null) {
                        res.jsonp({
                            status: "ERROR",
                            msg: "INVALID DATA OR SIGNATURE FOR PERSON DATA"
                        });
                        }
                        console.log("Person Data (JWS):".green);
                        console.log(JSON.stringify(personDataJWS));

                        var decodedPersonData = securityHelper.verifyJWS(personDataJWS, _publicCertContent);
                        if (decodedPersonData == undefined || decodedPersonData == null) {
                        res.jsonp({
                            status: "ERROR",
                            msg: "INVALID DATA OR SIGNATURE FOR PERSON DATA"
                        })
                        }


                        console.log("Person Data (Decoded):".green);
                        console.log(JSON.stringify(decodedPersonData));
                        // successful. return data back to frontend
                        res.jsonp({
                        status: "OK",
                        text: decodedPersonData
                        });

                    })
                    .catch(error => {
                        console.error("Error with decrypting JWE: %s".red, error);
                    })
                }
                else {
                    throw new Error("Unknown Auth Level");
                }

                } // end else
            }
            }); //end asynchronous call
    }

    static async createTokenRequest(code) {
        try {
            const cacheCtl = "no-cache";
            const contentType = "application/x-www-form-urlencoded"; //header
            const method = "POST";
            // console.log(_tokenApiUrl.green)
            const data = {
                grant_type:"authorization_code",
                code : code,
                redirect_uri : _redirectUrl,
                client_id : _clientId,
                client_secret : _clientSecret
            }
            console.log(data)
            const headers = {
                "Content-Type" : contentType,
                "Cache-Control" : cacheCtl
            }
            
            // var strParams = "grant_type=authorization_code" +
            //     "&code=" + code +
            //     "&redirect_uri=" + _redirectUrl +
            //     "&client_id=" + _clientId +
            //     "&client_secret=" + _clientSecret;
            // var params = querystring.parse(strParams); // url


            // assemble headers for Token API
            // var strHeaders = "Content-Type=" + contentType + "&Cache-Control=" + cacheCtl;
            // var headers = querystring.parse(strHeaders);

            // Add Authorisation headers for connecting to API Gateway
            var authHeaders = null; 
            if (_authLevel == "L0") {
                // No headers
            } else if (_authLevel == "L2") {
                authHeaders = securityHelper.generateAuthorizationHeader(
                _tokenApiUrl,
                params,
                method,
                contentType,
                _authLevel,
                _clientId,
                _privateKeyContent,
                _clientSecret
                );
            } else {
                throw new Error("Unknown Auth Level");
            }

            if (!_.isEmpty(authHeaders)) {
                _.set(headers, "Authorization", authHeaders);
            }

            console.log("Request Header for Token API:".green);
            console.log(headers);

            // var request = restClient.post(_tokenApiUrl); // ilangin 
            const request = await axios({
                url : _tokenApiUrl,
                method : 'POST',
                data : data,
                headers : headers
            });

            console.log(request)

            // Set headers
            if (!_.isUndefined(headers) && !_.isEmpty(headers))
                request.set(headers);

            // Set Params
            if (!_.isUndefined(params) && !_.isEmpty(params))
                request.send(params);

                console.log("Ini request dari create token:".green);
                console.log(request)
            
            return request.data;
        } catch (error) {
            throw error
        }
    }

    static async createPersonRequest(sub, validToken){
        var url = _personApiUrl + "/" + sub + "/";
        var cacheCtl = "no-cache";
        var method = "GET";

        // assemble params for Person API
        var strParams = "client_id=" + _clientId +
            "&attributes=" + _attributes;

        var params = querystring.parse(strParams);

        // assemble headers for Person API
        var strHeaders = "Cache-Control=" + cacheCtl;
        var headers = querystring.parse(strHeaders);

        // Add Authorisation headers for connecting to API Gateway
        var authHeaders = securityHelper.generateAuthorizationHeader(
            url,
            params,
            method,
            "", // no content type needed for GET
            _authLevel,
            _clientId,
            _privateKeyContent,
            _clientSecret
        );

        // NOTE: include access token in Authorization header as "Bearer " (with space behind)
        if (!_.isEmpty(authHeaders)) {
            _.set(headers, "Authorization", authHeaders + ",Bearer " + validToken);
        } else {
            _.set(headers, "Authorization", "Bearer " + validToken);
        }

        console.log("Request Header for Person API:".green);
        console.log(JSON.stringify(headers));
        // invoke person API
        var request = restClient.get(url);

        // Set headers
        if (!_.isUndefined(headers) && !_.isEmpty(headers))
            request.set(headers);

        // Set Params
        if (!_.isUndefined(params) && !_.isEmpty(params))
            request.query(params);

            console.log("Hasil request si Create Person Request:".green);
            console.log(request)
        return request;
    }
}

module.exports = SingpassController;