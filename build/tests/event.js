"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
require("chai").should();
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../routes/auth");
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_2 = require("../routes/auth");
const app_1 = require("../app");
const User_1 = require("../models/User");
const Event_1 = require("../models/Event");
const baseURL = "/v1/events";
describe("events", () => {
    const testEvent = {
        name: "Color",
        location: "Ma Catania",
        date: new Date("2023-04-22T22:30"),
        price: 15,
        tickets: 200,
        kind: "DJ Set"
    };
    const testUser = {
        name: "Carlo",
        surname: "Leonardi",
        email: "carloleonard83@gmail.com",
        password: "testtest"
    };
    describe("event creation", () => {
        //visto che si tratta di operazioni autenticate creo l'utente validato
        before(async () => {
            await User_1.User.create({
                name: testUser.name,
                surname: testUser.surname,
                email: testUser.email,
                password: await bcrypt_1.default.hash(testUser.password, auth_1.saltRounds),
                token: await jsonwebtoken_1.default.sign({ email: testUser.email }, auth_2.jwtToken, { expiresIn: "24h" }),
                verify: ""
            });
        });
        after(async () => {
            //alla fine elimino l'utente
            await User_1.User.findOneAndDelete({ email: testUser.email });
        });
        it("event created, 201", async () => {
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token e mando l'evento test
            const { status, body } = await (0, supertest_1.default)(app_1.app).post(baseURL)
                .set({ authorization: token })
                .send(testEvent);
            status.should.be.equal(201);
            body.should.have.property("id");
            body.should.have.property("name");
            body.should.have.property("location");
            body.should.have.property("date");
            body.should.have.property("price");
            body.should.have.property("tickets");
            body.should.have.property("kind");
            const id = body.id;
            await Event_1.Event.findByIdAndDelete(id);
        });
        it("invalid data, 400", async () => {
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token e mando l'evento test con name non valido
            const { status } = await (0, supertest_1.default)(app_1.app).post(baseURL)
                .set({ authorization: token })
                .send({ ...testEvent, name: 1234 });
            status.should.be.equal(400);
        });
        it("event already exist, 409", async () => {
            //creo un evento in catalogo uguale al testEvent
            const existingEvent = await Event_1.Event.create({
                name: testEvent.name,
                location: testEvent.location,
                date: testEvent.date,
                price: testEvent.price,
                tickets: testEvent.tickets,
                kind: testEvent.kind
            });
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token e mando l'evento test
            const { status } = await (0, supertest_1.default)(app_1.app).post(baseURL)
                .set({ authorization: token })
                .send(testEvent);
            status.should.be.equal(409);
            //elimino l'evento creato
            const id = existingEvent._id;
            await Event_1.Event.findByIdAndDelete(id);
        });
    });
    describe("event update", async () => {
        let id;
        const newTickets = 400;
        before(async () => {
            //creo un utente validato
            await User_1.User.create({
                name: testUser.name,
                surname: testUser.surname,
                email: testUser.email,
                password: await bcrypt_1.default.hash(testUser.password, auth_1.saltRounds),
                token: await jsonwebtoken_1.default.sign({ email: testUser.email }, auth_2.jwtToken, { expiresIn: "24h" }),
                verify: ""
            });
            //creo un evento da modificare
            let event = await Event_1.Event.create(testEvent);
            id = event._id.toString();
        });
        after(async () => {
            //elimino sia utente che evento
            await User_1.User.findOneAndDelete({ email: testUser.email });
            await Event_1.Event.findByIdAndDelete(id);
        });
        it("updated event, 200", async () => {
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token e mando l'evento modificato
            const { status, body } = await (0, supertest_1.default)(app_1.app).put(`${baseURL}/${id}`)
                .set({ authorization: token })
                .send({ ...testEvent, tickets: newTickets });
            status.should.be.equal(200);
            body.should.have.property("_id");
            body.should.have.property("name");
            body.should.have.property("location");
            body.should.have.property("date");
            body.should.have.property("price");
            body.should.have.property("tickets");
            body.should.have.property("kind");
        });
        it("event not found, 404", async () => {
            const fakeId = "a" + id.substring(1);
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token su fakeId e mando l'evento modificato
            const { status } = await (0, supertest_1.default)(app_1.app).put(`${baseURL}/${fakeId}/`)
                .set({ authorization: token })
                .send({ ...testEvent, tickets: newTickets });
            status.should.be.equal(404);
        });
    });
    describe("event delete", async () => {
        let id;
        before(async () => {
            //creo un utente validato
            await User_1.User.create({
                name: testUser.name,
                surname: testUser.surname,
                email: testUser.email,
                password: await bcrypt_1.default.hash(testUser.password, auth_1.saltRounds),
                token: await jsonwebtoken_1.default.sign({ email: testUser.email }, auth_2.jwtToken, { expiresIn: "24h" }),
                verify: ""
            });
            //creo un evento da cancellare
            let event = await Event_1.Event.create(testEvent);
            id = event._id.toString();
        });
        after(async () => {
            //elimino sia utente che evento
            await User_1.User.findOneAndDelete({ email: testUser.email });
            await Event_1.Event.findByIdAndDelete(id);
        });
        it("deleted event, 200", async () => {
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token all'id dell'evento da cancellare
            const { status, body } = await (0, supertest_1.default)(app_1.app).delete(`${baseURL}/${id}`)
                .set({ authorization: token });
            status.should.be.equal(200);
            body.should.have.property("_id");
            body.should.have.property("name");
            body.should.have.property("location");
            body.should.have.property("date");
            body.should.have.property("price");
            body.should.have.property("tickets");
            body.should.have.property("kind");
        });
        it("event not found, 404", async () => {
            const fakeId = "a" + id.substring(1);
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token su fakeId
            const { status } = await (0, supertest_1.default)(app_1.app).delete(`${baseURL}/${fakeId}`)
                .set({ authorization: token });
            status.should.be.equal(404);
        });
    });
    describe("unauthorized operations", async () => {
        let id;
        const newLocation = "Industrie";
        before(async () => {
            //creo un utente non validato
            await User_1.User.create({
                name: testUser.name,
                surname: testUser.surname,
                email: testUser.email,
                password: await bcrypt_1.default.hash(testUser.password, auth_1.saltRounds),
                token: await jsonwebtoken_1.default.sign({ email: testUser.email }, auth_2.jwtToken, { expiresIn: "24h" }),
                verify: (0, uuid_1.v4)()
            });
            //creo un evento da modificare/cancellare
            let event = await Event_1.Event.create(testEvent);
            id = event._id.toString();
        });
        after(async () => {
            //alla fine elimino l'utente e l' evento
            await User_1.User.findOneAndDelete({ email: testUser.email });
            await Event_1.Event.findByIdAndDelete(id);
        });
        it("unauthorized creation", async () => {
            //tento le operazioni senza loggarmi           
            const { status } = await (0, supertest_1.default)(app_1.app).post(baseURL)
                .send(testEvent);
            status.should.be.equal(401);
        });
        it("unauthorized updating", async () => {
            //tento le operazioni senza loggarmi
            const { status } = await (0, supertest_1.default)(app_1.app).put(`${baseURL}/${id}`)
                .send({ ...testEvent, brand: newLocation });
            status.should.be.equal(401);
        });
        it("unauthorized delete", async () => {
            //tento le operazioni senza loggarmi           
            const { status } = await (0, supertest_1.default)(app_1.app).delete(`${baseURL}/${id}`);
            status.should.be.equal(401);
        });
        it("unauthorized purchase", async () => {
            //tento le operazioni senza loggarmi
            const { status, body } = await (0, supertest_1.default)(app_1.app).put(`${baseURL}/${id}/tickets`)
                .send({ amount: 50 });
            status.should.be.equal(401);
        });
    });
    describe("reading events", async () => {
        let ids = [];
        const testEvents = [
            {
                name: "Color",
                location: "MaCatania",
                date: new Date("2023-04-22"),
                price: 15,
                tickets: 200,
                kind: "DJ Set"
            },
            {
                name: "No Ordinary Sunday",
                location: "MaCatania",
                date: new Date("2023-04-23"),
                price: 5,
                tickets: 200,
                kind: "Live"
            },
            {
                name: "Phase2",
                location: "Industrie",
                date: new Date("2023-04-22"),
                price: 35,
                tickets: 200,
                kind: "DJSet"
            }
        ];
        before(async () => {
            //creo una serie di eventi dal mio array test
            const response = await Promise.all([
                Event_1.Event.create(testEvents[0]),
                Event_1.Event.create(testEvents[1]),
                Event_1.Event.create(testEvents[2])
            ]);
            //salvo gli id degli eventi creati 
            ids = response.map((item) => item._id.toString());
        });
        after(async () => {
            //cancello gli eventi creati
            await Promise.all([
                Event_1.Event.findByIdAndDelete(ids[0]),
                Event_1.Event.findByIdAndDelete(ids[1]),
                Event_1.Event.findByIdAndDelete(ids[2])
            ]);
        });
        it("events returned, 200", async () => {
            const { status, body } = await (0, supertest_1.default)(app_1.app).get(baseURL);
            status.should.be.equal(200);
            //la risposta dovrá avere lo stesso numero di elementi nel mio array test
            body.should.have.property("length").equal(testEvents.length);
        });
        it("filtered location events, 200", async () => {
            const { status, body } = await (0, supertest_1.default)(app_1.app)
                .get(`${baseURL}?location=MaCatania`);
            status.should.be.equal(200);
            //devono esserci solo due eventi con la location inserita
            body.should.have.property("length").equal(2);
        });
        it("filtered name events, 200", async () => {
            const { status, body } = await (0, supertest_1.default)(app_1.app)
                .get(`${baseURL}?name=Phase2`);
            status.should.be.equal(200);
            //dovrebbe esserci solo un evento col nome inserito
            body.should.have.property("length").equal(1);
        });
        it("filtered date events, 200", async () => {
            const { status, body } = await (0, supertest_1.default)(app_1.app)
                .get(`${baseURL}?date=2023-04-22`);
            status.should.be.equal(200);
            //dovrebbero esserci solo due eventi con la data inserita
            body.should.have.property("length").equal(2);
        });
    });
    describe("reading single event by ID", async () => {
        let id;
        before(async () => {
            //creo un evento da cercare
            let event = await Event_1.Event.create(testEvent);
            id = event._id.toString();
        });
        after(async () => {
            //elimino l'evento
            await Event_1.Event.findByIdAndDelete(id);
        });
        it("returned event, 200", async () => {
            //faccio la richiesta all'id dell'evento
            const { status, body } = await (0, supertest_1.default)(app_1.app).get(`${baseURL}/${id}`);
            status.should.be.equal(200);
            body.should.have.property("_id");
            body.should.have.property("name");
            body.should.have.property("location");
            body.should.have.property("date");
            body.should.have.property("price");
            body.should.have.property("tickets");
            body.should.have.property("kind");
        });
        it("event not found, 404", async () => {
            const fakeId = "a" + id.substring(1);
            //faccio la richiesta su fakeId
            const { status } = await (0, supertest_1.default)(app_1.app).get(`${baseURL}/${fakeId}/`);
            status.should.be.equal(404);
        });
    });
    describe("tickets purchase", async () => {
        let id;
        const rightAmount = 50;
        const wrongAmount = 1000;
        before(async () => {
            //creo un utente validato
            await User_1.User.create({
                name: testUser.name,
                surname: testUser.surname,
                email: testUser.email,
                password: await bcrypt_1.default.hash(testUser.password, auth_1.saltRounds),
                token: await jsonwebtoken_1.default.sign({ email: testUser.email }, auth_2.jwtToken, { expiresIn: "24h" }),
                verify: ""
            });
            //creo un evento su cui acquistare i biglietti
            let event = await Event_1.Event.create(testEvent);
            id = event._id.toString();
        });
        after(async () => {
            //elimino sia utente che evento
            await User_1.User.findOneAndDelete({ email: testUser.email });
            await Event_1.Event.findByIdAndDelete(id);
        });
        it("tickets purchased, 200", async () => {
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token e mando la quantità di biglietti
            const { status, body } = await (0, supertest_1.default)(app_1.app).put(`${baseURL}/${id}/tickets`)
                .set({ authorization: token })
                .send({ amount: rightAmount });
            status.should.be.equal(200);
            body.should.have.property("purchased").equal(rightAmount);
        });
        it("not enough tickets, 403", async () => {
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token e una quantità eccessiva di biglietti
            const { status } = await (0, supertest_1.default)(app_1.app).put(`${baseURL}/${id}/tickets`)
                .set({ authorization: token })
                .send({ amount: wrongAmount });
            status.should.be.equal(403);
        });
        it("event not found, 404", async () => {
            const fakeId = "a" + id.substring(1);
            //loggo e prendo il token
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`/v1/auth/login`)
                .send({ email: testUser.email, password: testUser.password });
            //faccio la richiesta col token su fakeId e mando la quantità
            const { status } = await (0, supertest_1.default)(app_1.app).delete(`${baseURL}/${fakeId}/tickets`)
                .set({ authorization: token })
                .send({ amount: rightAmount });
            status.should.be.equal(404);
        });
    });
    describe("check tickets availability", async () => {
        let id;
        before(async () => {
            //creo un evento per controllare i biglietti
            let event = await Event_1.Event.create(testEvent);
            id = event._id.toString();
        });
        after(async () => {
            //elimino l' evento
            await Event_1.Event.findByIdAndDelete(id);
        });
        it("available tickets returned, 200", async () => {
            //faccio la richiesta sull'id dell'evento
            const { status, body } = await (0, supertest_1.default)(app_1.app).get(`${baseURL}/${id}/tickets`);
            status.should.be.equal(200);
            body.should.have.property("availableTickets");
        });
        it("event not found, 404", async () => {
            const fakeId = "a" + id.substring(1);
            //faccio la richiesta sul fakeId
            const { status } = await (0, supertest_1.default)(app_1.app).get(`${baseURL}/${fakeId}/tickets`);
            status.should.be.equal(404);
        });
    });
});
