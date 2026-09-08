# BUILD A GINGER-STYLE MEDICAL TOURISM PLATFORM USING PERN STACK

## PROJECT TITLE

Build a modern full-stack **Medical Tourism & Healthcare Travel Marketplace** inspired by the general concept of medical-tourism facilitation platforms such as Ginger Healthcare.

The application must be an **original product** with its own branding, UI, content, structure, database, business logic, and user experience.

Do NOT copy Ginger Healthcare's:

* Logo
* Brand name
* Exact UI
* Exact page layout
* Text/content
* Images
* Copyrighted assets
* Proprietary functionality

Use the concept as inspiration, but build an improved and original digital medical-tourism marketplace.

---

# 1. CORE IDEA

The website connects international patients with **verified hospitals in India**.

The main value proposition is:

> **Discover hospitals, treatments and estimated costs, compare available hospitals, submit medical reports, receive medical assistance, and manage your complete medical journey in India.**

The platform should combine:

```text
Medical Tourism
+
Hospital Marketplace
+
Treatment Discovery
+
Hospital Comparison
+
Treatment Cost Estimation
+
Medical Case Management
+
Medical Opinion Workflow
+
Travel Assistance
+
Patient Journey Tracking
```

---

# 2. IMPORTANT PRODUCT DECISION

## REMOVE PUBLIC DOCTOR DIRECTORY

There must NOT be a public:

* Doctor Directory
* Doctor Search
* Doctor Comparison

Patients should primarily discover **hospitals and treatments**.

Doctors can still exist internally in the system for:

* Hospital staff
* Medical opinion workflow
* Patient cases
* Treatment plans
* Appointment handling

But doctors should NOT have a public marketplace directory.

---

# 3. MAIN USER TYPES

Implement these roles:

```text
PATIENT
HOSPITAL
ADMIN
```

Optional:

```text
SUPER_ADMIN
```

Doctors can exist as hospital-managed users/staff but do not need an independent public marketplace role.

---

# 4. MAIN WEBSITE FLOW

Implement this primary user journey:

```text
Patient visits website
        ↓
Select country / search treatment
        ↓
View treatment information
        ↓
See hospitals offering treatment
        ↓
If 2+ hospitals offer treatment
        ↓
Compare hospitals
        ↓
View hospital-specific estimated costs
        ↓
Select hospital
        ↓
Create patient case
        ↓
Upload medical reports
        ↓
Request medical assistance / medical opinion
        ↓
Treatment plan
        ↓
Appointment
        ↓
Visa assistance
        ↓
Travel planning
        ↓
Accommodation
        ↓
Hospital treatment
        ↓
Recovery
        ↓
Follow-up
```

---

# 5. MAIN DIFFERENTIATOR

The most important marketplace feature is:

## HOSPITAL + TREATMENT + COST

Hospitals register on the platform.

Then each hospital can select which treatments it provides.

For each treatment, the hospital can enter its own estimated cost.

Example:

```text
Knee Replacement

Hospital A
₹4,50,000 – ₹6,00,000

Hospital B
₹5,00,000 – ₹7,00,000

Hospital C
₹4,00,000 – ₹5,50,000
```

Patients can then compare the actual hospitals registered on the platform.

---

# 6. CRITICAL COMPARISON RULE

## If 2 or more hospitals offer the same treatment

Show:

```text
Hospital A
Hospital B
Hospital C

[Compare Hospitals]
```

Allow comparison by:

```text
Treatment
Estimated Cost
Hospital Stay
Accreditation
Facilities
International Patient Support
Location
Airport Distance
Hotel Availability
Hospital Rating
Reviews
Treatment Availability
```

---

# 7. IF ONLY ONE HOSPITAL OFFERS THE TREATMENT

This is extremely important.

NEVER create fake hospital data.

Example:

```text
Treatment:
Knee Replacement

Available Hospitals:

Hospital A
₹4,50,000 – ₹6,00,000
Delhi
✓ Treatment Available
```

Show:

> **1 verified hospital currently offers this treatment.**

Do NOT show a fake Hospital B or Hospital C.

Instead provide:

```text
[View Hospital]
[Request Assistance]
[Notify Me When More Hospitals Join]
```

Optionally show:

```text
Platform Benchmark
₹4,00,000 – ₹8,00,000
```

but clearly label it:

> Platform Benchmark

It must never look like another hospital.

---

# 8. IF NO HOSPITAL OFFERS THE TREATMENT

The treatment can still exist in the central treatment catalog.

Show:

```text
No verified hospitals currently offer this treatment through our platform.
```

Buttons:

```text
[Request Assistance]
[Notify Me]
```

Do not remove the treatment from search.

---

# 9. CENTRAL TREATMENT CATALOG

Create a master treatment system.

Examples:

```text
Knee Replacement
Hip Replacement
CABG
Angioplasty
Cataract Surgery
IVF
Kidney Transplant
Liver Transplant
Cancer Treatment
Neurosurgery
Dental Implant
Spine Surgery
```

The central catalog is controlled by ADMIN.

Hospitals cannot create arbitrary duplicate treatment names.

Instead:

```text
Central Treatment
       ↓
Hospital Treatment Relationship
```

---

# 10. HOSPITAL REGISTRATION

Create:

```text
/hospital/register
/hospital/login
```

Hospital registration must include:

```text
Hospital Name
Legal Name
Email
Phone
Password
Country
State
City
Address
Pincode
Website
Established Year
Number of Beds
ICU Beds
Hospital Type
About Hospital
International Patient Support
Languages
Emergency Services
```

Allow:

```text
Hospital Logo
Hospital Gallery
```

---

# 11. HOSPITAL VERIFICATION

Registration should NOT automatically make the hospital verified.

Workflow:

```text
Hospital Registration
        ↓
Profile Submitted
        ↓
Admin Review
        ↓
Verified / Rejected / Needs Changes
```

Statuses:

```text
PENDING_VERIFICATION
VERIFIED
REJECTED
SUSPENDED
```

Only verified hospitals can appear as verified providers.

Display:

```text
✓ Verified Hospital
```

after successful approval.

---

# 12. HOSPITAL DASHBOARD

Create:

```text
/hospital/dashboard
```

Dashboard navigation:

```text
Dashboard
My Profile
Verification
Treatments
Treatment Prices
Doctors/Staff
Patient Cases
Appointments
Treatment Plans
Messages
Reviews
Analytics
Settings
```

---

# 13. HOSPITAL TREATMENT MANAGEMENT

Create:

```text
/hospital/treatments
/hospital/treatments/new
/hospital/treatments/:id/edit
```

Hospital dashboard should contain a treatment-management system.

Example:

```text
Hospital Treatments

----------------------------------------------------
Treatment        Cost             Status
----------------------------------------------------
Knee Replacement ₹4.5L–₹6L       Available
Hip Replacement  ₹5L–₹7L         Available
CABG             ₹6L–₹9L         Unavailable
----------------------------------------------------
```

---

# 14. ADD TREATMENT

Hospital clicks:

```text
+ Add Treatment
```

Form:

```text
Select Treatment
Select Specialty

Treatment Availability
[Available]
[Temporarily Unavailable]
[Not Offered]
[Coming Soon]

Minimum Estimated Cost
Maximum Estimated Cost
Currency

Typical Hospital Stay
Recovery Estimate

Consultation Cost

Package Inclusions
Package Exclusions

Treatment Description

Available Staff/Doctors

Additional Notes
```

---

# 15. HOSPITAL-SPECIFIC TREATMENT COST

Each hospital provides its own estimated cost.

Example:

```text
Hospital:
ABC Hospital

Treatment:
Knee Replacement

Estimated Cost:
₹4,50,000 – ₹6,00,000

Hospital Stay:
5–7 days

Recovery:
4–6 weeks
```

