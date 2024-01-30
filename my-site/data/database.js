const mongodb=require('mongodb')

const mongoclient=mongodb.MongoClient;
let database;
 async function connect(){
   const client=await mongoclient.connect('mongodb://localhost:27017');
   database=client.db('security')
}
function getDb(){
    if(!database){
        throw{
            message:'Database connection not established'
        }
    }
    return database;
}
module.exports={
    connectToDatabase:connect,
    getDb:getDb
};
