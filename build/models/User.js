"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
//creo lo schema, la struttura dei document
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        reuired: true
    },
    surname: {
        type: String,
        reuired: true
    },
    email: {
        type: String,
        reuired: true
    },
    password: {
        type: String,
        reuired: true
    },
    verify: { type: String },
    token: { type: String }
});
//creo il model per applicare la struttura scelta a tutti i document nella
//collection che verrà creata dal nome singolare scelto come primo parametro
exports.User = mongoose_1.default.model("User", userSchema);
