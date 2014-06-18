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
                database: "sbtry",    
            });
        };
    }


    
    function createRoutes() {

    }


    function initializeServer() {
     createRoutes();
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


    initialize();
    start();





