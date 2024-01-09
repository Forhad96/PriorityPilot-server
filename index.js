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
    origin: ["https://priority-pilot-1.web.app", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
const tasksCollection = database.collection("tasks");

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

// get Statistics data
app.get('/adminStatistics',async(req,res)=>{
  try {
    const statistics ={
      allData:0,
      totalTodo: 0,
      totalOngoing: 0,
      totalComplete:0
    }
  // const query ={status:}
statistics.allData = await tasksCollection.estimatedDocumentCount()
  statistics.totalTodo = await tasksCollection
  .countDocuments({ status: "todo" })
  statistics.totalOngoing = await tasksCollection
  .countDocuments({ status: "ongoing" })
  statistics.totalComplete = await tasksCollection
  .countDocuments({ status: "complete" })

res.send(statistics)


  } catch (error) {
    console.log(error);
    
  }
})


// get users data 
app.get("/users", async (req, res) => {
  try {
    const result = await usersCollection.find().toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// get all tasks
// app.get("/tasks", async (req, res) => {
//   try {
//     const result = await tasksCollection.find().toArray();
//     res.send(result);
//   } catch (error) {
//     console.log(error);
//   }
// });
app.get("/tasks/:status", async (req, res) => {
  try {
    const type = req.params.status;
    const query = { status: type, isTrash:'no' };
    let result;
    if (type.toLowerCase().trim() === "todo") {
      result = await tasksCollection.find(query).toArray();
    }
    if (type.toLowerCase().trim() === "ongoing") {
      result = await tasksCollection.find(query).toArray();
    }
    if (type.toLowerCase().trim() === "complete") {
      result = await tasksCollection.find(query).toArray();
    }
    if (type.toLowerCase().trim() === "all") {
      result = await tasksCollection
        .find({ isTrash: "no" })
        .toArray();
    }

    res.send(result);
  } catch (error) {
    console.log(error);
  }
});




//get single api
app.get("/task/:id", async (req, res) => {
  try {
const query = {_id:new ObjectId(req.params.id)}
    const result = await tasksCollection.findOne(query)
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});


app.get('/isTrash',async(req,res)=>{
  try {
    const query = {isTrash:'yes'}
    const result = await tasksCollection.find(query).toArray()
    res.send(result)
  } catch (error) {
    console.log(err);
    
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

// tasks:post method
app.post("/tasks", async (req, res) => {
  try {
    const task = req.body;
    const result = await tasksCollection.insertOne(task);
    console.log(result);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
//put method
app.put("/tasksStatus/:id", async (req, res) => {
  try {
    const { newStatus } = req.body;
    const query = { _id: new ObjectId(req.params.id) };
    const updateDoc = { $set: { status: newStatus } };
    // const result = await tasksCollection.findOneAndUpdate(
    //   { _id: new ObjectId(req.params.id) },
    //   { $set: { status: newStatus } },
    //   { returnDocument: "after" }
    // );
    const result = await tasksCollection.updateOne(query, updateDoc);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// api for update task
app.put("/tasks/:id", async (req, res) => {
  try {
    const doc = req.body;
    const query = { _id: new ObjectId(req.params.id) };
    const updateDoc = {
      $set: { ...doc },
    };
    const result = await tasksCollection.updateOne(query, updateDoc);

    res.send(result);
  } catch (error) {
    console.log(error);
  }
});



// api for move to trash
app.put('/moveToTrash',async(req,res)=>{
  try {
    const query = {_id: new ObjectId(req.body.id)}
    const updateDoc = {
      $set: {
        isTrash: "yes",
      },
    };

    const result = await tasksCollection.updateOne(query,updateDoc)
    res.send(result)

    console.log(query);
  } catch (error) {
    console.log(error);
    
  }
})

// api for restore form trash
app.put('/taskRestore',async(req,res)=>{
   try {
     const query = { _id: new ObjectId(req.body.id) };
     const updateDoc = {
       $set: {
         isTrash: "no",
       },
     };

     const result = await tasksCollection.updateOne(query, updateDoc);
     res.send(result);

     console.log(query);
   } catch (error) {
     console.log(error);
   }
})


// 
//delete method
app.delete("/tasks/:id", async (req, res) => {
  try {
    const id = req.params.id;
    console.log(id);
    const query = { _id: new ObjectId(req.params.id) };
    const result = await tasksCollection.deleteOne(query);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

//Delete multiple item

app.delete('/deleteMultiple',async(req,res)=>{
  try {
    const {ids} = req.body
    console.log(ids);
    const query = {_id:{$in:ids.map(id=>new ObjectId(id))}}
    const result = await tasksCollection.deleteOne(query)
    res.send(result)
  } catch (error) {
    console.log(error);
    
  }
})

app.get("/", (req, res) => {
  res.send("priority Pilot server is running ");
});

app.listen(port, () => {
  console.log(`priority PilotDB app listening on port ${port}`);
});