This information is stored separately from the central treatment.

---

# 16. TREATMENT COST CALCULATOR

Create:

```text
/cost-calculator
```

The calculator should use actual hospital treatment pricing data.

User selects:

```text
Country
Treatment
City
Hospital
```

Then show:

```text
Hospital Treatment Estimate
₹5,00,000

Hospital Stay
₹0 / Included

Consultation
₹10,000

Diagnostics
₹30,000

Accommodation
₹50,000

Travel
₹40,000

Visa
₹5,000

Airport Transfer
₹5,000
-----------------------------
Estimated Total
₹6,40,000
```

However, treatment costs entered by hospitals must be treated as **estimates**, not guaranteed final prices.

Always show:

> Estimated cost only. Final cost depends on medical assessment, hospital evaluation and actual treatment requirements.

---

# 17. TREATMENT COST RANGE

Allow hospitals to enter:

```text
Minimum Cost
Maximum Cost
Currency
```

Never force the hospital to provide a fake exact price.

Example:

```text
₹4,50,000 – ₹6,00,000
```

This should appear throughout the website.

---

# 18. TREATMENT PACKAGE

Allow hospitals to optionally create treatment packages.

Example:

```text
Knee Replacement Package

₹5,25,000

Includes:
✓ Surgery
✓ Hospitalization
✓ Nursing
✓ Standard medicines
✓ Routine diagnostics
✓ Follow-up

Excludes:
✗ Travel
✗ Visa
✗ Accommodation
✗ Unexpected complications
```

---

# 19. HOSPITAL PUBLIC PAGE

Route:

```text
/hospitals/:slug
```

Show:

```text
Hospital Image
Hospital Name
City
Country
Verification Badge
About
Accreditation
Facilities
Specialties
International Patient Support
Languages
Treatments Offered
Estimated Treatment Costs
Reviews
Map
```

Important section:

## Treatments Offered

Example:

```text
Orthopedics

Knee Replacement
₹4.5L – ₹6L
✓ Available

Hip Replacement
₹5L – ₹7L
✓ Available

ACL Reconstruction
₹2L – ₹3.5L
Temporarily unavailable
```

---

# 20. TREATMENT PUBLIC PAGE

Route:

```text
/treatments/:slug
```

Show:

```text
Treatment Name
Overview
Procedure Information
Typical Stay
Recovery Information
Estimated Cost Information
FAQs
Hospitals Offering Treatment
```

Main section:

## Hospitals Offering This Treatment

If 3 hospitals:

```text
Hospital A
₹4.5L – ₹6L
Delhi

Hospital B
₹5L – ₹7L
Mumbai

Hospital C
₹4L – ₹5.5L
Chennai

[Compare Hospitals]
```

If 1 hospital:

```text
1 verified hospital currently offers this treatment.

Hospital A
₹4.5L – ₹6L
Delhi

[View Hospital]
```

If 0:

```text
No verified hospitals currently offer this treatment.

[Request Assistance]
[Notify Me]
```

---

# 21. HOSPITAL COMPARISON

Route:

```text
/compare/hospitals
```

Only permit comparison when at least **2 real hospitals** offer the selected treatment.

Compare:

```text
Hospital Name
City
Treatment
Estimated Cost
Treatment Availability
Accreditation
Number of Beds
ICU
Facilities
International Patient Services
Languages
Airport Distance
Nearby Hotels
Hospital Rating
Patient Reviews
Last Cost Update
```

Do not compare doctors publicly.

---

# 22. HOSPITAL COMPARISON SORTING

Provide:

```text
Recommended
Lowest Estimated Cost
Highest Rated
Most Facilities
Closest Airport
Shortest Hospital Stay
```

Do not automatically claim:

> Cheapest hospital = Best hospital.

Any recommendation score should be transparent.

Example:

```text
Platform Match Score

Based on:
Treatment availability
Estimated cost
Facilities
Reviews
Hospital information
Location
International patient support
```

This is a platform comparison score, not medical advice.

---

# 23. PATIENT REGISTRATION

Create:

```text
/register
/login
```

Do not force login for normal browsing.

Unauthenticated users can:

```text
Browse treatments
Browse hospitals
Search
View hospital information
View estimated costs
Read blogs
Compare public hospital information
```

Login should be required for:

```text
Create patient case
Upload medical reports
Request medical opinion
Book appointment
Send private message
Save information
```

After login, return the user to the original page/action where possible.

---

# 24. PATIENT DASHBOARD

Create:

```text
/patient/dashboard
```

Show:

```text
My Cases
Medical Reports
Medical Opinions
Treatment Plans
Appointments
Visa
Travel
Accommodation
Messages
Notifications
Reviews
```

Medical journey:

```text
✓ Case Created
✓ Reports Uploaded
✓ Medical Review
→ Treatment Plan
○ Hospital Selected
○ Appointment
○ Visa
○ Travel
○ Treatment
○ Recovery
○ Follow-up
```

---

# 25. PATIENT CASE

Create:

```text
/patient/cases
/patient/cases/:id
```

Case fields:

```text
Case ID
Patient
Treatment
Preferred City
Preferred Hospital
Patient-provided description
Budget Range
Case Status
Created Date
```

Statuses:

```text
DRAFT
REPORTS_UPLOADED
UNDER_REVIEW
OPINION_REQUESTED
OPINION_RECEIVED
TREATMENT_PLAN_RECEIVED
HOSPITAL_SELECTED
APPOINTMENT_BOOKED
TRAVEL_PLANNED
TREATMENT_IN_PROGRESS
RECOVERY
FOLLOW_UP
COMPLETED
CANCELLED
```

---

# 26. MEDICAL REPORT UPLOAD

Allow:

```text
PDF
JPG
PNG
```

Categories:

```text
Medical Report
Lab Report
MRI
CT
Prescription
Discharge Summary
Previous Treatment Record
Other
```

Medical documents must be private.

Use:

```text
Private Storage
Signed URLs
Authorization
Access Logging
File Validation
```

Never place medical documents inside public static folders.

---

# 27. MEDICAL OPINION WORKFLOW

Even though there is no public doctor directory, doctors can work behind the scenes through the hospital.

Workflow:

```text
Patient Case
      ↓
Hospital receives case
      ↓
Hospital assigns internal doctor/staff
      ↓
Doctor reviews medical reports
      ↓
Medical opinion submitted
      ↓
Patient sees opinion
```

Patient should see:

```text
Medical Opinion
Hospital
Specialty
Doctor/medical reviewer information
Opinion date
Summary
Suggested next steps
Additional tests
Estimated treatment information
```

The medical opinion is a professional clinical service, not an AI diagnosis.

---

# 28. TREATMENT PLAN

Hospital/authorized medical staff can create:

```text
Treatment Plan
Recommended Procedure
Estimated Cost
Expected Stay
Recovery Information
Additional Tests
Notes
```

Patient can view treatment plans associated with their case.

---

# 29. APPOINTMENTS

Allow:

```text
Book
Confirm
Reschedule
Cancel
Complete
```

Appointment types:

```text
Online Consultation
Hospital Consultation
Diagnostic Appointment
Follow-up
```

---

# 30. VISA ASSISTANCE

Create:

```text
/patient/visa
```

Track:

```text
Documents Pending
Invitation Requested
Invitation Received
Application Submitted
Under Review
Approved
Rejected
```

The platform should facilitate visa processing but must not guarantee approval.

---

# 31. TRAVEL PLANNER

Create:

```text
/patient/travel
```

Example:

```text
Day 1
Airport Arrival

Day 2
Hotel Check-in

Day 3
Hospital Consultation

Day 4
Diagnostics

Day 5
Treatment

Day 6–9
Recovery

Day 10
Follow-up

Day 11
Return Travel
```

