# Welcome to TrackFlow

## AI Engineering · 4Geeks Academy — Company Briefing

---

TrackFlow is a last-mile delivery and warehouse management company founded in 2009 in Los Angeles, United States. It operates in two markets — the United States and Spain — with warehouses in Los Angeles and Zaragoza. The company has approximately 130 employees and annual revenue of around 9 million euros.

TrackFlow exists because e-commerce brands are good at making and selling products, but not at getting those products to the customer's door. That is what TrackFlow does for them: stores their inventory, prepares and packs orders, ships them through a network of carriers, and manages returns when products come back. For brands working with TrackFlow, the entire logistics operation — from the moment an order is placed to the moment it is delivered or returned — is TrackFlow's responsibility.

## How the company is organized

TrackFlow is led by **Thomas Harry**, founder and CEO, based in Los Angeles. The company has a technology office in Zaragoza, Spain, where CTO Andrés Kim and most of the technical team are located. Operations, commercial, and customer service teams are distributed between the two countries.

The company is organized into the following areas:

**Warehouse Operations** is where the physical work of logistics happens. Ana Whitfield oversees the two warehouses — one in Los Angeles, one in Zaragoza — and the approximately 70 workers who run them. Every day, hundreds of orders arrive, are picked from shelves, packed, and handed off to carriers. The two warehouses run on different systems and do not have shared inventory visibility.

**Last Mile & Carrier Management** manages relationships with the 8 carriers TrackFlow works with across both countries — including UPS, FedEx, MRW, and SEUR. Carlos Vega coordinates which carrier handles each shipment, tracks deliveries, and manages the incidents that inevitably occur: lost packages, failed deliveries, incorrect addresses. Today, most of this is done manually, carrier by carrier.

**Reverse Logistics** manages what happens when a product comes back. Sofía Ramos leads this team of five people. Returns represent between 18% and 25% of total volume depending on the client and country, and each return involves a chain of decisions — approve or reject, pick up or not, refurbish or discard — that currently all go through human review.

**Customer Experience** is the first line between TrackFlow and the people it serves. Valentina Cruz manages 15 agents in Los Angeles and Zaragoza who handle inquiries from both brands (who want to know how their operation is going) and end consumers (who want to know where their package is). The vast majority of inquiries are repetitive, and right now each one is answered by a person.

**Commercial & Client Relations** manages TrackFlow's brand client portfolio. Miguel Torres leads the account managers and business development team, responsible for retaining current clients and winning new ones. Contracts are annual, and renewals are won or lost based on whether clients feel their logistics operation is working well.

**Technology** is the team that builds and maintains everything. Andrés Kim leads from Zaragoza a team of developers, data engineers, and systems people. The current architecture is a patchwork: two different warehouse systems, an ERP from the early 2010s, and integrations between them that were built quickly and never well documented. When something fails, the team finds out through a WhatsApp message from someone in operations.

**Executive Management** falls to Thomas, who runs the business from Los Angeles with a consolidated weekly report that each director prepares manually — a process that consumes hours every Sunday night and still delivers data that is already one or two days old.

## Where the company is today

TrackFlow has good clients, a competent operations team, and a clear value proposition. What it lacks is the infrastructure to manage a two-country logistics operation at scale. The two warehouses cannot see each other's inventory. Carrier performance data does not exist in any structured form. Returns are approved or rejected one by one. Client inquiries are answered by agents consulting a Word document in Google Drive. The CEO makes decisions based on a hand-assembled report.

The consequence is that TrackFlow is slower, more error-prone, and less profitable than it needs to be — and the gap grows as competitors invest in automation.

Daniel has created an internal unit called **TrackFlow Tech** with a clear mandate: build the systems, integrations, and intelligent automation that will allow TrackFlow to operate as the modern logistics company it needs to be.

**You are part of that unit.**

---

## Departments and their problems

### 🚚 Warehouse Operations

**Head:** Ana Whitfield (~70 workers + 2 warehouse managers)

The Los Angeles and Zaragoza warehouses use different warehouse management systems (WMS) — one is commercial software, the other is an advanced spreadsheet. There is no real-time global inventory visibility. Incoming orders arrive by email in different formats depending on the client and are transcribed manually. Picking is done with paper lists. Inventory discrepancies are frequent and detected late.

**What they need:** A unified inventory API that returns real-time stock for any SKU in either warehouse, an order ingestion pipeline that automatically parses emails, a warehouse operations dashboard, and low-stock alerts that notify the client and the purchasing team.

---

### 📦 Last Mile & Carrier Management

**Head:** Carlos Vega (6 logistics coordinators)

