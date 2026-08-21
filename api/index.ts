/**
 * Vercel Serverless Function entry point.
 * Wraps the main Express app for Vercel deployment.
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Re-export the app from server.ts by duplicating entry setup
// We import the app after all routes are registered via the compiled bundle.
// For Vercel, server.ts is refactored to export `app`.

// ---- Minimal bootstrap so Vercel can serve API ----
// NOTE: Full routes live in server.ts. To keep things DRY, we
// dynamically require the pre-built CJS bundle from dist/server.cjs
// which already exports `app`.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const serverModule = require('../dist/server.cjs');
const app = serverModule.app || serverModule.default;

export default (req: VercelRequest, res: VercelResponse) => {
  // Strip /api prefix so Express routes match correctly
  req.url = req.url.replace(/^\/api/, '') || '/';
  return app(req, res);
};