---

# 32. ACCOMMODATION

Allow the admin/hospital to add:

```text
Hotel
Distance from Hospital
Price Range
Facilities
Room Type
Availability
```

Patient can select accommodation.

---

# 33. AIRPORT TRANSFER

Manage:

```text
Airport
Hotel
Hospital
Transfer Date
Vehicle
Status
```

---

# 34. REAL-TIME CHAT

Use:

```text
Socket.IO
```

Primary conversations:

```text
Patient ↔ Hospital
Patient ↔ Admin/Coordinator
```

Hospital staff may internally communicate with assigned medical staff.

Features:

```text
Text
Attachments
Typing indicator
Read status
Online status
Notifications
```

Apply strict authorization.

---

# 35. NOTIFICATIONS

Notify patients when:

```text
Hospital responds
Case status changes
Medical opinion is available
Treatment plan is available
Appointment changes
Visa status changes
Travel plan changes
New message arrives
Document is reviewed
```

---

# 36. REVIEWS

Only patients with completed eligible cases/appointments can review.

Fields:

```text
Hospital Rating
Medical Care
Communication
Cleanliness
Travel Support
Accommodation
Cost Transparency
Overall Rating
Written Review
```

Display:

```text
Verified Patient
```

only when the platform can verify the completed interaction.

---

# 37. COUNTRY EXPERIENCE

Create:

```text
/countries
/countries/:slug
```

Country information:

```text
Country
Currency
Popular Treatments
Medical Travel Information
Visa Information
Travel Guidance
Languages
Popular Indian Cities
```

Initial demo countries:

```text
Nigeria
Kenya
Tanzania
Uganda
Bangladesh
Nepal
USA
UK
```

Keep country-specific content editable by admin.

---

# 38. CURRENCY CONVERSION

Store hospital treatment costs in INR where appropriate.

Display approximate converted values:

```text
₹5,00,000
≈ $5,900
```

Use current exchange-rate data.

Always label conversions as:

```text
Approximate conversion
```

---

# 39. MAP

Use:

```text
Leaflet
OpenStreetMap
```

Show:

```text
Hospitals
Hotels
Airports
```

Hospital details should display location.

---

# 40. SEARCH SYSTEM

Search:

```text
Treatments
Specialties
Hospitals
Cities
```

Example:

```text
knee
```

Results:

```text
Knee Replacement
ACL Reconstruction
Knee Arthroscopy
Knee Rehabilitation
```

Use PostgreSQL full-text search and indexed filtering.

---

# 41. BLOG / RESOURCES

Pages:

```text
/resources
/resources/:slug
```

Categories:

```text
Medical Tourism
Treatment Guides
Hospital Guides
Travel Guides
Visa Guides
Patient Stories
Healthcare Education
```

Admin manages blog content.

---

# 42. ADMIN PANEL

Create:

```text
/admin/dashboard
```

Admin navigation:

```text
Dashboard
Patients
Hospitals
Hospital Verification
Hospital Treatments
Treatment Catalog
Treatment Prices
Patient Cases
Medical Reports
Medical Opinions
Treatment Plans
Appointments
Visa
Travel
Hotels
Reviews
Countries
Cities
Blog
Analytics
Settings
```

---

# 43. ADMIN HOSPITAL VERIFICATION

Admin can:

```text
View Registration
Review Documents
Approve
Reject
Request Changes
Suspend
Verify
```

---

# 44. ADMIN HOSPITAL TREATMENT APPROVAL

When a hospital adds:

```text
Knee Replacement
₹4.5L – ₹6L
Available
```

the platform can optionally send it for moderation.

Statuses:

```text
PENDING
APPROVED
REJECTED
```

Only approved information should be highlighted as:

```text
✓ Verified Treatment Information
```

---

# 45. HOSPITAL ANALYTICS

Hospital dashboard:

```text
Profile Views
Treatment Views
Patient Requests
Active Cases
Treatment Plans
Appointments
Completed Cases
Average Rating
```

Treatment-specific:

```text
Knee Replacement
Views: 120
Requests: 30
Appointments: 8
Completed: 5
```

---

# 46. PRICE HISTORY

Maintain price history.

Each hospital treatment should track:

```text
Previous Cost
New Cost
Currency
Changed By
Changed Date
Reason
```

Show:

```text
Cost last updated:
08 September 2026
```

This improves transparency.

---

# 47. AVAILABILITY HISTORY

Track:

```text
AVAILABLE
TEMPORARILY_UNAVAILABLE
NOT_OFFERED
COMING_SOON
```

Store changes.

---

# 48. DATABASE

Use:

```text
PostgreSQL
Prisma
```

Core models:

```text
User
Patient
Hospital
HospitalUser
HospitalVerification
Treatment
Specialty
HospitalTreatment
TreatmentCostHistory
TreatmentAvailabilityHistory
PatientCase
MedicalReport
MedicalOpinion
TreatmentPlan
Appointment
VisaApplication
VisaDocument
TravelPlan
TravelItem
Accommodation
AirportTransfer
Conversation
Message
Notification
Review
Country
City
BlogPost
```

Important relationship:

```text
Hospital
   ↓
HospitalTreatment
   ↓
Treatment
```

Use a unique constraint:

```text
hospitalId + treatmentId
```

A hospital cannot add the same treatment twice.

---

# 49. IMPORTANT DATABASE LOGIC

Central catalog:

```text
Treatment
```

Hospital-specific information:

```text
HospitalTreatment
```

Example:

```text
Treatment
--------------------
Knee Replacement

HospitalTreatment
--------------------
Hospital A
₹4.5L–₹6L

HospitalTreatment
--------------------
Hospital B
₹5L–₹7L

HospitalTreatment
--------------------
Hospital C
₹4L–₹5.5L
```

This is the foundation of the comparison engine.

---

# 50. BACKEND ARCHITECTURE

Use:

```text
server/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── routes/
│   ├── middleware/
│   ├── validators/
│   ├── sockets/
│   ├── utils/
│   ├── constants/
│   ├── app.js
│   └── server.js
│
├── prisma/
│   ├── schema.prisma
│   └── seed.js
│
└── package.json
```

Architecture:

```text
Route
 ↓
Controller
 ↓
Service
 ↓
Repository / Prisma
 ↓
PostgreSQL
```

Do not put business logic directly inside route files.

---

# 51. FRONTEND ARCHITECTURE

Use:

```text
client/
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── utils/
│   ├── types/
│   ├── routes/
│   ├── assets/
│   ├── App.jsx
│   └── main.jsx
```

Separate:

```text
Public pages
Patient pages
Hospital pages
Admin pages
```

---

# 52. FRONTEND TECHNOLOGY

Use:

```text
React
Vite
Tailwind CSS
React Router
Axios
TanStack Query
Zustand
React Hook Form
Zod
Socket.IO Client
Lucide React
Recharts
React Leaflet
```

---

# 53. AUTHENTICATION

Implement:

```text
Register
Login
Logout
Forgot Password
Reset Password
Change Password
```

Use:

```text
bcrypt
JWT
HTTP-only secure cookies
```

Implement role-based authorization.

Example:

```text
Patient A
→ Can only access Patient A's cases and documents.

Hospital A
→ Can only manage Hospital A.

Admin
→ Can manage all authorized platform data.
```

---

# 54. SECURITY

Implement:

```text
Helmet
CORS
Rate Limiting
Input Validation
Zod
Secure Cookies
Authorization
File Validation
Private Medical Storage
Signed URLs
Audit Logs
```

Do not expose medical documents publicly.

Do not trust IDs supplied by the frontend without authorization checks.

