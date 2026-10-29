Flock Energy

Tech Stack ( with why )

HTTP Framework - Fastify(Typescript) - Roughly 4x faster than Express , more stable compared to Hyper-Express , enormous eco system.

Database & Engine - SQLite (better-sqlite3) in WAL Mode - Eliminates external database setup .



Database Schema & Indexing Strategy

dts:
- code (TEXT PRIMARY KEY)
- name (TEXT NOT NULL)
- feederCode (TEXT NOT NULL)
- capacityKva (REAL NOT NULL)
- createdAt (DATETIME DEFAULT CURRENT_TIMESTAMP)

meters:
- meterId (TEXT PRIMARY KEY)
- serialNo (TEXT NOT NULL UNIQUE)
- make (TEXT NOT NULL)
- phaseType (TEXT NOT NULL)
- installStatus (TEXT NOT NULL)
- installType (TEXT NOT NULL)
- build (TEXT NOT NULL)
- dtCode (TEXT NOT NULL, FOREIGN KEY REFERENCES dts(code))
- zoneCode (TEXT)
- circleCode (TEXT)
- divisionCode (TEXT)
- subdivisionCode (TEXT)
- substationCode (TEXT)
- feederCode (TEXT)
- lat (REAL)
- lng (REAL)
- hierarchyJson (TEXT NOT NULL)
- createdAt (DATETIME DEFAULT CURRENT_TIMESTAMP)

users:
- id (TEXT PRIMARY KEY)
- email (TEXT UNIQUE NOT NULL)
- passwordHash (TEXT NOT NULL)
- role (TEXT NOT NULL DEFAULT 'operator')
- createdAt (DATETIME DEFAULT CURRENT_TIMESTAMP)

CREATE INDEX idx_meters_search ON meters(meterId, serialNo);
CREATE INDEX idx_meters_dtCode ON meters(dtCode);
CREATE INDEX idx_meters_make ON meters(make);
CREATE INDEX idx_meters_phaseType ON meters(phaseType);
CREATE INDEX idx_meters_installStatus ON meters(installStatus);
CREATE INDEX idx_meters_feederCode ON meters(feederCode);
CREATE INDEX idx_dts_feederCode ON dts(feederCode);

I specifically added indexes on frequently queried and filtered columns to accelerate meter searches, status-based filtering, and feeder/transformer lookups while reducing full-table scans.


## Reflection

Most difficult part ?
- Adjusting the SQLite schema of the data from meter-export.json 
- If I had more time , I would interate all CRUD applications along with a customer view page .

If you were reviewing your own submission, what would you criticise?
- Should have added a beautiful production ready frontend to actually utilise these api .



Designing Decisions and Description .

The repo is a Read-Only Modular Backend Service , so my goal was to make it as fast and user-friendly from a developer point of view as well . It was one of main my reasons to keep the entire service modular . As a Query Service the backend should be able to filter , sort and search with maximum user convenience in both speed and logic .
Used fastify specifically for this reason . 

The initial website used session cookies but for this backend I preferred JWT based  auth because of 2 reasons -
1. Read-Only service the importance of tracking and maintain the meta-data of the login session is not very critical here .
2. No unecessary token management on database level .

I captured the entire flow from the original test site which was https://urja-ops.flockenergy.tech .

Some assumptions that i made were -
1. The same portal might be used by both operators and customers so i added a role field in the user schema .
2. Added apis for fetching details of a meter and transformer as well , these were not included in the demo site . Figured as per the REST convention they should exist instead of populating the GET list api to fetch all data .

Trade-Offs
1. Auth Method - We are using JWT Token , once issued token remains valid unless an explicit token blacklist is maintained or the jwt password is changed from the env . If used stateful method of auth we could revoke sessinos instanly .
2. Rate-Limiter -  We are using in-memory approach for this with fastify/rate-limit . If we used a distributed limiter such as redis we could enforce a strict limit across all shared instances of a server .
3. Databse - SQLite scales poorly compared to standard SQL based databases such as postgres and mysql .


===========================================================

Installation & Setup Guide
Prerequisites
Node.js
npm

1. Clone the Repository
git clone <repository-url>
cd <project-directory>

2. Install Dependencies
npm install

3. Configure Environment Variables
Note: project includes an .env.example , refer it .

4. Commands
npm run dev - run development server with live watch .
npm test - automated tests
npm run generate:openapi - regenerate the root openapi.json file
npm run build - create prod build
npm start - run prod mode .

5. Sample test guide
- run the server locally , open the swagger docs at http://localhost:3000/docs 