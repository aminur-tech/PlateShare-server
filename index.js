const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// firebase service key
const admin = require("firebase-admin");
const decoded = Buffer.from(process.env.FB_SERVICE_KEY, "base64").toString("utf8");
const serviceAccount = JSON.parse(decoded);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});


// middleware
app.use(cors());
app.use(express.json());

const verifyFirebaseToken = async (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authorization.split(' ')[1]
    try {
        const decoded = await admin.auth().verifyIdToken(token)
        req.token_email = decoded.email
        next()
    } catch (error) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
}




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
    // await client.connect();
    const database = client.db("PlateShare");
    const foodsCollection = database.collection("foods");
    const foodsRequestCollection = database.collection('food-request')

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
    app.post('/add-food',verifyFirebaseToken, async (req, res) => {
      const newFood = req.body
      const result = await foodsCollection.insertOne(newFood)
      res.send(result)
    })

    // update add food
    app.patch('/add-food/:id',verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const updateFood = req.body;
      const query = { _id: new ObjectId(id) };
      const update = {
        $set: {
          food_name: updateFood.food_name,
          food_image: updateFood.food_image,
          food_quantity: updateFood.food_quantity,
          pickup_location: updateFood.pickup_location,
          expire_date: updateFood.expire_date,
        },
      };

      const options = { upsert: false };
      const result = await foodsCollection.updateOne(query, update, options);
      res.send(result);
    });


    // delete add food
    app.delete('/add-food/:id',verifyFirebaseToken, async (req, res) => {
      const id = req.params.id
      const query = { _id: new ObjectId(id) }
      const result = await foodsCollection.deleteOne(query)
      res.send(result)
    })


    // food request
    // Get user requests by email
    app.get('/food-request', async (req, res) => {
      const email = req.query.userEmail;
      const query = email ? { userEmail: email } : {};
      const result = await foodsRequestCollection.find(query).toArray();
      res.send(result);
    });

    // food request post
    app.post('/food-request',verifyFirebaseToken, async (req, res) => {
      const newRequest = req.body
      const result = await foodsRequestCollection.insertOne(newRequest)
      res.send(result)
    })

    // Delete a food request
    app.delete('/food-request/:id',verifyFirebaseToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await foodsRequestCollection.deleteOne(query);
      res.send(result);
    });

    
    // Accept / Reject a food request
    app.patch('/food-request/:id/status',verifyFirebaseToken, async (req, res) => {
      const { id } = req.params;
      const { status } = req.body; // 'accepted' or 'rejected'
      const query = { _id: new ObjectId(id) };

      const update = { $set: { status } };
      const result = await foodsRequestCollection.updateOne(query, update);

      // If accepted, also update the food status
      if (status === "accepted") {
        const request = await foodsRequestCollection.findOne(query);
        await foodsCollection.updateOne(
          { _id: new ObjectId(request.foodId) },
          { $set: { food_status: 'donated' } }
        );
      }

      res.send(result);
    });






    // await client.db("admin").command({ ping: 1 });
    // console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err);
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