---

# 55. MEDICAL DISCLAIMER

Throughout the platform, clearly state:

> Information on this website is provided for general informational purposes and does not constitute medical advice, diagnosis or treatment. Medical decisions must be made by qualified healthcare professionals.

AI features must never be presented as diagnosis.

---

# 56. HOMEPAGE DESIGN

Create an original premium healthcare marketplace homepage.

## Header

```text
LOGO

Treatments
Hospitals
How It Works
Medical Travel
Resources
About

Login
Get Started
```

## Hero

Headline:

> **Find Trusted Medical Care in India**

Supporting text:

> Discover treatments, compare verified hospitals, understand estimated costs and manage your healthcare journey in one place.

Main search:

```text
What treatment are you looking for?

[ Search Treatment ]
```

Secondary actions:

```text
[Explore Hospitals]
[Get Medical Assistance]
```

---

# 57. HOMEPAGE SECTIONS

Create:

```text
Hero
Trust Indicators
Popular Treatments
Featured Hospitals
Hospital Comparison Preview
Treatment Cost Calculator
How It Works
Medical Travel Services
Patient Journey
Patient Stories
Popular Destinations
Resources
FAQ
CTA
Footer
```

---

# 58. POPULAR TREATMENTS

Cards:

```text
Cardiology
Orthopedics
Oncology
Neurology
Neurosurgery
IVF
Ophthalmology
Transplant
Dental
Spine
```

Clicking a card opens the relevant treatment page.

---

# 59. FEATURED HOSPITALS

Show actual database hospitals.

Each card:

```text
Hospital Image
Hospital Name
City
Verification Badge
Popular Treatments
Estimated Cost Range
Facilities
Rating
```

Buttons:

```text
View Hospital
Compare
```

Only show Compare when comparison context makes sense.

---

# 60. HOMEPAGE HOSPITAL COMPARISON

If database has at least 2 hospitals providing a popular treatment, dynamically show:

```text
Hospital A
Hospital B
Hospital C
```

Otherwise show:

```text
Only one verified hospital currently offers this treatment.

[View Hospital]
```

Never hard-code fake competitor hospitals.

---

# 61. HOMEPAGE COST CALCULATOR

Include:

```text
Choose Treatment
Choose City
Choose Hospital
```

Then:

```text
Estimated Treatment Cost
```

CTA:

```text
Calculate Estimate
```

---

# 62. HOW IT WORKS

Use five steps:

```text
1. DISCOVER
Find treatments and hospitals

2. COMPARE
Compare verified hospital information and estimated costs

3. SHARE REPORTS
Upload medical documents securely

4. PLAN
Receive medical assistance and organize your treatment journey

5. TRAVEL & TREAT
Manage appointment, travel, treatment and follow-up
```

---

# 63. VISUAL STYLE

Design should be:

```text
Premium
Modern
Trustworthy
Minimal
Healthcare-focused
International
Professional
Clean
```

Use an original design system.

Do not reproduce Ginger's exact visual appearance.

Use:

```text
Large typography
Clean cards
Soft shadows
Rounded sections
Modern icons
Professional healthcare imagery
Subtle animations
Clear CTAs
Responsive layout
```

---

# 64. RESPONSIVE DESIGN

The application must work on:

```text
Mobile
Tablet
Laptop
Desktop
Large Desktop
```

Hospital comparison must have a mobile layout.

Dashboards must have responsive navigation.

---

# 65. DEMO DATA

Create seed data for:

```text
10+ fictional hospitals
20+ treatments
10+ specialties
10+ Indian cities
8+ countries
Treatment costs
Facilities
Reviews
Sample cases
Appointments
```

Use fictional/demo organizations and patients.

Do not use real patient information.

---

# 66. API STRUCTURE

Create APIs:

```text
/api/auth
/api/hospitals
/api/hospitals/me
/api/hospitals/me/treatments
/api/treatments
/api/specialties
/api/cases
/api/reports
/api/opinions
/api/treatment-plans
/api/appointments
/api/visa
/api/travel
/api/accommodations
/api/transfers
/api/conversations
/api/messages
/api/notifications
/api/reviews
/api/countries
/api/cities
/api/blog
/api/admin
```

Public:

```text
GET /api/public/treatments
GET /api/public/treatments/:slug
GET /api/public/treatments/:slug/hospitals
GET /api/public/hospitals
GET /api/public/hospitals/:slug
GET /api/public/hospitals/:id/treatments
GET /api/public/compare/hospitals
```

Hospital:

```text
POST /api/hospitals/register
POST /api/hospitals/login
GET /api/hospitals/me
PUT /api/hospitals/me

GET /api/hospitals/me/treatments
POST /api/hospitals/me/treatments
PUT /api/hospitals/me/treatments/:id
PATCH /api/hospitals/me/treatments/:id/status
DELETE /api/hospitals/me/treatments/:id
```

Admin:

```text
GET /api/admin/hospitals
PATCH /api/admin/hospitals/:id/verify
PATCH /api/admin/hospitals/:id/reject
PATCH /api/admin/hospitals/:id/suspend

GET /api/admin/hospital-treatments
PATCH /api/admin/hospital-treatments/:id/approve
PATCH /api/admin/hospital-treatments/:id/reject
```

---

# 67. API RESPONSE FORMAT

Success:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "Something went wrong",
  "error": {}
}
```

Use correct HTTP status codes.

---

# 68. ENVIRONMENT VARIABLES

Create:

```text
.env.example
```

Include:

```text
DATABASE_URL=
JWT_SECRET=
CLIENT_URL=
SERVER_URL=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASSWORD=

CURRENCY_API_KEY=

AI_API_KEY=
```

Never commit real secrets.

---

# 69. TESTING

Test:

```text
Hospital registration
Hospital verification
Hospital treatment creation
Hospital cost updates
Treatment search
Hospital comparison
Single-hospital state
Zero-hospital state
Patient case creation
Medical report authorization
Appointment creation
Role authorization
```

Especially test this logic:

```text
0 hospitals → unavailable state

1 hospital → single-provider state

2+ hospitals → comparison available
```

---

# 70. IMPORTANT MARKETPLACE RULES

Implement these rules exactly:

### Rule 1

Hospitals register independently.

### Rule 2

Hospitals must be verified before appearing as verified providers.

### Rule 3

Hospitals choose treatments from the central treatment catalog.

### Rule 4

Hospitals provide their own estimated treatment costs.

### Rule 5

Hospitals can change treatment availability.

### Rule 6

Patients see only actual registered hospitals.

### Rule 7

Do not invent competitors.

### Rule 8

If only one hospital offers a treatment, do not show a fake comparison.

### Rule 9

If two or more hospitals offer the treatment, enable comparison.

### Rule 10

If no hospital offers the treatment, still show the treatment and offer assistance/notification.

### Rule 11

Hospital cost values are estimates, not guaranteed final prices.

### Rule 12

Doctors remain internal medical professionals/staff rather than public marketplace listings.

---

# 71. FINAL ARCHITECTURE

The core system should work like:

```text
                   PATIENT

                      ↓

                SEARCH TREATMENT

                      ↓

                TREATMENT CATALOG

                      ↓

              FIND AVAILABLE HOSPITALS

                 ↙    ↓     ↘

          Hospital A  Hospital B  Hospital C

                 ↓    ↓     ↓

             HOSPITAL-SPECIFIC
                TREATMENT
                   +
                COST

                      ↓

           IF 2+ HOSPITALS EXIST

                      ↓

             COMPARE HOSPITALS

                      ↓

              SELECT HOSPITAL

                      ↓

               CREATE CASE

                      ↓

             UPLOAD REPORTS

                      ↓

             MEDICAL REVIEW

                      ↓

              TREATMENT PLAN

                      ↓

                APPOINTMENT

                      ↓

            VISA + TRAVEL + HOTEL

                      ↓

                  TREATMENT

                      ↓

                 RECOVERY

                      ↓

                 FOLLOW-UP
