import { Router } from "express";
import jwt from "jsonwebtoken";
import pool, { getSqliteDb } from "../../lib/mysql"; // it has getSqliteDb inside? Wait. Let me check.
