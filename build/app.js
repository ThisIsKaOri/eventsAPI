"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
//importo le routes
const auth_1 = require("./routes/auth");
const events_1 = require("./routes/events");
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.json());
//definisco i path a cui saranno disponibili le mie routes
exports.app.use('/v1/auth', auth_1.authRoutes);
exports.app.use('/v1/events', events_1.eventsRoutes);
exports.app.listen(3000, async () => {
    //creo la connessione al database prima di loggare l'avvio del server
    await mongoose_1.default.connect("mongodb://127.0.0.1:27017/eventsManagement");
    console.log("Server is running..");
});