```

---

# 72. DEVELOPMENT PRIORITY

Build in this order:

## Phase 1

```text
Project setup
PostgreSQL
Prisma
Authentication
Roles
Hospital registration
Admin verification
Treatment catalog
Hospital treatment management
Hospital pricing
Public treatments
Public hospitals
```

## Phase 2

```text
Hospital comparison
Treatment cost calculator
Patient registration
Patient dashboard
Patient cases
Medical report upload
```

## Phase 3

```text
Medical opinion
Treatment plans
Appointments
Chat
Notifications
Reviews
```

## Phase 4

```text
Visa
Travel planner
Accommodation
Airport transfers
Maps
Currency
Analytics
```

## Phase 5

```text
AI-assisted navigation
AI document summarization
Advanced recommendations
Multilingual support
```

---

# 73. FINAL GOAL

The finished application should feel like a real **international medical-tourism marketplace**, not a simple hospital directory.

The main experience should be:

```text
DISCOVER
   ↓
COMPARE
   ↓
ESTIMATE COST
   ↓
SELECT HOSPITAL
   ↓
CREATE CASE
   ↓
SHARE REPORTS
   ↓
GET MEDICAL ASSISTANCE
   ↓
PLAN JOURNEY
   ↓
TRAVEL
   ↓
TREATMENT
   ↓
RECOVERY
```

The platform's strongest differentiator is:

> **Hospitals register themselves, select the treatments they provide, publish estimated treatment costs, and patients can compare real verified hospitals when multiple providers are available.**

Build all functionality as real full-stack functionality using:

```text
React
Node.js
Express.js
PostgreSQL
Prisma
JWT
Socket.IO
REST APIs
RBAC
Secure file storage
```

Do not make major features frontend-only or use fake local state in place of database/API integration.
# 73. FOCUSED MVP SCOPE

The first working version MUST focus on the core medical-tourism marketplace.

Do NOT build every advanced feature in the MVP.

The MVP goal is:

> **A patient can discover a treatment, find hospitals that offer it, compare hospitals when multiple providers exist, see hospital-specific estimated costs, create a medical case, upload reports, and receive/manage a hospital response.**

---

# MVP USER ROLES

Implement only these roles initially:

```text
PATIENT
HOSPITAL
ADMIN
```

Do not create a separate public doctor marketplace.

Doctors may exist internally as hospital staff, but they are NOT part of the MVP public discovery system.

---

# MVP FEATURES

## 1. Public Homepage

Build:

```text
/
```

Include:

* Original healthcare branding
* Hero section
* Treatment search
* Popular treatments
* Featured hospitals
* Hospital comparison CTA
* How it works
* Cost-estimate CTA
* Medical disclaimer
* Footer

Primary CTA:

```text
Find Treatment
```

Secondary CTA:

```text
Register Your Hospital
```

---

# 2. Treatment Catalog

Build:

```text
/treatments
/treatments/:slug
```

Patients can:

* Search treatments
* Filter by specialty
* View treatment details
* See estimated/general information
* See hospitals offering the treatment

Admin manages the central treatment catalog.

Example:

```text
Knee Replacement
Hip Replacement
CABG
Angioplasty
IVF
Cataract Surgery
```

---

# 3. Hospital Registration

Build:

```text
/hospital/register
/hospital/login
/hospital/dashboard
```

Hospitals can register and submit:

```text
Hospital Name
Email
Phone
Address
City
State
Country
Website
Hospital Type
Beds
ICU Beds
About
Facilities
International Patient Support
```

Hospital registration status:

```text
PENDING_VERIFICATION
VERIFIED
REJECTED
SUSPENDED
```

Only ADMIN can verify a hospital.

---

# 4. Hospital Profile

Hospital can manage:

```text
Logo
Images
Description
Address
Facilities
Accreditation
Languages
International Patient Services
Bed Information
Contact Information
```

Public page:

```text
/hospitals/:slug
```

---

# 5. Hospital Treatment Management

This is a CORE MVP FEATURE.

Hospital dashboard:

```text
/hospital/treatments
```

Hospital can:

```text
Add Treatment
Edit Treatment
Enable Treatment
Disable Treatment
Update Cost
Update Availability
```

Hospital selects a treatment from the central catalog.

Hospital CANNOT create duplicate treatment names independently.

---

# 6. Hospital-Specific Treatment Cost

For every hospital-treatment relationship, allow:

```text
Minimum Estimated Cost
Maximum Estimated Cost
Currency
Hospital Stay
Recovery Estimate
Consultation Estimate
Package Inclusions
Package Exclusions
Availability
```

Example:

```text
Knee Replacement

Hospital A
₹4,50,000 – ₹6,00,000
Available
5–7 days
```

Display a disclaimer:

> Estimated cost only. Final cost depends on medical assessment and the hospital's final quotation.

---

# 7. Hospital Verification

Admin page:

```text
/admin/hospitals
```

Admin can:

```text
View Registration
Review Hospital
Approve
Reject
Suspend
```

Only verified hospitals appear in the public marketplace as verified providers.

---

# 8. Hospital Search

Build:

```text
/hospitals
```

Search/filter by:

```text
City
Treatment
Specialty
Facilities
Accreditation
Availability
```

Hospital cards should display:

```text
Hospital Name
City
Verified Badge
Popular Treatments
Facilities
Rating
```

---

# 9. Hospital-Treatment Discovery

When a patient opens a treatment:

```text
/treatments/knee-replacement
```

show:

```text
Hospitals Offering Knee Replacement
```

Example:

```text
Hospital A
₹4.5L – ₹6L
Delhi

Hospital B
₹5L – ₹7L
Mumbai

Hospital C
₹4L – ₹5.5L
Chennai
```

---

# 10. HOSPITAL COMPARISON

This is the PRIMARY MVP DIFFERENTIATOR.

Enable comparison ONLY when **2 or more verified hospitals actually offer the selected treatment**.

Comparison fields:

```text
Hospital
City
Treatment
Estimated Cost
Availability
Hospital Stay
Accreditation
Facilities
International Patient Support
Rating
Reviews
```

Example:

```text
                  Hospital A    Hospital B

Cost              ₹4.5–6L       ₹5–7L
City              Delhi         Mumbai
Stay              5–7 days      6–8 days
Availability      Available     Available
Accreditation     JCI           NABH
```

Do NOT compare doctors publicly.

---

# 11. SINGLE-HOSPITAL LOGIC

If only ONE verified hospital offers a treatment:

```text
Knee Replacement

1 verified hospital currently offers this treatment.

Hospital A
₹4.5L – ₹6L
Delhi

