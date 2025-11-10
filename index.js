const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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
    app.get('/foods', async (req, res) => {
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
    app.get('/foods/:id', async (req, res) => {
      const id = req.params.id
      const query = ({ _id: new ObjectId(id) })
      const result = await foodsCollection.findOne(query)
      res.send(result)
    })

    // add food
    app.get('/add-food', async (req, res) => {

      const email = req.query.email
      const query = {}
      if (email) {
        query.donator_email = email
      }

      const cursor = foodsCollection.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    // post add food
    app.post('/add-food', async (req, res) => {
      const newFood = req.body
      const result = await foodsCollection.insertOne(newFood)
      res.send(result)
    })

    // update add food
    app.patch('/add-food/:id', async (req, res) => {
      const id = req.params.id
      const updateFood = req.body
      const query = { _id: new ObjectId(id) }
      const update = {
        $set: {
          name: updateFood.name,

        }
      }
      const options = {}
      const result = await foodsCollection.updateOne(query, update, options)
      res.send(result)
    })

    // delete add food
    app.delete('/add-food/:id', async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await foodsCollection.deleteOne(query)
      res.send(result)
    })


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
