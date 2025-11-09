const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 3000

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('plateshare server')
})

// connect mongo bd
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f47fo9z.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
async function run() {
    try {
        await client.connect();
        const database = client.db("PlateShare");
        const foodsCollection = database.collection("foods");

        // get featured foods
        app.get('featured-foods', async (req, res) => {
            const cursor = foodsCollection.find().sort({ food_quantity: -1 }).limit(6)
            const result = cursor.toArray()
            res.send(result)
        })
        

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {

    }
}
run().catch(console.dir);

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
