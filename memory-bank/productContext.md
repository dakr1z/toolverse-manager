# Product Context

## Problem Statement
 freelancers, developers, and creative professionals often use a multitude of software tools (SaaS). It is easy to lose track of:
1. **Total Costs**: How much is being spent monthly/annually on subscriptions?
2. **Tool Details**: Where is the login? What was this tool for?
3. **Project Costing**: How much does a specific workflow (e.g., "Create 3D Asset") cost in terms of tool usage (rendering credits, API fees)?
4. **Data Sync**: Keeping this information accessible across devices without relying on complex spreadsheets.

## Solution
ToolVerse Manager provides a dedicated interface for this data. Unlike a spreadsheet, it offers:
- **Visual Management**: Gallery view with cover images.
- **Smart Logic**: Automatic calculation of monthly/yearly costs.
- **Workflow Integration**: Connecting tools to processes to estimate real-world usage costs.
- **Privacy**: Local-first data with optional secure cloud sync.

## User Experience Goals
- **Dashboard First**: Immediate visibility of critical metrics (cost, active subscriptions) upon login/unlock.
- **Visual & Intuitive**: Use of icons, colors, and images to make tool management engaging rather than tedious.
- **Secure**: Feeling of safety through the PIN lock mechanism.
- **Seamless Sync**: Easy backup and restore process via Firebase when switching devices.

## Key Flows
1. **Onboarding/Setup**:
   - User sets up a security PIN.
   - User (optionally) configures Firebase for sync.
2. **Tool Entry**:
   - User adds a tool via the "Library" or "Add Tool" button.
   - Details like name, price, billing cycle, and category are entered.
   - Cover image URL adds visual flair.
3. **Workflow Planning**:
   - User navigates to "Workflows".
   - Creates a new workflow (e.g., "YouTube Video Production").
   - Adds steps and links specific tools to each step.
   - Configures variable costs (e.g., "2 hours of editing software usage").
4. **Maintenance**:
   - User checks "Subscriptions" to see upcoming renewals.
   - User performs a "Cloud Upload" to back up data.
