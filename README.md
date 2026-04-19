# Interview Stopwatch

Interview Stopwatch is a SvelteKit application designed to track and record key moments during meetings. It helps teams document important points, pain points, successes, feature ideas, and more, and generates summaries with statistics.

## Features

- **Meeting Selection**: Choose from predefined meeting types or create custom meetings
- **Real-time Tracking**: Record timestamped events during meetings
- **Multiple Categories**: Track user info, questions, answers, pain points, successes, feature ideas, and notes
- **Timer**: Built-in stopwatch to track meeting duration
- **Statistics**: Automatically generate summaries with percentages
- **Export**: Export meeting data to CSV for further analysis
- **Persistence**: Meetings are stored in the browser via `localStorage`

## Technology Stack

- **Frontend**: SvelteKit 2 + Svelte 5 + TypeScript
- **Styling**: Tailwind CSS v4
- **Build**: Vite 6
- **Storage**: Browser `localStorage` (no backend required)

## Getting Started

### Prerequisites

- Node.js v20+
- Yarn (or npm)

### Installation

```bash
git clone https://github.com/irieaccelerator/interviewstopwatch
cd interviewstopwatch
yarn install
yarn dev
```

Then open http://localhost:5173.

## Usage

1. **Home Page**: Select a meeting type (UX, Client, Stakeholder, Team) or create a custom meeting
2. **Meeting Page**:
    - Click **START MEETING** to begin the timer
    - Use the annotation buttons to record different types of events
    - Add descriptions to entries as needed
    - Click **END** when the meeting is finished
    - Click **View Summary** to save and view meeting statistics
3. **Summary Page**:
    - View statistics on different types of recorded events
    - See percentages of each category
    - Export the data to CSV

## Development

```bash
yarn dev            # start dev server
yarn host           # dev server on all interfaces
yarn build          # production build
yarn preview        # preview the build
yarn run check      # svelte-check (type safety)
```

Note: `yarn check` (without `run`) triggers Yarn's built-in integrity check. Use `yarn run check` to invoke the svelte-check script.
