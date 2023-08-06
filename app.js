import express from "express";
import cookieParser from "cookie-parser";
import { config } from "dotenv";

import ErrorMiddleware from "./middlewares/Error.js";
import cors from "cors";
config({
  path: "./config/config.env",
});
const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);
import course from "./routes/courseRoutes.js";
import blog from "./routes/blogRoutes.js";
import user from "./routes/userRoutes.js";
import payment from "./routes/paymentRoutes.js";
import other from "./routes/otherRoutes.js";
import { User } from "./models/User.js";
import { Course } from "./models/Course.js";

app.use("/api/v1", course);
app.use("/api/v1", user);
app.use("/api/v1", payment);
app.use("/api/v1", other);
app.use("/api/v1", blog);

app.get("/", (req, res) => {
  res.send(
    `<h1>Server is Working Fine. Please Click <a href=${process.env.FRONTEND_URL}>here</a> to visit the Frontend </h1>`
  );
});
// const CLIENT_ID = process.env.CLIENT_ID;
// const APP_SECRET = process.env.APP_SECRET;
// const base = process.env.BASE;
const CLIENT_ID =
  "AafCCqfG7VCMmjpt-TM-Qu4aCitft5MeOzM_f8lfGI8gywd6vAgWpVp4kqLBkZWYM2dyNzssMf3AUhlg";
const APP_SECRET = process.env.APP_SECRET;
const base = "https://api-m.paypal.com";
const generateAccessToken = async () => {
  try {
    const auth = Buffer.from(CLIENT_ID + ":" + APP_SECRET).toString("base64");
    const response = await fetch(`${base}/v1/oauth2/token`, {
      method: "post",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
  }
};
const createOrder = async (amount) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        amount: {
          currency_code: "USD",
          value: amount,
        },
      },
    ],
  };

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    method: "POST",
    body: JSON.stringify(payload),
  });

  return handleResponse(response);
};

const capturePayment = async (orderID) => {
  const accessToken = await generateAccessToken();
  const url = `${base}/v2/checkout/orders/${orderID}/capture`;

  const response = await fetch(url, {
    method: "post",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  // if (response.status === 200 || response.status === 201) {

  // }

  return handleResponse(response);
};

async function handleResponse(response) {
  if (response.status === 200 || response.status === 201) {
    return response.json();
  }

  const errorMessage = await response.text();
  throw new Error(errorMessage);
}

app.post("/api/v1/orders", async (req, res) => {
  try {
    const response = await createOrder(req.query.amount);
    res.json(response);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to create order." });
  }
});

app.post("/api/v1/orders/:orderID/capture", async (req, res) => {
  try {
    const { orderID } = req.params;
    const response = await capturePayment(orderID);
    // console.log(response.payer.payer_id);
    // console.log(response.payer.email_address);

    res.json(response);
  } catch (error) {
    console.error("Failed to create order:", error);
    res.status(500).json({ error: "Failed to capture order." });
  }
});
app.use(ErrorMiddleware);
export default app;
