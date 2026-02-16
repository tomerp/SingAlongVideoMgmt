# SingAlong Video Management System

## Product Requirements Document (PRD)

### Version 2.2 – Cloud-Based Architecture (Expanded Data Model)

---

## **1\. Overview**

The SingAlong Video Management System is a web-based application designed to manage, organize, and analyze a curated video library used for live singalong events.

The system supports:

* Structured metadata management

* Advanced filtering and Hebrew-aware sorting

* Event-based setlist creation with intelligent warnings

* Usage tracking and analytics

* Excel export functionality

* Automated YouTube synchronization

* Manual video entry (non-YouTube content)

* Structured taxonomy (Singers, Holidays, Genres, Custom Tags)

* Distinction between YouTube and Local playlists

This version formalizes the cloud-based architecture and expands the data model to ensure flexibility, integrity, and long-term scalability.

---

## **2\. System Architecture**

### **Application Type**

* Web-based application

* Secure login (single-user initially)

* Accessible from any device via browser

### **Database**

* Cloud-hosted relational database

* Automatic daily backups

* Device-independent durability

### **Sync Model**

* Manual YouTube channel sync

* Manual metadata fields are never overwritten

* YouTube playlists are synced as read-only

---

## **3\. Data Model (Core Entities)**

---

## **3.1 Video**

Each Video is a single unique record in the system.

A video must exist as a single database record, even if it appears in multiple YouTube playlists.

### **Fields**

* Title

* Description (full text)

* Description Preview (first 150 characters displayed in grid)

* Duration

* Publish Date

* View Count

* URL

* Source Type (YouTube | Manual)

* YouTube Video ID (unique, nullable for manual entries)

* File Path (optional, for manual videos)

* Language

* Tempo

* Quality Score (integer scale 1–10)

* Genre (required)

* Copyright (boolean: Yes/No)

* Notes

* Active / Inactive

* Used Count

* Last Used Date

* Created At

* Updated At

---

## **3.2 Genre**

Each video must have exactly one Genre.

### **Default Pre-Set Values**

* Oldies

* Hebrew

* Oriental

* Comedy

* Love

* War

The system must allow:

* Adding new Genres

* Removing Genres (if not in use)

* Editing existing Genres

* Managing Genres via Setup Menu

---

## **3.3 Singers**

* Unique Name (duplicate prevention)

* Hebrew-aware alphabetical sorting

* Many-to-many relationship with Videos

A video may have multiple Singers.

A singer may belong to multiple videos.

---

## **3.4 Holidays**

* Unique Name

* Many-to-many relationship with Videos

A video may be associated with multiple Holidays.

---

## **3.5 Custom Tag System**

The system must support structured custom tagging.

### **Entities**

* TagCategory

  * Name (e.g., “Original Artist”, “Performer”)

* Tag

  * Name

  * Belongs to TagCategory

* VideoTag

  * Many-to-many relationship between Video and Tag

The user must be able to:

* Create custom Tag Categories

* Add/remove Tags within each Category

* Assign multiple Tags per Video

* Filter by Tags using AND logic

---

## **3.6 Playlists**

Two distinct types:

### **A. YouTube Playlists**

* Synced via API

* Read-only within system

* Video records are not duplicated

* Association via join table only

### **B. Local Playlists**

* Fully editable

* User-created

* Ordered list of Videos

* Separate from YouTube playlists

---

## **3.7 Events (Setlists)**

Each Event includes:

* Event Name

* Event Date

* Event Notes

* Ordered list of Videos

* Real-time Total Duration calculation

### **System Behavior**

* When saving an Event:

  * Increment Used Count

  * Update Last Used Date

* When adding a Video to Event:

  * Display warning if used within previous 12 months

---

## **4\. Functional Requirements**

---

## **4.1 YouTube Sync**

* Add one or more channels

* Manual sync trigger

* Import:

  * Title

  * Description

  * Duration

  * Publish Date

  * View Count

  * URL

  * Playlists

* Manual fields never overwritten

* Enforce uniqueness via YouTube Video ID

---

## **4.2 Manual Video Entry**

The system must allow:

* Full manual creation of Video records

* Entry of:

  * Title

  * Duration

  * URL or File Path

  * All metadata fields

* Manual videos are treated identically to YouTube videos except for sync behavior

---

## **4.3 Metadata Editing**

User can edit:

* Language

* Tempo

* Quality Score (1–10)

* Genre (required)

* Singers (multi-select)

* Holidays (multi-select)

* Custom Tags (multi-select)

* Notes

* Active/Inactive

* Copyright flag

---

## **4.4 Filtering**

Filtering must support:

* Language

* Tempo

* Quality Score (range)

* Genre

* Singers (multi-select AND logic)

* Holidays (multi-select AND logic)

* Custom Tags (multi-select AND logic)

* Duration (range)

* Publish Date (range)

* Used Count (range)

* Last Used Date (range)

* Active status

Filtering must be fast and responsive.

---

## **4.5 Sorting**

All sorting must be:

* Hebrew-aware

* Case-insensitive

Sorting options include:

* Alphabetical

* Most Viewed

* Most Recently Used

* Recently Published

* Quality Score

* Used Count

Applies to:

* Videos

* Singers

* Holidays

* Genres

* Playlists

---

## **4.6 Setlist Builder**

User can:

* Create Event

* Add Videos via search/filter

* Drag-and-drop reorder

* View real-time Total Duration

* Receive 12-month usage warning

* Save Event

---

## **4.7 Excel Export**

### **Export Filtered Videos**

Includes all relevant metadata fields.

### **Export Event Setlist**

Must include columns in this exact order:

1. Order

2. Title

3. Singers

4. Tempo

5. Quality

6. Duration

7. Event Notes

8. URL

---

## **5\. Non-Functional Requirements**

* Clean and intuitive UI

* Sub-second filtering response

* Secure authentication

* Automatic cloud backup

* Data durability independent of device

* No OS installation required

---

## **6\. Phase 1 Scope (Confirmed)**

Phase 1 includes all functionality defined in this document, including:

* YouTube sync

* Manual video entry

* Unique video enforcement

* Genre management

* Singer management

* Holiday management

* Custom Tag system

* Advanced filtering

* Hebrew-aware sorting

* Setlist builder with real-time duration

* Usage warning logic

* Usage tracking

* Excel export

* YouTube vs Local playlist distinction

* Cloud-hosted database

---

## **7\. Open Clarifications**

1. Should usage warnings block adding a video or only notify?

2. Should removing a Genre automatically update affected Videos?

3. Should Custom Tag Categories be filterable independently?

4. Should there be a soft-delete/archive mode for Videos and Events?