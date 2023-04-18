"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
require("chai").should();
const chai_1 = require("chai");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("../routes/auth");
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_2 = require("../routes/auth");
const app_1 = require("../app");
const User_1 = require("../models/User");
const baseURL = "/v1/auth";
describe("auth", () => {
    const user = {
        name: "Carlo",
        surname: "Leonardi",
        email: "carloleonard83@gmail.com",
        password: "testtest",
    };
    describe("signup", () => {
        after(async () => {
            await User_1.User.findOneAndDelete({ email: user.email });
        });
        it("test 400 wrong email", async () => {
            const { status } = await (0, supertest_1.default)(app_1.app)
                .post(`${baseURL}/signup`)
                .send({ ...user, email: "wrong-email" });
            status.should.be.equal(400);
        });
        it("test 400 missing name", async () => {
            const userWithoutName = { ...user };
            delete userWithoutName.name;
            const { status } = await (0, supertest_1.default)(app_1.app)
                .post(`${baseURL}/signup`)
                .send(userWithoutName);
            status.should.be.equal(400);
        });
        it("test 400 short password", async () => {
            const userWithShortPassword = { ...user };
            userWithShortPassword.password = "aaa";
            const { status } = await (0, supertest_1.default)(app_1.app)
                .post(`${baseURL}/signup`)
                .send(userWithShortPassword);
            status.should.be.equal(400);
        });
        it("test 201 for signup", async () => {
            const { body, status } = await (0, supertest_1.default)(app_1.app).post(`${baseURL}/signup`).send(user);
            status.should.be.equal(201);
            body.should.have.property("id");
            body.should.have.property("name").equal(user.name);
            body.should.have.property("surname").equal(user.surname);
            body.should.have.property("email").equal(user.email);
            body.should.not.have.property("password");
            body.should.not.have.property("verify");
        });
        it("test 409 email is just present", async () => {
            const { status } = await (0, supertest_1.default)(app_1.app).post(`${baseURL}/signup`).send(user);
            status.should.be.equal(409);
        });
    });
    describe("validate", () => {
        before(async () => {
            await User_1.User.create({
                name: user.name,
                surname: user.surname,
                email: user.email,
                password: await bcrypt_1.default.hash(user.password, auth_1.saltRounds),
                verify: (0, uuid_1.v4)()
            });
        });
        after(async () => {
            await User_1.User.findOneAndDelete({ email: user.email });
        });
        it("test 400 Invalid token", async () => {
            const { status } = await (0, supertest_1.default)(app_1.app).get(`${baseURL}/validate/fake-token`);
            status.should.be.equal(400);
        });
        it("test 200 set token", async () => {
            const userFinded = await User_1.User.findOne({ email: user.email });
            const { status } = await (0, supertest_1.default)(app_1.app).get(`${baseURL}/validate/${userFinded === null || userFinded === void 0 ? void 0 : userFinded.verify}`);
            const updatedUser = await User_1.User.findOne({ email: userFinded === null || userFinded === void 0 ? void 0 : userFinded.email });
            status.should.be.equal(200);
            chai_1.assert.equal(updatedUser === null || updatedUser === void 0 ? void 0 : updatedUser.verify, "");
        });
    });
    describe("login", () => {
        let password = "password";
        before(async () => {
            await User_1.User.create({
                name: user.name,
                surname: user.surname,
                email: user.email,
                password: await bcrypt_1.default.hash(password, auth_1.saltRounds)
            });
        });
        after(async () => {
            await User_1.User.findOneAndDelete({ email: user.email });
        });
        it("test 400 wrong data", async () => {
            const { status } = await (0, supertest_1.default)(app_1.app)
                .post(`${baseURL}/login`)
                .send({ email: "wrongmail", password: "A simple password" });
            status.should.be.equal(400);
        });
        it("test 401 invalid credentials", async () => {
            const { status } = await (0, supertest_1.default)(app_1.app)
                .post(`${baseURL}/login`)
                .send({ email: user.email, password: "wrong-password" });
            status.should.be.equal(401);
        });
        it("test 200 login success", async () => {
            const { status, body } = await (0, supertest_1.default)(app_1.app)
                .post(`${baseURL}/login`)
                .send({ email: user.email, password });
            status.should.be.equal(200);
            body.should.have.property("token");
        });
    });
    describe("login with not confirmed user", () => {
        let password = "password";
        before(async () => {
            await User_1.User.create({
                name: user.name,
                surname: user.surname,
                email: user.email,
                password: await bcrypt_1.default.hash(password, auth_1.saltRounds),
                verify: (0, uuid_1.v4)()
            });
        });
        after(async () => {
            await User_1.User.findOneAndDelete({ email: user.email });
        });
        it("test 401 login not success (while email is not verified)", async () => {
            const { status } = await (0, supertest_1.default)(app_1.app)
                .post(`${baseURL}/login`)
                .send({ email: user.email, password });
            status.should.be.equal(401);
        });
    });
    describe("me", () => {
        let password = "password";
        before(async () => {
            await User_1.User.create({
                name: user.name,
                surname: user.surname,
                email: user.email,
                password: await bcrypt_1.default.hash(password, auth_1.saltRounds),
                token: await jsonwebtoken_1.default.sign({ email: user.email }, auth_2.jwtToken, { expiresIn: "24h" })
            });
        });
        after(async () => {
            await User_1.User.findOneAndDelete({ email: user.email });
        });
        it("test 200 token wrong", async () => {
            const { status } = await (0, supertest_1.default)(app_1.app)
                .post(`${baseURL}/login`)
                .set({ authorization: "wrong-token" });
            status.should.be.equal(400);
        });
        it("test 200 token right", async () => {
            //loggo con l'utente e mi prendo il token dal body della response
            const { body: { token } } = await (0, supertest_1.default)(app_1.app).post(`${baseURL}/login`)
                .send({ email: user.email, password });
            //faccio la get su /me e mando il token nell'header
            const { body } = await (0, supertest_1.default)(app_1.app)
                .get(`${baseURL}/me`)
                .set({ authorization: token });
            body.should.have.property("id");
            body.should.have.property("name").equal(user.name);
            body.should.have.property("surname").equal(user.surname);
            body.should.have.property("email").equal(user.email);
            body.should.not.have.property("password");
            body.should.not.have.property("verify");
        });
    });
});