[View Hospital]
[Request Assistance]
[Notify Me When More Hospitals Are Available]
```

Do NOT create fake Hospital B or Hospital C.

Do NOT show a fake comparison.

Optionally display:

```text
Platform Benchmark
```

only when genuine benchmark data exists.

---

# 12. ZERO-HOSPITAL LOGIC

If no verified hospital currently offers the treatment:

```text
No verified hospitals currently offer this treatment.
```

Show:

```text
[Request Assistance]
[Notify Me]
```

Keep the treatment visible in the central catalog.

---

# 13. TREATMENT COST CALCULATOR

Keep the MVP version simple.

Build:

```text
/cost-calculator
```

Inputs:

```text
Treatment
Hospital
```

Optional:

```text
Accommodation
Travel
Airport Transfer
```

For the first MVP, the calculator should primarily calculate:

```text
Hospital Treatment Estimate
+
Consultation Estimate
+
Optional Accommodation
+
Optional Travel
```

Display:

```text
Estimated Total
```

Always clearly label the result:

> This is an estimate, not a final medical quotation.

---

# 14. PATIENT REGISTRATION

Build:

```text
/register
/login
```

Patients can:

* Register
* Login
* Logout
* Reset password

Do not require login merely to browse treatments or hospitals.

Require login for:

```text
Create Case
Upload Report
Request Assistance
Book Appointment
Send Private Message
```

---

# 15. PATIENT CASE

Build:

```text
/patient/cases
/patient/cases/:id
```

Patient can:

```text
Create Case
Select Treatment
Select Preferred Hospital
Enter Patient-Provided Information
Upload Reports
Submit Case
```

Case statuses:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
RESPONDED
HOSPITAL_SELECTED
COMPLETED
CANCELLED
```

Keep the workflow simple in MVP.

---

# 16. MEDICAL REPORT UPLOAD

Support:

```text
PDF
JPG
PNG
```

Patient can upload reports to their case.

Store metadata in PostgreSQL.

Medical files must be stored privately.

Implement:

```text
File validation
Authorization
Private storage
Signed access
```

Patient can only access their own reports.

Authorized hospital staff can only access reports associated with their assigned/authorized cases.

---

# 17. HOSPITAL CASE MANAGEMENT

Hospital dashboard should contain:

```text
/hospital/cases
```

Hospital sees:

```text
New Cases
Pending Cases
Active Cases
Completed Cases
```

Hospital can:

```text
Open Case
Review Patient Information
Review Medical Reports
Accept Case
Reject Case
Request More Information
Send Response
```

---

# 18. SIMPLE MEDICAL RESPONSE

Do not build the full advanced multi-doctor opinion system in MVP.

Instead, allow the hospital to send a basic response:

```text
Hospital Response

Case Summary
Recommended Next Step
Estimated Treatment Cost
Estimated Hospital Stay
Additional Information Required
Hospital Contact
```

This keeps the medical workflow realistic without making the MVP too large.

---

# 19. APPOINTMENT — MVP VERSION

Include a basic appointment request.

Patient selects:

```text
Preferred Date
Preferred Time
Hospital
Case
```

Status:

```text
REQUESTED
CONFIRMED
CANCELLED
COMPLETED
```

Hospital can accept/reject/reschedule.

Do NOT build complex calendar synchronization in MVP.

---

# 20. PATIENT DASHBOARD — MVP

Build:

```text
/patient/dashboard
```

Show:

```text
My Cases
My Reports
Hospital Responses
Appointments
Saved Hospitals
Notifications
```

Patient journey:

```text
✓ Case Created
✓ Reports Uploaded
→ Hospital Review
○ Appointment
○ Treatment
```

---

# 21. ADMIN DASHBOARD — MVP

Build:

```text
/admin/dashboard
```

Show:

```text
Registered Patients
Registered Hospitals
Verified Hospitals
Treatments
Active Cases
Pending Hospital Approvals
Appointments
```

Admin navigation:

```text
Dashboard
Hospitals
Hospital Verification
Treatments
Hospital Treatments
Patients
Cases
Appointments
Reviews
Settings
```

---

# 22. REVIEWS — MVP

Allow reviews only after a completed appointment/case.

Fields:

```text
Overall Rating
Hospital Rating
Communication
Treatment Experience
Written Review
```

Display:

```text
Verified Patient
```

when the completed interaction is verified by the system.

---

# 23. REAL-TIME CHAT — MVP

Keep chat simple.

Use:

```text
Socket.IO
```

Support:

```text
Patient ↔ Hospital
```

Features:

```text
Text Messages
Message Timestamp
Read Status
Basic Notifications
```

Do NOT build advanced file-sharing chat in the first MVP unless required.

---

# 24. NOTIFICATIONS — MVP

Implement in-app notifications for:

```text
Hospital Registration Approved
Case Status Changed
Hospital Responded
Appointment Confirmed
New Message
```

---

# 25. DATABASE — MVP MODELS

Only create the models required for the MVP first:

```text
User
Patient
Hospital
HospitalVerification
Treatment
Specialty
HospitalTreatment
HospitalTreatmentPriceHistory
HospitalTreatmentAvailabilityHistory
PatientCase
MedicalReport
HospitalResponse
Appointment
Conversation
Message
Notification
Review
Country
City
```

Do NOT create unnecessary models until their feature is implemented.

---

# 26. CORE MVP DATABASE RELATIONSHIP

The most important relationship is:

```text
Treatment
     ↓
HospitalTreatment
     ↓
Hospital
```

Example:

```text
Knee Replacement
       ↓
HospitalTreatment
       ├── Hospital A → ₹4.5L–₹6L
       ├── Hospital B → ₹5L–₹7L
       └── Hospital C → ₹4L–₹5.5L
```

This relationship powers:

```text
Treatment Search
Hospital Search
Treatment Availability
Cost Display
Hospital Comparison
Cost Calculator
```

---

# 27. MVP COMPARISON ALGORITHM

Implement:

```text
function getTreatmentHospitals(treatmentId)
```

Return only:

```text
VERIFIED hospitals
+
APPROVED HospitalTreatment records
+
AVAILABLE status
```

Then:

```text
if count === 0
    show "No verified hospitals currently offer this treatment"

if count === 1
    show single hospital
    disable comparison

if count >= 2
    enable comparison
```

This logic MUST be implemented on the backend, not only in React.

---

# 28. MVP SECURITY

Implement:

```text
JWT authentication
HTTP-only cookies
bcrypt password hashing
RBAC
Input validation
Helmet
CORS
Rate limiting
Secure file upload
Private medical documents
Authorization checks
```

Important:

```text
Patient A
≠
Patient B
```

No user should be able to access another patient's private medical information by changing an ID in the URL.

---

# 29. MVP RESPONSIVE UI

The MVP MUST be fully responsive.

Support:

```text
Mobile
Tablet
Desktop
```

Important pages:

```text
Homepage
Treatment Directory
Treatment Details
Hospital Directory
Hospital Details
Hospital Comparison
Cost Calculator
Login/Register
Patient Dashboard
Hospital Dashboard
Admin Dashboard
```

---

# 30. MVP UI PRIORITY

Spend the most design effort on:

```text
Homepage
Treatment Search
Hospital Cards
Hospital Details
Hospital Comparison
Cost Calculator
Patient Case
Hospital Dashboard
```

These are the pages that demonstrate the product's unique value.

---

# 31. FEATURES OUTSIDE MVP

Do NOT prioritize these during the first implementation:

```text
Advanced AI
AI Diagnosis
AI Treatment Recommendation
AI Medical Diagnosis
Advanced Travel Planner
Flight Booking
Hotel Booking Integration
Visa API Integration
Payment Gateway
Multilingual System
Mobile Application
Advanced Analytics
Insurance Integration
Complex Calendar Integration
Advanced Family Portal
Advanced Doctor Marketplace
```

These can be added after the MVP is stable.

---

# 32. PHASE 2 AFTER MVP

After the MVP works end-to-end, add:

```text
Advanced medical opinion workflow
Treatment-plan comparison
Advanced appointment scheduling
Visa assistance
Travel planner
Accommodation
Airport transfers
Currency conversion
Advanced notifications
Family/attendant access
Hospital analytics
Doctor internal workflows
```

---

# 33. PHASE 3

Then add:

```text
AI-assisted treatment navigation
AI document summarization
Recommendation engine
Advanced analytics
Multilingual support
Insurance integrations
Payment system
```

AI must remain non-diagnostic and must not replace qualified medical professionals.

---

