// src/routes/api/meetings/+server.ts
import { json, type RequestEvent } from '@sveltejs/kit';
import { DaprClient } from '@dapr/dapr';

// Types for meeting data
interface TimeEntry {
    type: string;
    utcTime: string;
    stopwatchTime: string;
    elapsedTime: string;
}

interface SummaryData {
    painPoints: number;
    positivePoints: number;
    bugs: number;
    paymentInfo: number;
}

interface MeetingData {
    id: string;
    type: string;
    name: string;
    customName?: string;
    duration: number;
    formattedDuration: string;
    entries: TimeEntry[];
    summary: SummaryData;
    startedAt: string;
    utcTime: string;
}

const client = new DaprClient();
const STATE_STORE_NAME = 'statestore';

export async function POST({ request }: RequestEvent): Promise<Response> {
    const meetingData: MeetingData = await request.json();

    try {
        await client.state.save(
            STATE_STORE_NAME,
            [{
                key: `meeting-${meetingData.id}`,
                value: meetingData,
                metadata: {
                    contentType: 'application/json'
                }
            }],
            {
                metadata: {
                    ttlInSeconds: "86400" // 24 hours TTL for meeting data
                }
            }
        );

        return json({ success: true });
    } catch (error) {
        console.error('Failed to save meeting:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// Single GET function that handles both single meeting and all meetings
export async function GET({ url }: RequestEvent): Promise<Response> {
    const id = url.searchParams.get('id');
    const fetchAll = url.searchParams.get('all') === 'true';

    // Handle fetching all meetings
    if (fetchAll) {
        try {
            // This approach assumes you're using a registry of meeting IDs stored in another state entry
            // A real implementation would depend on your specific state store capabilities
            const meetingRegistry = await client.state.get(STATE_STORE_NAME, 'meeting-registry') as string[] || [];

            const meetings: MeetingData[] = [];

            // Fetch each meeting in parallel using Promise.all
            if (meetingRegistry.length > 0) {
                const meetingPromises = meetingRegistry.map(id =>
                    client.state.get(STATE_STORE_NAME, `meeting-${id}`)
                        .then(data => data as MeetingData)
                        .catch(() => null) // Ignore errors for individual meetings
                );

                const results = await Promise.all(meetingPromises);

                // Filter out any null results from failed fetches
                meetings.push(...results.filter(Boolean) as MeetingData[]);
            }

            return json({ success: true, data: meetings });
        } catch (error) {
            console.error('Failed to get all meetings:', error);
            return json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                },
                { status: 500 }
            );
        }
    }

    // Handle fetching a single meeting
    if (!id) {
        return json({ success: false, error: 'Meeting ID is required' }, { status: 400 });
    }

    try {
        const data = await client.state.get(STATE_STORE_NAME, `meeting-${id}`);

        if (!data) {
            return json({ success: false, error: 'Meeting not found' }, { status: 404 });
        }

        return json({ success: true, data });
    } catch (error) {
        console.error('Failed to get meeting:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function DELETE({ url }: RequestEvent): Promise<Response> {
    const id = url.searchParams.get('id');

    if (!id) {
        return json({ success: false, error: 'Meeting ID is required' }, { status: 400 });
    }

    try {
        await client.state.delete(STATE_STORE_NAME, `meeting-${id}`);
        return json({ success: true });
    } catch (error) {
        console.error('Failed to delete meeting:', error);
        return json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
