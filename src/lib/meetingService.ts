// src/lib/meetingService.ts

// Types for meeting data
export interface TimeEntry {
    type: string;
    utcTime: string;
    stopwatchTime: string;
    elapsedTime: string;
}

export interface SummaryData {
    painPoints: number;
    positivePoints: number;
    bugs: number;
    paymentInfo: number;
}

export interface MeetingData {
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

export interface ServiceResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export interface DataResponse<T> extends ServiceResponse {
    data?: T;
}

/**
 * Save meeting data to the server
 * @param meetingData The meeting data to save
 * @returns Promise with operation result
 */
export async function saveMeetingData(meetingData: MeetingData): Promise<ServiceResponse> {
    try {
        const response = await fetch('/api/meetings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(meetingData)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to save meeting data');
        }

        return {
            success: true,
            message: 'Meeting data saved successfully'
        };
    } catch (error) {
        console.error('Error saving meeting data:', error);

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to save meeting data'
        };
    }
}

/**
 * Retrieve meeting data from the server
 * @param meetingId ID of the meeting to retrieve
 * @returns Promise with meeting data or error
 */
export async function getMeetingData(meetingId: string): Promise<DataResponse<MeetingData>> {
    try {
        const response = await fetch(`/api/meetings?id=${encodeURIComponent(meetingId)}`);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to retrieve meeting data');
        }

        return {
            success: true,
            data: result.data
        };
    } catch (error) {
        console.error('Error retrieving meeting data:', error);

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to retrieve meeting data'
        };
    }
}

/**
 * Delete meeting data
 * @param meetingId ID of the meeting to delete
 * @returns Promise with operation result
 */
export async function deleteMeetingData(meetingId: string): Promise<ServiceResponse> {
    try {
        const response = await fetch(`/api/meetings?id=${encodeURIComponent(meetingId)}`, {
            method: 'DELETE'
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to delete meeting data');
        }

        return {
            success: true,
            message: 'Meeting data deleted successfully'
        };
    } catch (error) {
        console.error('Error deleting meeting data:', error);

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete meeting data'
        };
    }
}

/**
 * Get all meetings
 * @returns Promise with array of meeting data
 */
export async function getAllMeetings(): Promise<DataResponse<MeetingData[]>> {
    try {
        const response = await fetch('/api/meetings?all=true');
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to retrieve meetings');
        }

        return {
            success: true,
            data: result.data || []
        };
    } catch (error) {
        console.error('Error retrieving all meetings:', error);

        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to retrieve meetings',
            data: []
        };
    }
}
