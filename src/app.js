import '@babel/polyfill';
import express from 'express';
import mongoose from 'mongoose';
import { ApolloServer } from 'apollo-server-express';
import schemas from './graphql/schemas';
import resolvers from './graphql/resolvers';
import path from 'path';

const fs = require('fs');
const https = require('https');
const http = require('http');
// const {getUserId} = require('./utils/utils')

const configurations = {
  // Note: You may need sudo to run on port 443
  production: { ssl: true, port: 8443, hostname: 'localhost' },
  development: { ssl: false, port: 4000, hostname: 'localhost' },
};

const environment = process.env.NODE_ENV || 'development';
const config = configurations[environment];

const apollo = new ApolloServer({
  typeDefs: schemas,
  resolvers: resolvers,
});

const app = express();
apollo.applyMiddleware({ app });

// Create the HTTPS or HTTP server, per configuration
//Fixed to load cert and key files using path and __dirname
const keyPath = path.join(__dirname, './ssl_files/noox-key.pem');
const key = fs.readFileSync(keyPath);

const certPath = path.join(__dirname, './ssl_files/noox-cert.pem');
const cert = fs.readFileSync(certPath);

let server;

if (config.ssl) {
  // Assumes certificates are in .ssl folder from package root. Make sure the files
  // are secured.
  server = https.createServer(
    {
      key: key,
      cert: cert,
    },
    app,
  );
} else {
  server = http.createServer(app);
}

// Add subscription support
apollo.installSubscriptionHandlers(server);

//Db connection.
mongoose.Promise = global.Promise;

// mongoose.connect('mongodb://localhost/url');
var promise = mongoose.connect('mongodb://localhost/twall', {
  useNewUrlParser: true,
});

const port = process.env.PORT || 4000;
promise.then(function(db) {
  server.listen(config.port, () =>
    console.log(
      `🚀 TWall Server in (${environment}) environment ready at`,
      `http${config.ssl ? 's' : ''}://${config.hostname}:${config.port}${
        apollo.graphqlPath
      }`,
    ),
  );
});
