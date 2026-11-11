import express from "express";

import {
    listTickets,
    getTicket,
    createTicket,
    updateTicket,
    transitionTicket,
    addComment,
} from "../../../controllers/ticket.controller.js";

const router = express.Router();

router.get("/vendor/:vendorId/tickets", listTickets);
router.get("/vendor/:vendorId/tickets/:ticketId", getTicket);
router.post("/vendor/:vendorId/tickets", createTicket);
router.patch("/vendor/:vendorId/tickets/:ticketId", updateTicket);
router.post("/vendor/:vendorId/tickets/:ticketId/transition", transitionTicket);
router.post("/vendor/:vendorId/tickets/:ticketId/comments", addComment);

export default router;
