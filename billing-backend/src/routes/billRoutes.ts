import { Router } from "express";
import { createBill } from "../controllers/BillController";

const router = Router();

router.post("/bills", createBill);

export default router;
