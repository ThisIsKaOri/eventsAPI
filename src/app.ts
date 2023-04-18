import express from "express";
import mongoose from "mongoose";

//importo le routes
import { authRoutes } from "./routes/auth";
import { eventsRoutes } from "./routes/events";

export const app = express();

app.use(express.json());
//definisco i path a cui saranno disponibili le mie routes
app.use('/v1/auth', authRoutes);
app.use('/v1/events', eventsRoutes);


app.listen(3000, async () => {
    //creo la connessione al database prima di loggare l'avvio del server
    await mongoose.connect("mongodb://127.0.0.1:27017/eventsManagement");
    console.log("Server is running..");
});