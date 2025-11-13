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


app.get('/', (req, res) => {
    res.send('Server is running!');
});


async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
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
            try {
                // Optional price filter from query parameters
                const minPrice = parseFloat(req.query.minPrice) || 0;
                const maxPrice = parseFloat(req.query.maxPrice) || 9999999;

                const services = await servicesCollection
                    .aggregate([
                        // Add default avgRating = 0 if missing
                        {
                            $addFields: {
                                avgRating: { $ifNull: ["$avgRating", 0] }
                            }
                        },
                        // Filter by price range
                        {
                            $match: {
                                price: { $gte: minPrice, $lte: maxPrice }
                            }
                        },
                        // Sort by avgRating descending
                        { $sort: { avgRating: -1 } }
                    ])
                    .toArray();

                res.send(services);
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Failed to fetch services" });
            }
        });





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




        app.post('/services/:id/review', async (req, res) => {
            const id = req.params.id;
            const { rating, comment, userEmail } = req.body; // client sends these

            if (!rating || !comment || !userEmail) {
                return res.status(400).send({ message: "Rating, comment and userEmail are required" });
            }

            try {
                const service = await servicesCollection.findOne({ _id: new ObjectId(id) });
                if (!service) return res.status(404).send({ message: "Service not found" });

                const review = {
                    userEmail,
                    rating: parseInt(rating),
                    comment,
                    createdAt: new Date()
                };

                // push review into reviews array
                await servicesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $push: { reviews: review } }
                );

                // recalculate avgRating
                const updatedService = await servicesCollection.findOne({ _id: new ObjectId(id) });
                const totalRating = updatedService.reviews.reduce((acc, r) => acc + r.rating, 0);
                const avgRating = totalRating / updatedService.reviews.length;

                await servicesCollection.updateOne(
                    { _id: new ObjectId(id) },
                    { $set: { avgRating: avgRating } }
                );

                res.send({ message: "Review added successfully", avgRating, reviews: updatedService.reviews });
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: "Server error" });
            }
        });



        app.delete('/services/:id', async (req, res) => {
            const id = req.params.id

            const result = await servicesCollection.deleteOne({ _id: new ObjectId(id) })
            res.send(result)
        })






        const bookingsCollection = homeHeroDB.collection("bookings");


        app.post('/bookings', async (req, res) => {

            const newBookings = req.body;

            const existing = await bookingsCollection.findOne(newBookings);
            if (existing) return res.status(400).send({ message: "already exist" })

            const result = await bookingsCollection.insertOne(newBookings);
            res.send(result);
        })


        app.get('/bookings', async (req, res) => {
            const result = await bookingsCollection.find().toArray();
            res.send(result)
        })

        app.get('/bookings/:email', async (req, res) => {
            const email = req.params.email;

            try {
                const query = { userEmail: email };
                const result = await bookingsCollection.find(query).toArray();
                res.send(result)
            } catch (error) {
                console.log(error);
            }
        })




        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id

            const result = await bookingsCollection.deleteOne({ _id: new ObjectId(id) })
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
