const TortoiseDB = require('tortoisedb');

// Create a new instance
const app = new TortoiseDB({
    // Choose database name  - defaults to 'default' if not provided
    name: 'demo',
    // Set server port - defaults to process.env.PORT if not provided
    port: 3000,
    // Provide mongodb URI - defaults to process.env.MONGODB_URI if not provided
    mongoURI: 'mongodb://easel-db-test:B1A2hKVvrOuxlro52oxO95cvQ2EW4TjIYbh4iwlOsMVWJInROXF0ICsWKxUEVFWWzhnEgxrX2sdTqg3qC8stvw==@easel-db-test.mongo.cosmos.azure.com:10255/?ssl=true&replicaSet=globaldb&retrywrites=false&maxIdleTimeMS=120000&appName=@easel-db-test@',
    // Set batch limit - defaults to 1000 if not provided
    batchLimit: 1000
  });
  
  // Start up server
  app.start();
  
  // Drop database
  app.dropDB();