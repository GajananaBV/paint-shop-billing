# 🎨 Paint Shop Billing Application

A **full-stack billing system** developed for small paint shops to manage products, stock, billing, GST calculations, discounts, and PDF invoice generation.

The application provides a complete billing workflow — from product management to invoice download — designed to simulate a real-world GST billing solution used in retail businesses.

---

## 🚀 Project Overview

This project is built using a modern full-stack architecture:

- **Backend** handles business logic, database operations, stock updates, and invoice generation.
- **Frontend** provides a responsive user interface for billing and product management.

The system automatically calculates GST, applies discounts, updates stock, and generates downloadable PDF invoices.

---

## 🛠️ Tech Stack

### Backend

- Node.js
- Express.js
- TypeORM
- PostgreSQL
- PDFKit (Invoice generation)
- dotenv
- CORS & body-parser

### Frontend

- React (Create React App)
- TypeScript
- Material UI (MUI)
- Axios
- React Hooks

---

## 📂 Project Structure

paint-shop-billing/
│
├── billing-backend/ # Node.js REST API
├── billing-frontend/ # React Application
├── .gitignore
└── README.md

---

## ✨ Features

### 📦 Product Management

- Add, edit, delete products
- Maintain product pricing and GST
- Automatic stock tracking
- Opening and closing stock handling

### 🧾 Billing System

- Create bills with multiple products
- Item-level discount support
- Overall bill discount
- Automatic GST calculation
- Real-time total updates

### 📉 Stock Management

- Stock reduces automatically after sales
- Prevents incorrect inventory tracking

### 🧾 Invoice Generation

- PDF invoices generated using PDFKit
- Stored in `/public/invoices`
- Downloadable via static URL

### 📜 Bill History

- View all previous bills
- Download invoices anytime

### 🎨 User Interface

- Built with Material UI (MUI)
- Clean and responsive layout
- Easy billing workflow

---

## ⚙️ Setup Instructions

### ✅ Prerequisites

Make sure you have installed:

- Node.js (v18+ recommended)
- PostgreSQL
- Git

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/paint-shop-billing.git
cd paint-shop-billing




2️⃣ Backend Setup

cd billing-backend
npm install

Create .env file inside billing-backend:

DB_HOST=localhost
DB_PORT=5432
DB_NAME=paint_billing
DB_USER=postgres
DB_PASSWORD=******
DB_SSLMODE=disable
PORT=5000

Run backend server:

npm run dev

Backend will run at:

http://localhost:5000




3️⃣ Frontend Setup

Open new terminal:

cd billing-frontend
npm install

Create .env file:

REACT_APP_API_URL=http://localhost:5000

Start frontend:

npm start

Frontend runs at:

http://localhost:3000




🧮 Billing Workflow

Step 1 — Add Products

Example:

Code: P001

Name: Red Paint

Stock: 50

Rate: ₹200

GST: 18%

Step 2 — Create Bill

Select products

Add to cart

Modify quantity & discount

GST calculated automatically

Step 3 — Save Bill

Backend calculates totals

Stock updates automatically

Bill saved in database

PDF invoice generated

Step 4 — Bill History

View past bills

Download invoice PDFs




📑 Invoice PDF Includes

Invoice title & bill number

Customer details & date

Product table

Quantity, Rate, Discount, GST

Subtotal & Net Total




▶️ Quick Run Commands

# Start Backend
cd billing-backend
npm install
npm run dev

# Start Frontend
cd billing-frontend
npm install
npm start




🔒 Environment Variables

.env files are excluded from Git using .gitignore for security.




✅ Future Improvements

User authentication (Admin / Staff roles)

Sales reports (Daily/Monthly)

Stock analytics dashboard

Excel/CSV export

Cloud deployment (Railway / Render / Vercel)




📌 Project Purpose

This project was created to practice and demonstrate:

Full-stack application development

REST API design

Database modeling with TypeORM

GST & billing calculations

PDF generation workflow

Frontend–Backend integration




👨‍💻 Author

Gajanan
QA Engineer | Automation Tester | Full Stack Learner


```
