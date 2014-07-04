#!/bin/env node
//  OpenShift sample Node application
var fs      = require('fs-extra');
var restify = require('restify');
var mysql   = require('mysql');
var server = null;

var ipaddress;
var port;
var connection;

function setupVariables() {
        ipaddress = process.env.OPENSHIFT_NODEJS_IP;
        port      = process.env.OPENSHIFT_NODEJS_PORT || 8080;
        connection = mysql.createConnection({
            host    : process.env.OPENSHIFT_MYSQL_DB_HOST,
            port    : process.env.OPENSHIFT_MYSQL_DB_PORT,
            user    : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
            password: process.env.OPENSHIFT_MYSQL_DB_PASSWORD,
            database: "shoppingbuddies"   
        });
        if (typeof ipaddress === "undefined") {
            //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
            //  allows us to run/test the server locally.
            console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
            ipaddress = "127.0.0.1";
            connection =  mysql.createConnection({
                host    : "localhost",
                user    : "root",
                password: "Tra@2014",
                database: "sbtry"   
            });
        };
    }


    
    function createRoutes() {
        server.post("/login",login);
        server.post("/createTrip",createTrip);
        server.get("/trips",getTrip);
        server.post("/leaveTrip",leaveTrip);
        server.post("/updateTripStatus",updateTripStatus);
    }


    function initializeServer() {
     server = restify.createServer({name:"sbapp"});
     server.use(restify.queryParser());
     server.use(restify.bodyParser());
     server.use(restify.CORS());
     if(connection != null){
        connection.connect(function(err){
           if(err)
            console.log("ERROR : "+err);
        else 
            console.log("SUCCESS connected to database");
       });
     }
    createRoutes();
    }


    /**
     *  Initializes the sample application.
     */
     function initialize() {
        setupVariables();
        initializeServer();
    }


    /**
     *  Start the server (starts up the sample application).
     */
     function start() {
        //  Start the app on the specific interface (and port).
        server.listen(port, ipaddress, function() {
            console.log('%s: Node server started on %s:%d ...',
                Date(Date.now() ), ipaddress, port);
        });
    }

//Create trip
function createTrip (req,res,next) {
    
    var data = req.body;
    res.setHeader('Access-Control-Origin','*');
    var params = "'" + data.tripName + "',"
                     + data.userId + "," 
                     + "'" + data.occasion + "'," 
                     + "'" + data.date + "',"
                     + "'" + data.duration + "'," 
                     + "'" + data.meetup + "'," 
                     + "'" + data.friends + "',"
                     + "'" + data.venues + "'"; 
    connection.query('CALL createNewTrip(' + params + ')',function(err,result){
        if(err)
             res.send(500,{error: err, params: params});
        else {
            var friends = data.invitedfriends;
            if(friends && friends.length > 0) {
                var count = 0;
                for(var i = 0; i <= friends.length; i++){
                    var params = "'" + friends[i] +  "'," + result[0][0].TRIP_INSERT_ID + ",1";
                    connection.query('CALL addAttendee(' + params + ')',function(err, result) {
                        if(err){
                           res.send(500, {error:"trip is not created"})
                        } else {
                           count = count + 1;
                           if(count == friends.length){
                             res.send(200,{success: true});
                           }
                        }
                    });            
                }
            }else {
                res.send(200, result[0][0]);
            }
        }
    });
}

function getTrip (req,res,next) {
    res.setHeader('Access-Control-Origin','*');
    var params = "'" + req.params.userId + "'," + req.params.past ;
    var trips;
    var tripAttendees = [];
    connection.query('CALL getUserTrips(' + params + ')',function(err,result){
        if(err)
            res.send(200,{error: err});
        else{
            trips = result[0];
            tripAttendees  = result[1];

            for(var i = 0; i<trips.length; i++) {
                 trips[i]["attendees"] = [];
                 for(var j = 0; j< tripAttendees.length; j++) {
                    if(tripAttendees[j].tripId == trips[i].tripId) {
                       trips[i]["attendees"].push(tripAttendees[j]);
                    }
                 }
            }
            res.send(200, trips);
        }
    });
}


function login(req,res,next) {
    res.setHeader('Access-Control-Origin','*');
    var data = req.body;
    var params = "'" + data.name + "','"  + data.app_unique_id + "'";
    connection.query('CALL loginApp(' + params + ')',function(err, result) {
        if(err){
            res.send(200,{error: err});
        } else {
            res.send(result[0][0]);
        }
    });
}


function leaveTrip(req,res,next){
    res.setHeader('Access-Control-Origin','*');
    var data = req.body;
    var params = data.tripId + "," + data.userId;
    connection.query('DELETE FROM TRIP_ATTENDEES WHERE TRIPID=' + data.tripId + ' AND ATTENDEEID=' + data.userId +';',function(err, result) {
        if(err){
            res.send(500,{error: err});
        } else {
            res.send(200, {success: true});
        }
    });   
}

function updateTripStatus (req,res,next) {
   res.setHeader('Access-Control-Origin','*');
    var data = req.body;
    var params = data.userId + "," + data.tripId + "," + data.status;
    connection.query('Update TRIP_ATTENDEES SET STATUS =' + data.status + ', RESPONDED = 1 WHERE ATTENDEEID =' + userId +'and TRIPID = ' +tripId +';',function(err, result) {
        if(err){
            res.send(200,{error: err});
        } else {
            res.send(200,{success: true});
        }
    });  
}

function addAttendee(attendeeFBId,tripId,status) {
    
}

initialize();
start();







