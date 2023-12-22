const express = require("express");
const cors = require("cors");
require("dotenv").config();
var jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(
  cors({
    origin: ["https://bookify007.web.app", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.shhvx1o.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// my created middle ware

const verifyToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).send({ message: "unauthorized Access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "unauthorized Access" });
    }
    req.user = decoded;
    next();
  });
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

//  priority-pilot::Database
const database = client.db("priorityPilotDB");
// Database::Collection
const usersCollection = database.collection("users");
const taskCollection = database.collection("task");

// Auth related api
app.post("/jwt", async (req, res) => {
  const user = req.body;
  const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "1h",
  });
  res
    .cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    })
    .send({ success: true });
  // console.log({ token });
  console.log(user);
});

// Get method
app.get('/users',async(req,res)=>{
  try {
    const result = await usersCollection.find().toArray()
    res.send(result)
  } catch (error) {
    console.log(error);
    
  }
})

// get all task
app.get('/task',async(req,res)=>{
  try {
    const result = await taskCollection.find().toArray()
    res.send(result)
  } catch (error) {
    console.log(error);
    
  }
})


//post method

app.post("/users", async (req, res) => {
  try {
    const user = req.body;
    const result = await usersCollection.insertOne(user);
    res.send(result);
  } catch (error) {}
});

// task:post method
app.post('/task',async(req,res)=>{
  try {
    const task = req.body
    const result = await taskCollection.insertOne(task)
    console.log(result);
  } catch (error) {
    console.log(error);
    
  }
})
//put method

//delete method

app.get("/", (req, res) => {
  res.send("priority Pilot server is running ");
});

app.listen(port, () => {
  console.log(`priority PilotDB app listening on port ${port}`);
});
