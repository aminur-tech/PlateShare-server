const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('plateshare server');
});

// MongoDB connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.f47fo9z.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();
    const database = client.db("PlateShare");
    const foodsCollection = database.collection("foods");

    // available foods
    app.get('/foods', async(req,res)=>{
        const cursor = foodsCollection.find()
        const result = await cursor.toArray()
        res.send(result)
    })

    // get featured foods
    app.get('/featured-foods', async (req, res) => {
      const cursor = foodsCollection.find().sort({ food_quantity: -1 }).limit(6);
      const result = await cursor.toArray();
      res.send(result);
    });

    // get food details
    app.get

    // post 

    await client.db("admin").command({ ping: 1 });
    console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
