# Interview Stopwatch

Interview Stopwatch is a SvelteKit application designed to track and record key moments during meetings. It helps teams document important points, pain points, bugs, and payment discussions, and generates summaries with statistics.

## Features

- **Meeting Selection**: Choose from predefined meeting types or create custom meetings
- **Real-time Tracking**: Record timestamped events during meetings
- **Multiple Categories**: Track happy moments, pain points, bugs, and payment information
- **Timer**: Built-in stopwatch to track meeting duration
- **Statistics**: Automatically generate summaries with percentages
- **Export**: Export meeting data to CSV for further analysis
- **Persistence**: Data stored using DAPR state management

## Technology Stack

- **Frontend**: SvelteKit with inline styles
- **State Management**: DAPR (Distributed Application Runtime)
- **API**: Server-side SvelteKit API routes
- **Storage**: DAPR state store (configurable backend)
- **Language**: TypeScript for type safety

## Getting Started

### Prerequisites

- Node.js (v16+)
- DAPR CLI installed (for running with DAPR)
- Yarn or npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/irieaccelerator/interviewstopwatch
   cd interviewstopwatch
   ```

2. Install dependencies
   ```bash
   yarn install
   # or
   npm install
   ```


3. Start the application with DAPR
   ```bash
   dapr run --app-id interviewstopwatch --app-port 5173 --dapr-http-port 3500 -- yarn dev
   ```

## Usage

1. **Home Page**: Select a meeting type (UX, Client, Stakeholder, Team) or create a custom meeting
2. **Meeting Page**:
    - Click "START MEETING" to begin the timer
    - Use the emotion buttons to record different types of events
    - Add descriptions to pain points if needed
    - Click "END" when the meeting is finished
    - Click "View Summary" to save and view meeting statistics

3. **Summary Page**:
    - View statistics on different types of recorded events
    - See percentages of each category
    - Export the data to CSV for further analysis

## Project Structure

```
interviewstopwatch/
├── components/               # DAPR component configurations
├── src/
│   ├── app.css               # Global CSS and Tailwind imports
│   ├── lib/
│   │   └── meetingService.ts # Client-side API service
│   └── routes/
│       ├── +layout.svelte    # Main layout with CSS imports
│       ├── +page.svelte      # Home page with meeting selection
│       ├── api/
│       │   └── meetings/
│       │       └── +server.ts # Server API endpoints for DAPR
│       └── meeting/
│           └── [type]/
│               ├── +page.svelte         # Meeting tracking page
│               └── summary/
│                   └── +page.svelte     # Meeting summary page
└── tailwind.config.js        # Tailwind CSS configuration
```

## DAPR Integration

The application uses DAPR for state management, which allows it to be deployed with different backend storage options without changing the application code.

- **Local Development**: Uses Redis state store (automatically set up by DAPR init)
- **Production**: Can be configured to use any DAPR-supported state store (Cosmos DB, DynamoDB, etc.)

The DAPR client runs on the server side through SvelteKit API routes, avoiding browser compatibility issues with the DAPR SDK.

## Development

### Running in Development Mode

```bash
# Start SvelteKit development server with DAPR
dapr run --app-id interviewstopwatch --app-port 5173 --dapr-http-port 3500 -- yarn dev
```

### Building for Production

```bash
# Build the application
yarn build

# Run the production build with DAPR
dapr run --app-id interviewstopwatch --app-port 3000 --dapr-http-port 3500 -- node build/index.js
```