TrackFlow works with 8 carriers in both countries (UPS, FedEx, and DHL in the United States; MRW, SEUR, and DHL in Spain, plus two local carriers). Carrier assignment per shipment is manual. Package tracking requires checking multiple carrier portals separately. There is no historical performance data: no on-time delivery rate, no incidents per route, no cost per kg.

**What they need:** A carrier selection engine that recommends the optimal option given destination, weight, and urgency; a unified tracking endpoint that aggregates status from any carrier; a public tracking portal for the recipient; and a carrier performance dashboard.

---

### 🔄 Reverse Logistics

**Head:** Sofía Ramos (team of 5 people)

Returns represent between 18% and 25% of volume depending on client and country. Each return goes through manual review — there are no automatic approval criteria. Inspection of returned products is subjective and inconsistent between workers. There is no visibility into which products are returned most or why.

**What they need:** An automatic return approval engine with configurable rules per client, an automated pickup flow (approval → label → instructions to customer → scheduling with carrier), an AI-assisted inspection system where the worker photographs the product and AI classifies its condition, and a returns dashboard with pattern analysis.

---

### 📞 Customer Experience

**Head:** Valentina Cruz (15 agents in Los Angeles and Zaragoza)

TrackFlow serves two types of customer: brands (B2B) that contract its services and end consumers (B2C) who receive packages. The 15 agents handle both through email, WhatsApp, and phone without a unified ticketing system. 80% of inquiries could be resolved automatically. There is no knowledge base. After-hours coverage is zero.

**What they need:** A first-line CX agent that automatically resolves tracking and return status inquiries, a semantic knowledge base indexed for RAG, a unified ticketing system, a real-time CX dashboard, and sentiment analysis to detect frustrated clients before they escalate. Multilingual support (Spanish + English) is optional but highly recommended, starting with one base language.

---

### 🤝 Commercial & Client Relations

**Head:** Miguel Torres (4 account managers + 4 business development)

Account managers manage their accounts in personal spreadsheets and email threads — there is no CRM. Client reports are manual: each month an account manager consolidates data from different systems to send each client a PDF report. There is no visibility into which clients are at risk of not renewing.

**What they need:** CRM integration with unified client profile, automatically generated PDF reports for clients by an agent, a client health dashboard with renewal risk score, alerts at 90 and 30 days before contract expiration, and a commercial agent that suggests the most relevant service and pricing structure for each prospect.

---

### 💻 Technology

**CTO:** Andrés Kim (team of 7 people in Zaragoza)

TrackFlow's technology architecture is the result of years of unplanned growth: two different WMS, a corporate ERP from the early 2010s, undocumented point-to-point Python scripts, and databases on two different cloud providers. There is no centralized telemetry. When an endpoint fails in Los Angeles, the Zaragoza team finds out through WhatsApp. Deploying a new feature takes between one and two weeks.

**What they need:** Centralized telemetry and logging from both countries, a data pipeline that feeds all company dashboards, real-time monitoring with automatic alerts, a technical documentation agent, and operations task automation (backups, health checks, incident notifications with context).

---

### 📊 Executive Management

**CEO:** Daniel Espinoza

Daniel receives a consolidated report every Monday that his directors prepare on Sunday evening by combining data from different systems — 3 to 4 hours of work per director. By 10 AM Monday, some data is already two days old. There is no unified business view by country. Strategic decisions are made with partial data.

**What they need:** A global executive dashboard with real-time KPIs from both operations (shipment volume, on-time delivery rate, operating cost, returns, customer satisfaction), a weekly report automatically generated on Mondays at 7 AM, country comparisons, threshold alerts, and an AI assistant he can query in natural language.

---

## Why choose TrackFlow?

Choose TrackFlow if you are drawn to:

- **Logistics and physical operations** — every line of code you write is connected to a package moving from a warehouse shelf to someone's door.
- **Cross-border complexity** — two countries, two languages, two regulatory environments, and two separate technology stacks that need to be unified.
- **Data engineering in its most concrete form** — carrier performance metrics, SKU-level inventory, shipment event streams, and return classification are all structured, measurable, and visually impactful in dashboards.
- **24/7 systems** — TrackFlow's clients do not stop waiting for their packages after 6 PM. The CX agent, tracking portal, and operations dashboard must always be available.

AI challenges at TrackFlow include product condition classification by image, semantic search over logistics policies in two languages, intelligent carrier selection with explainable recommendations, and a real-time tracking aggregator that extracts data from 8 different carrier APIs. If you want to build systems that handle real-world complexity at scale, TrackFlow is your company.

---

*Internal document — 4Geeks Academy · AI Engineering Track*
*Exclusive use for program project generation*_