# 34. MVP SUCCESS CRITERIA

The MVP is considered complete only when this full flow works:

```text
Hospital registers
      ↓
Admin verifies hospital
      ↓
Hospital adds treatment
      ↓
Hospital enters estimated treatment cost
      ↓
Treatment becomes available
      ↓
Patient searches treatment
      ↓
Patient sees hospital
      ↓
If 2+ hospitals exist
      ↓
Patient compares hospitals
      ↓
Patient sees hospital-specific costs
      ↓
Patient chooses hospital
      ↓
Patient creates case
      ↓
Patient uploads medical report
      ↓
Hospital receives case
      ↓
Hospital reviews case
      ↓
Hospital sends response
      ↓
Patient receives notification
      ↓
Patient requests appointment
      ↓
Hospital confirms appointment
      ↓
Patient leaves review after completion
```

This end-to-end workflow is the PRIMARY MVP objective.

---

# 35. MVP PROJECT POSITIONING

The finished MVP should be presented as:

> **A digital medical-tourism marketplace where international patients can discover treatments, find verified hospitals, compare real hospital options and estimated costs, and begin managing their treatment journey online.**

Do not describe the MVP as a full hospital-management or travel-booking system.

The MVP is primarily:

```text
TREATMENT DISCOVERY
        +
HOSPITAL MARKETPLACE
        +
COST TRANSPARENCY
        +
HOSPITAL COMPARISON
        +
PATIENT CASE MANAGEMENT
```

Build this core experience first, make it polished and reliable, and only then expand into advanced medical-travel features.
# 33. COLLAPSED MVP INTO RELEASE MILESTONES

Build the application through five controlled releases.

Do NOT attempt to implement the entire platform at once.

Each release must leave the project in a runnable and testable state.

---

# RELEASE 1 — FOUNDATION

## Goal

Create the complete technical foundation of the platform.

## Build

### Project setup

```text
Frontend:
React + Vite

Backend:
Node.js + Express

Database:
PostgreSQL + Prisma
```

### Frontend foundation

Implement:

```text
React Router
Tailwind CSS
Axios
TanStack Query
Zustand
Reusable UI components
Public layout
Patient layout
Hospital layout
Admin layout
```

### Backend foundation

Implement:

```text
Express server
Environment configuration
Error handling
Logging
API structure
Prisma
Database connection
```

### Authentication

Implement:

```text
Patient registration/login
Hospital registration/login
Admin login
Logout
Password hashing
JWT
HTTP-only cookies
Protected routes
Role-based authorization
```

Roles:

```text
PATIENT
HOSPITAL
ADMIN
```

### Database foundation

Create initial models:

```text
User
Patient
Hospital
HospitalVerification
Treatment
Specialty
HospitalTreatment
Country
City
```

### Basic layouts

Create:

```text
Homepage
Login
Register
Patient dashboard shell
Hospital dashboard shell
Admin dashboard shell
```

## Release 1 success criteria

The following must work:

```text
User registers
      ↓
Login
      ↓
JWT/session established
      ↓
Role identified
      ↓
Correct dashboard opened
```

Hospital and patient accounts must be isolated by role.

---

# RELEASE 2 — HOSPITAL MARKETPLACE

## Goal

Make the hospital side fully functional.

The result should be:

> A hospital can register, get verified, create its profile, select treatments it provides, and enter estimated treatment costs.

---

## Hospital registration

Build:

```text
/hospital/register
/hospital/login
/hospital/dashboard
/hospital/profile
/hospital/verification
```

Hospital registration fields:

```text
Hospital Name
Email
Phone
Country
State
City
Address
Website
Hospital Type
Beds
ICU Beds
Description
International Patient Support
Languages
```

---

## Hospital verification

Workflow:

```text
REGISTER
   ↓
PENDING
   ↓
ADMIN REVIEW
   ↓
VERIFIED / REJECTED
```

Admin can:

```text
Approve
Reject
Request Changes
Suspend
```

Only verified hospitals should be displayed as verified providers.

---

## Treatment catalog

Admin creates the central treatment catalog:

```text
Knee Replacement
Hip Replacement
CABG
Angioplasty
Cataract Surgery
IVF
etc.
```

Treatments belong to specialties.

---

## Hospital treatment management

Hospital dashboard:

```text
/hospital/treatments
```

Hospital can:

```text
Add Treatment
Edit Treatment
Enable Treatment
Disable Treatment
Update Cost
Update Availability
```

Hospital selects from the central treatment catalog.

---

## Hospital-specific treatment data

For each hospital-treatment relationship:

```text
Treatment
Availability
Minimum Estimated Cost
Maximum Estimated Cost
Currency
Hospital Stay
Recovery Estimate
Consultation Estimate
Package Inclusions
Package Exclusions
```

Example:

```text
Knee Replacement

Hospital A
₹4,50,000 – ₹6,00,000
Available
5–7 days
```

---

## Public hospital pages

Build:

```text
/hospitals
/hospitals/:slug
```

Display:

```text
Hospital
City
Verification
Facilities
Treatments
Estimated Costs
Rating
Reviews
```

## Release 2 success criteria

This complete workflow must work:

```text
Hospital Register
      ↓
Admin Verify
      ↓
Hospital Profile Complete
      ↓
Hospital Selects Treatment
      ↓
Hospital Enters Cost
      ↓
Treatment Becomes Available
      ↓
Public Patient Can See Hospital
```

---

# RELEASE 3 — PATIENT DISCOVERY & COMPARISON

## Goal

Build the core marketplace experience.

The result should be:

> A patient can search for a treatment and see the real hospitals offering it, including hospital-specific estimated costs.

---

## Treatment directory

Build:

```text
/treatments
/treatments/:slug
```

Features:

```text
Search
Specialty filter
City filter
Pagination
```

---

## Hospital directory

Build:

```text
/hospitals
```

Filters:

```text
Treatment
City
Specialty
Facilities
Accreditation
Availability
```

---

## Treatment → Hospital discovery

When the patient opens a treatment:

```text
Treatment
    ↓
Find HospitalTreatment
    ↓
Find VERIFIED Hospital
    ↓
Filter AVAILABLE status
    ↓
Display hospitals
```

Example:

```text
Knee Replacement

Hospital A
₹4.5L – ₹6L
Delhi

Hospital B
₹5L – ₹7L
Mumbai

Hospital C
₹4L – ₹5.5L
Chennai
```

---

# IMPORTANT COMPARISON LOGIC

Implement this logic in the backend.

```text
if availableHospitalCount === 0
```

Show:

```text
No verified hospitals currently offer this treatment.
```

Actions:

```text
Request Assistance
Notify Me
```

---

```text
if availableHospitalCount === 1
```

Show:

```text
1 verified hospital currently offers this treatment.
```

Display only the real hospital.

Do NOT create a fake competitor.

Comparison should be disabled.

---

```text
if availableHospitalCount >= 2
```

Enable:

```text
Compare Hospitals
```

---

# Hospital comparison

Build:

```text
/compare/hospitals
```

Compare:

```text
Hospital
City
Treatment
Estimated Cost
Availability
Hospital Stay
Accreditation
Facilities
International Patient Support
Rating
Reviews
```

Allow sorting:

```text
Recommended
Lowest Cost
Highest Rated
Closest
Most Facilities
```

Do NOT expose public doctor comparison.

---

# Treatment cost calculator

Build:

```text
/cost-calculator
```

Minimum inputs:

```text
Treatment
Hospital
```

Calculate from the hospital's real treatment data.

Example:

```text
Hospital Treatment
₹5,00,000

Consultation
₹10,000

Diagnostics
₹30,000

Estimated Total
₹5,40,000
```

Always display:

