import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    tickets: {
        type: Number,
        required: true
    },
    kind: {
        type: String,
        required: true
    }
  });

  export const Event = mongoose.model("event", eventSchema);