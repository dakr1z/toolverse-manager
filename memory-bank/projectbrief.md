# Project Brief: ToolVerse Manager

## Overview
ToolVerse Manager is a React-based application designed to help users manage their personal or professional tech stack ("ToolVerse"). It serves as a central database for software tools, subscriptions, and associated costs, while also providing features to plan workflows and calculate project costs.

## Core Requirements
- **Tool Management**: CRUD operations for software tools with detailed metadata (links, credentials, tags, images).
- **Subscription Tracking**: Monitor recurring costs (monthly/yearly), renewal dates, and total expenditure.
- **Workflow Builder**: Create and visualize workflows by combining tools, calculating costs based on usage (e.g., API calls, render time).
- **Data Persistence**: Offline-first architecture using LocalStorage, with optional cloud synchronization via Firebase.
- **Security**: Protect sensitive data (like costs and tool notes) with a PIN lock screen.

## Project Goals
- Provide a clear overview of monthly and yearly software expenses.
- Simplify the management of a growing collection of digital tools.
- Enable cost estimation for projects based on tool usage within workflows.
- Ensure data privacy and availability through local storage and encrypted-like protection (PIN).

## Scope
- **Platform**: Web Application (Single Page Application).
- **Stack**: React, Vite, TypeScript, Tailwind CSS.
- **Integration**: Firebase (Auth & Storage), Google Gemini (AI - planned/integrated).
