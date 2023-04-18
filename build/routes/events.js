"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventsRoutes = void 0;
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const utils_1 = require("../utils/utils");
const Event_1 = require("../models/Event");
const router = (0, express_1.default)();
exports.eventsRoutes = router;
//crea un evento
router.post("/", utils_1.eventValidation, utils_1.catchErrors, utils_1.isAuth, async ({ body }, res) => {
    const { loggedUser } = res.locals; //res.locals.loggedUser esce da isAuth
    //controlliamo se l'utente é validato
    if (loggedUser.verify == "") {
        //cerchiamo se l'evento é gia presente
        const findedEvent = await Event_1.Event.findOne({ name: body.name, location: body.location });
        if (findedEvent) {
            return res.status(409).json({ message: "event already exist.." });
        }
        //se non esiste lo creiamo
        await Event_1.Event.create({
            name: body.name,
            location: body.location,
            date: new Date(body.date),
            price: body.price,
            tickets: body.tickets,
            kind: body.kind
        });
        //ne prendiamo i dati
        const eventData = await Event_1.Event.findOne({ name: body.name, location: body.location });
        //montiamo la risposta con i dati
        const responseEvent = {
            id: eventData === null || eventData === void 0 ? void 0 : eventData._id,
            name: eventData === null || eventData === void 0 ? void 0 : eventData.name,
            location: eventData === null || eventData === void 0 ? void 0 : eventData.location,
            date: eventData === null || eventData === void 0 ? void 0 : eventData.date,
            price: eventData === null || eventData === void 0 ? void 0 : eventData.price,
            tickets: eventData === null || eventData === void 0 ? void 0 : eventData.tickets,
            kind: eventData === null || eventData === void 0 ? void 0 : eventData.kind
        };
        //e la ritorniamo
        return res.status(201).json(responseEvent);
    }
    ;
    return res.status(405).json({ message: "user not verified.." });
});
//ottieni gli eventi
router.get("/", (0, express_validator_1.query)("name").optional().isString(), (0, express_validator_1.query)("location").optional().isString(), (0, express_validator_1.query)("date").optional().isString(), (0, express_validator_1.query)("price").optional().isNumeric(), (0, express_validator_1.query)("tickets").optional().isNumeric(), (0, express_validator_1.query)("kind").optional().isNumeric(), utils_1.catchErrors, async (req, res) => {
    //per questa operazione basta essere semplicemente loggati
    //semplice con find senza filtro
    const events = await Event_1.Event.find({ ...req.query }); //se ci sono query filtra
    //se non ci sono documents nella collection torna un array vuoto
    if (events.length == 0) {
        return res.status(404).json({ message: "no events found.." });
    }
    return res.status(200).json(events);
});
//ottieni un evento
router.get("/:id", (0, express_validator_1.check)("id").isString().notEmpty().withMessage("Id value not valid"), utils_1.catchErrors, utils_1.isAuth, async ({ params }, res) => {
    const id = params.id;
    const reqEvent = await Event_1.Event.findById(id);
    if (!reqEvent) {
        return res.status(404).json({ message: "event not found" });
    }
    else {
        return res.status(200).json(reqEvent);
    }
});
//ottieni i posti disponibili per un singolo evento
router.get("/:id/tickets", (0, express_validator_1.check)("id").isString().notEmpty().withMessage("Id value not valid"), utils_1.catchErrors, async ({ params }, res) => {
    const id = params.id;
    const reqEvent = await Event_1.Event.findById(id);
    if (!reqEvent) {
        return res.status(404).json({ message: "event not found" });
    }
    else {
        const availableTickets = {
            availableTickets: reqEvent.tickets
        };
        return res.status(200).json(availableTickets);
    }
});
//acquista i biglietti di un evento
router.put("/:id/tickets", [
    (0, express_validator_1.check)("id").isString().notEmpty().withMessage("Id value not valid"),
    (0, express_validator_1.body)("amount").isInt().notEmpty().withMessage("Invalid amount value"),
], utils_1.catchErrors, utils_1.isAuth, async ({ params, body }, res) => {
    const { loggedUser } = res.locals; //res.locals.loggedUser esce da isAuth
    if (loggedUser.verify == "") {
        const id = params.id;
        //cerco l'evento tramite id
        let reqEvent = await Event_1.Event.findById(id);
        if (!reqEvent) {
            return res.status(404).json({ message: "event not found" });
        }
        //se lo trovo controllo la disponibilità dei biglietti
        let availableTickets = reqEvent.tickets;
        const reqTickets = body.amount;
        if (availableTickets < reqTickets) {
            return res.status(403).json({ message: `only ${availableTickets} tickets available` });
        }
        //se ce ne sono abbastanza aggiorno il numero dei biglietti
        reqEvent.tickets -= reqTickets;
        //salvo le modifiche
        await reqEvent.save();
        //restituisco i biglietti acquistati
        return res.status(200).json({ purchased: reqTickets });
    }
    ;
    return res.status(401).json({ message: "user not verified.." });
});
//modifica un evento
router.put("/:id", [
    (0, express_validator_1.check)("id").isString().notEmpty().withMessage("Id value not valid")
], utils_1.eventValidation, utils_1.catchErrors, utils_1.isAuth, async ({ params, body }, res) => {
    const { loggedUser } = res.locals; //res.locals.loggedUser esce da isAuth
    if (loggedUser.verify == "") {
        const id = params.id;
        //cerco l'evento tramite id
        let modEvent = await Event_1.Event.findById(id);
        if (!modEvent) {
            return res.status(404).json({ message: "event not found" });
        }
        //se lo trovo aggiorno i campi con i dati del body, i campi omessi
        //dovrebbero essere ignorati MA IN REALTA QUESTO SI FA CON PATCH
        //con PUT si è soliti modificare TUTTO      
        modEvent.name = body.name;
        modEvent.location = body.location;
        modEvent.date = new Date(body.date);
        modEvent.price = body.price,
            modEvent.tickets = body.tickets;
        modEvent.kind = body.kind;
        //salvo le modifiche
        const updatedEvent = await modEvent.save();
        //restituisco l'evento moddato
        return res.status(200).json(updatedEvent);
    }
    ;
    return res.status(401).json({ message: "user not verified.." });
});
//elimina un evento
router.delete("/:id", (0, express_validator_1.check)("id").isString().notEmpty().withMessage("Id value not valid"), utils_1.catchErrors, utils_1.isAuth, async ({ params }, res) => {
    const id = params.id;
    const { loggedUser } = res.locals; //res.locals.loggedUser esce da isAuth
    //controllo utente verificato
    if (loggedUser.verify == "") {
        //elimino l'evento
        const deletedEvent = await Event_1.Event.findByIdAndDelete(id);
        //se non ritorna nulla l'evento non esiste
        if (!deletedEvent) {
            return res.status(404).json({ message: "event not found.." });
        }
        return res.status(200).json(deletedEvent);
    }
    return res.status(401).json({ message: "user not verified.." });
});
