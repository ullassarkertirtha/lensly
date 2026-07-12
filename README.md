# LensLy

### AI-Powered Eyewear E-Commerce Platform

CSE470 – Software Engineering Project

---

## Group Members

| Student ID |        Name         |
| :--------: | :-----------------: |
|  24141251  | Sahana Parvin Nupur |
|  24141252  | Ullas Sarker Tirtha |
|  24241101  |    Rashed Satter    |
|  21201563  | Sharmili Alam Prova |

---

## Project Description

**LensLy** is a web-based e-commerce platform specialized in selling eyewear — frames, sunglasses, and prescription glasses. Customers can browse and purchase frames, select their preferred lens type, and enter their prescription power during checkout.

The platform's standout feature is an **AI-powered face scanning tool** that uses the customer's webcam to detect their face shape and skin tone, then recommends the most suitable frames from current stock using the Gemini API.

Stock, orders, offers, and consultation data are managed through **Google Sheets** as a secondary management layer, allowing non-technical admins to monitor everything from a spreadsheet. A full **admin dashboard** is also available for admins who prefer a GUI, supporting CSV-based stock uploads, offer management, and order tracking. Email notifications (order confirmations, consultation bookings, discount codes) are handled through **Google Apps Script**.

Customers who fill out a doctor consultation request form and own a LensLy frame automatically receive a **10% discount code** for their doctor visit.

---

**20 Features**

| \#  | Feature                                     | Description                                                                                                                                          |
| --- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Product Browsing & Filtering**            | Customers can browse all available eyewear and filter by gender, color, and price range                                                              |
| 2   | **Product Detail Page**                     | Each product has a dedicated page showing images, description, stock status, and pricing                                                             |
| 3   | **AI Face Scan & Frame Suggester**          | Webcam scans the customer's face shape and skin tone and suggests the best matching frames from current stock                                        |
| 4   | **Lens Type & Power Selector**              | While ordering, customers can choose lens type (single vision, bifocal, photochromic) and enter their prescription power (SPH, CYL, AXIS)            |
| 5   | **Add to Cart & Cart Management**           | Customers can add frames to cart, update quantity, and remove items                                                                                  |
| 6   | **Checkout & Order Placement**              | Customers fill in delivery details and place orders which are saved and synced to Google Sheets                                                      |
| 7   | **Dynamic Offer & Discount System**         | Admin can create offers with a name, discount percentage, and time frame which automatically apply to all products sitewide during the active period |
| 8   | **Order Confirmation Email**                | Google Apps Script automatically sends an order confirmation email to the customer upon successful order placement                                   |
| 9   | **Doctor Consultation Request Form**        | Customers can submit a form requesting a physical consultation with a doctor, including their issue and preferred time                               |
| 10  | **Consultation Discount Code Generation**   | Customers who book a consultation and own a LensLy frame automatically receive a 10% discount code on their doctor visit via email                   |
| 11  | **Admin Dashboard Overview**                | Admin sees a summary of total orders, revenue, active offers, low stock alerts, and consultation requests in one place                               |
| 12  | **CSV Stock Upload**                        | Admin can upload a CSV file to bulk add or update product stock which syncs to Google Sheets                                                         |
| 13  | **Manual Stock Management**                 | Admin can individually edit product details, price, and stock count directly from the dashboard                                                      |
| 14  | **Order Management & Status Update**        | Admin can view all placed orders and update their status (Pending → Processing → Shipped → Delivered)                                                |
| 15  | **Offer Management**                        | Admin can create, edit, activate, deactivate, and delete offers from the dashboard                                                                   |
| 16  | **Consultation Management**                 | Admin can view all doctor consultation requests and mark them as contacted or resolved                                                               |
| 17  | **Google Sheets Sync**                      | All stock, orders, active offers, and consultation data automatically reflect in their respective Google Sheets tabs in real time                    |
| 18  | **Product Reviews**                         | Customers can give Star+Text review for each product and the product will show the average of total stars                                            |
| 19  | **Consultation Booking Confirmation Email** | Google Apps Script sends a confirmation email to the customer after a consultation request is submitted, including their discount code               |
| 20  | **Product Search**                          | Customers can search for frames by name, brand, or type directly from the navbar in real time                                                        |

---

## Tech Stack

| Layer                    | Technology                             |
| ------------------------ | -------------------------------------- |
| **Frontend**             | HTML, CSS, Vanilla JavaScript          |
| **Backend**              | Express.js, Node.js (serverless)       |
| **Database**             | Supabase (PostgreSQL)                  |
| **Secondary Data Layer** | Google Sheets API + Google Apps Script |
| **AI**                   | Gemini API                             |
| **Architecture**         | MVC (Model-View-Controller)            |
| **Deployment**           | Vercel                                 |

---

## Architecture

LensLy strictly follows the **MVC (Model-View-Controller)** pattern:

- **Models** (`models/`) — Database connection and schema logic (Supabase client)
- **Views** (`public/`) — Static HTML/CSS/JS frontend views for both customer-facing and admin pages
- **Controllers** (`controllers/`) — Business logic layer handling authentication, orders, offers, stock, consultations, reviews, and AI-powered face scan analysis
- **Routes** (`routes/`) — Serverless route handlers that map API endpoints to controller logic

```
LensLy/
├── api/                # Express master router
├── routes/             # Serverless route handlers
├── config/             # App configuration/constants
├── controllers/         # Business logic (MVC - Controller)
├── middleware/          # Auth middleware (admin/user)
├── models/               # Database connection (MVC - Model)
├── public/               # Frontend views (MVC - View)
├── scripts/             # Dev/CLI utilities
├── services/             # External integrations (Sheets, Apps Script, CSV parsing)
└── utils/                 # Shared utilities (e.g. sanitization)
```

---

## Project Status

This project is being developed as part of the CSE470 Software Engineering course, by a 4-member team. Each team member is individually responsible for a set of assigned features, following the architecture throughout.

---
