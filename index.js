require('dotenv').config();
const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const cors = require('cors')
app.use(cors())
app.use(express.json());
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');




const uri = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASS}@radiance-ems.gqney3y.mongodb.net/?appName=radiance-EMS`;

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
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");




        const homeHeroDB = client.db('homeHero');
        const servicesCollection = homeHeroDB.collection("services");


        app.post('/services', async (req, res) => {

            const newService = req.body;

            const existing = await servicesCollection.findOne(newService);
            if (existing) return res.status(400).send({ message: "already exist" })

            const result = await servicesCollection.insertOne(newService);
            res.send(result);
        })



        app.get('/services', async (req, res) => {
            const services = await servicesCollection.find().toArray();
            res.send(services);
        })


        app.get('/services/:email', async (req, res) => {
            const email = req.params.email;

            try {
                const query = { email: email };
                const result = await servicesCollection.find(query).toArray();
                res.send(result)
            }
            catch (err) {
                console.log(err)
                res.status(500).send({ message: "cannot get data" })
            }
        })



        app.patch('/services/:id', async (req, res) => {
            const id = req.params.id;
            const updatedData = req.body; // client theke updated value asbe

            try {
                const result = await servicesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: updatedData } // eta na dile kono change hobe na
                );

                res.send(result);
            } catch (error) {
                console.error(error);
                res.status(500).send({ message: 'Update failed' });
            }
        });



        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id

            const result = await servicesCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })






















    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