```text
Estimated cost only.
Final cost depends on medical assessment and the hospital's final quotation.
```

---

## Release 3 success criteria

This flow must work:

```text
Patient
 ↓
Search Treatment
 ↓
Open Treatment
 ↓
See Actual Hospitals
 ↓
See Hospital-Specific Costs
 ↓
0 / 1 / 2+ Hospital Logic
 ↓
Compare if 2+
 ↓
Calculate Estimated Cost
```

This is the **core marketplace release**.

---

# RELEASE 4 — PATIENT CASE WORKFLOW

## Goal

Turn the marketplace into an actual healthcare platform.

The result should be:

> A patient can choose a hospital, create a case, securely submit reports, and receive a hospital response.

---

## Patient dashboard

Build:

```text
/patient/dashboard
```

Sections:

```text
My Cases
Medical Reports
Hospital Responses
Appointments
Notifications
Saved Hospitals
```

---

# Patient case

Build:

```text
/patient/cases
/patient/cases/:id
```

Patient can:

```text
Create Case
Select Treatment
Select Hospital
Enter patient-provided information
Upload Reports
Submit Case
```

Statuses:

```text
DRAFT
SUBMITTED
UNDER_REVIEW
RESPONDED
HOSPITAL_SELECTED
COMPLETED
CANCELLED
```

---

# Medical report upload

Support:

```text
PDF
JPG
PNG
```

Store:

```text
File Metadata → PostgreSQL
Actual File → Private Storage
```

Implement:

```text
File validation
Authorization
Private access
Signed URLs
Access logging
```

Never make medical documents public.

---

# Hospital case management

Build:

```text
/hospital/cases
```

Hospital can:

```text
View assigned cases
Open case
View authorized reports
Accept case
Reject case
Request more information
Send response
```

---

# Hospital response

Hospital can submit:

```text
Case Response
Recommended Next Step
Estimated Treatment Cost
Estimated Hospital Stay
Additional Information Required
Notes
```

Do not make this an automated diagnosis system.

---

# Appointment

Build basic appointment workflow:

```text
Patient requests appointment
        ↓
Hospital confirms
        ↓
Appointment scheduled
```

Statuses:

```text
REQUESTED
CONFIRMED
CANCELLED
COMPLETED
```

Do not build advanced calendar integrations yet.

---

# Notifications

Implement:

```text
Hospital response
Case status change
Appointment confirmation
New message
```

Use in-app notifications.

---

# Basic chat

Use Socket.IO.

MVP communication:

```text
Patient ↔ Hospital
```

Support:

```text
Text
Timestamp
Read status
```

Keep the first chat implementation simple.

---

# Reviews

After completed interaction:

```text
Patient
   ↓
Review Hospital
```

Fields:

```text
Overall Rating
Hospital Rating
Communication
Treatment Experience
Written Review
```

---

## Release 4 success criteria

This full workflow must work:

```text
Patient selects hospital
       ↓
Creates case
       ↓
Uploads medical report
       ↓
Hospital receives case
       ↓
Hospital reviews case
       ↓
Hospital sends response
       ↓
Patient receives notification
       ↓
Patient requests appointment
       ↓
Hospital confirms appointment
       ↓
Patient can later review
```

---

# RELEASE 5 — MVP PRODUCTION RELEASE

## Goal

Turn Releases 1–4 into one polished, secure final-year project/demo.

Do NOT add major new functionality here.

Focus on quality.

---

# UI/UX POLISH

Improve:

```text
Homepage
Treatment search
Hospital cards
Hospital pages
Comparison page
Cost calculator
Patient dashboard
Hospital dashboard
Admin dashboard
```

Ensure:

```text
Responsive
Accessible
Fast
Consistent
Professional
```

---

# SECURITY HARDENING

Verify:

```text
JWT security
HTTP-only cookies
Password hashing
RBAC
Ownership checks
Rate limiting
Helmet
CORS
Input validation
File validation
Private medical files
Authorization
```

Test that:

```text
Patient A cannot access Patient B's case.

Patient A cannot access Patient B's reports.

Hospital A cannot access Hospital B's private cases.

Hospital A cannot edit Hospital B's treatment prices.

Unverified hospitals cannot appear as verified providers.
```

---

# DATA VALIDATION

Validate:

```text
Email
Phone
Costs
Treatment IDs
Hospital IDs
Uploaded files
Appointment data
Case data
```

Reject invalid requests on the backend.

Never rely only on React validation.

---

# ERROR STATES

Every important page must support:

```text
Loading
Success
Empty
Error
Unauthorized
Forbidden
Not Found
Network Failure
```

Examples:

```text
No hospitals found.

Only one verified hospital currently offers this treatment.

No verified hospital currently offers this treatment.
```

---

# DEMO DATA

Seed:

```text
10 fictional hospitals
20+ treatments
10 specialties
10 Indian cities
8 countries
Hospital-treatment records
Estimated prices
Facilities
Reviews
Sample cases
Appointments
```

Include enough data to demonstrate:

```text
0 hospital case
1 hospital case
2+ hospital comparison case
```

---

# ADMIN FINAL CONTROLS

Admin should be able to manage:

```text
Hospitals
Hospital verification
Treatments
Hospital treatments
Treatment prices
Patients
Cases
Appointments
Reviews
Countries
Cities
```

---

# TESTING

Before MVP release, test:

```text
Authentication
RBAC
Hospital registration
Hospital verification
Treatment creation
Hospital treatment creation
Hospital cost updates
Treatment search
Hospital search
0 hospital logic
1 hospital logic
2+ hospital comparison
Cost calculator
Patient case creation
Medical report permissions
Hospital response
Appointment
Notifications
Chat
Reviews
```

---

# RELEASE ORDER

The required implementation order is:

```text
RELEASE 1
FOUNDATION
     ↓
RELEASE 2
HOSPITAL MARKETPLACE
     ↓
RELEASE 3
PATIENT DISCOVERY + COMPARISON
     ↓
RELEASE 4
PATIENT CASE WORKFLOW
     ↓
RELEASE 5
POLISH + SECURITY + MVP RELEASE
```

---

# MVP DEFINITION

The MVP is complete ONLY when this end-to-end journey works:

```text
Hospital Registers
        ↓
Admin Verifies Hospital
        ↓
Hospital Adds Treatment
        ↓
Hospital Adds Estimated Cost
        ↓
Treatment Becomes Available
        ↓
Patient Searches Treatment
        ↓
Patient Sees Hospital(s)
        ↓
0 / 1 / 2+ Logic Works
        ↓
Patient Compares Hospitals if 2+
        ↓
Patient Uses Cost Calculator
        ↓
Patient Selects Hospital
        ↓
Patient Creates Case
        ↓
Patient Uploads Medical Report
        ↓
Hospital Receives Case
        ↓
Hospital Sends Response
        ↓
Patient Receives Notification
        ↓
Patient Requests Appointment
        ↓
Hospital Confirms Appointment
        ↓
Patient Completes Review
```

---

# FEATURES EXPLICITLY DEFERRED

Do NOT include these in the core MVP release:

```text
Advanced AI
AI diagnosis
AI treatment recommendation
Flight booking
Hotel booking integrations
Visa API integrations
Payment gateway
Insurance integration
Multilingual system
Mobile app
Advanced family portal
Advanced travel automation
Advanced calendar integrations
Public doctor directory
Public doctor comparison
Complex doctor marketplace
```

These belong in future releases after the MVP is stable.

---

# FINAL MVP POSITIONING

Present the completed MVP as:

> **A digital medical-tourism marketplace where international patients can discover treatments, find verified hospitals, compare real hospitals when multiple providers are available, view hospital-specific estimated costs, securely submit medical cases, and manage the first stages of their treatment journey.**
