import request from "supertest";
require("chai").should();
import { assert } from "chai";

import bcrypt from "bcrypt";
import { saltRounds } from "../routes/auth";
import { v4 } from "uuid";
import jwt from "jsonwebtoken";
import { jwtToken } from "../routes/auth";

import { app } from "../app";
import { User } from "../models/User";

const baseURL = "/v1/auth";

describe("auth", () => {
  const user = {
    name: "Carlo",
    surname: "Leonardi",
    email: "carloleonard83@gmail.com",
    password: "testtest",
  };
  describe("signup", () => {
    after(async() => {
      await User.findOneAndDelete({ email : user.email});
    });
    it("test 400 wrong email", async () => {
      const { status } = await request(app)
        .post(`${baseURL}/signup`)
        .send({ ...user, email: "wrong-email" });
      status.should.be.equal(400);
    });

    it("test 400 missing name", async () => {
      const userWithoutName = { ...user } as any;
      delete userWithoutName.name;
      const { status } = await request(app)
        .post(`${baseURL}/signup`)
        .send(userWithoutName);
      status.should.be.equal(400);
    });
    it("test 400 short password", async () => {
      const userWithShortPassword = { ...user } as any;
      userWithShortPassword.password = "aaa";
      const { status } = await request(app)
        .post(`${baseURL}/signup`)
        .send(userWithShortPassword);
      status.should.be.equal(400);
    });
    it("test 201 for signup", async () => {
      const { body, status } = await request(app).post(`${baseURL}/signup`).send(user);
      status.should.be.equal(201);
      body.should.have.property("id");
      body.should.have.property("name").equal(user.name);
      body.should.have.property("surname").equal(user.surname);
      body.should.have.property("email").equal(user.email);
      body.should.not.have.property("password");
      body.should.not.have.property("verify");
    });
    it("test 409 email is just present", async () => {
      const { status } = await request(app).post(`${baseURL}/signup`).send(user);
      status.should.be.equal(409);
    });
  });

  describe("validate", () => {
    before( async () => {
      await User.create ({
        name: user.name,
        surname: user.surname,
        email: user.email,
        password: await bcrypt.hash(user.password, saltRounds),
        verify: v4()
      });
    });
    after( async () => {
      await User.findOneAndDelete({ email : user.email});
    });
    it("test 400 Invalid token", async () => {
      const { status } = await request(app).get(`${baseURL}/validate/fake-token`);
      status.should.be.equal(400);
    });
    it("test 200 set token", async () => {
      const userFinded = await User.findOne({ email: user.email });
      const { status } = await request(app).get(`${baseURL}/validate/${userFinded?.verify}`);
      const updatedUser = await User.findOne({ email: userFinded?.email });
      status.should.be.equal(200);
      assert.equal(updatedUser?.verify, "");
    });
  });

  describe("login", () => {
    let password = "password";
    before(async () => {
      await User.create ({
        name: user.name,
        surname: user.surname,
        email: user.email,
        password: await bcrypt.hash(password, saltRounds)
      });
    });
    after( async () => {
      await User.findOneAndDelete({ email : user.email});
    });
    it("test 400 wrong data", async () => {
      const { status } = await request(app)
        .post(`${baseURL}/login`)
        .send({ email: "wrongmail", password: "A simple password" });
      status.should.be.equal(400);
    });
    it("test 401 invalid credentials", async () => {
      const { status } = await request(app)
        .post(`${baseURL}/login`)
        .send({ email: user.email, password: "wrong-password" });
      status.should.be.equal(401);
    });
    it("test 200 login success", async () => {
      const { status, body } = await request(app)
        .post(`${baseURL}/login`)
        .send({ email: user.email, password });
      status.should.be.equal(200);
      body.should.have.property("token");
    });
  });

  describe("login with not confirmed user", () => {
    let password = "password";
    before(async () => {
      await User.create ({
        name: user.name,
        surname: user.surname,
        email: user.email,
        password: await bcrypt.hash(password, saltRounds),
        verify: v4()
      });
    });
    after( async () => {
      await User.findOneAndDelete({ email : user.email});
    });
    it("test 401 login not success (while email is not verified)", async () => {
      const { status } = await request(app)
        .post(`${baseURL}/login`)
        .send({ email: user.email, password });
      status.should.be.equal(401);
    });
  });

  describe("me", () => {
    let password = "password";
    before(async () => {
      await User.create ({
        name: user.name,
        surname: user.surname,
        email: user.email,
        password: await bcrypt.hash(password, saltRounds),
        token: await jwt.sign(
          {email: user.email}, 
          jwtToken, 
          {expiresIn: "24h"}
        )
      });
    });
    after( async () => {        
      await User.findOneAndDelete({ email : user.email});
    });
    it("test 200 token wrong", async () => {
      const { status } = await request(app)
        .post(`${baseURL}/login`)
        .set({ authorization: "wrong-token" });
      status.should.be.equal(400);
    });
    it("test 200 token right", async () => {
      //loggo con l'utente e mi prendo il token dal body della response
      const { body: { token } } = await request(app).post(`${baseURL}/login`)
      .send({ email: user.email, password });
      //faccio la get su /me e mando il token nell'header
      const { body } = await request(app)
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