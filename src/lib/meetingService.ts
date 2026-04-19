// src/lib/meetingService.ts
import type { TimeEntry as StoreTimeEntry, SummaryData } from '$lib/types';

export interface MeetingData {
    id: string;
    type: string;
    name: string;
    customName?: string | null;
    duration: number;
    formattedDuration: string;
    entries: StoreTimeEntry[];
    summary: SummaryData;
    startedAt: string;
    utcTime?: string;
}

export interface ServiceResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export interface DataResponse<T> extends ServiceResponse {
    data?: T;
}

const KEY_PREFIX = 'meeting:';
const REGISTRY_KEY = 'meeting:registry';

function hasStorage(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
}

function readRegistry(): string[] {
    if (!hasStorage()) return [];
    const raw = window.localStorage.getItem(REGISTRY_KEY);
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
        return [];
    }
}

function writeRegistry(ids: string[]): void {
    if (!hasStorage()) return;
    window.localStorage.setItem(REGISTRY_KEY, JSON.stringify(ids));
}

export async function saveMeetingData(meetingData: MeetingData): Promise<ServiceResponse> {
    if (!hasStorage()) {
        return { success: false, message: 'localStorage unavailable' };
    }
    try {
        window.localStorage.setItem(KEY_PREFIX + meetingData.id, JSON.stringify(meetingData));
        const registry = readRegistry();
        if (!registry.includes(meetingData.id)) {
            registry.push(meetingData.id);
            writeRegistry(registry);
        }
        return { success: true, message: 'Meeting data saved successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to save meeting data'
        };
    }
}

export async function getMeetingData(meetingId: string): Promise<DataResponse<MeetingData>> {
    if (!hasStorage()) {
        return { success: false, message: 'localStorage unavailable' };
    }
    try {
        const raw = window.localStorage.getItem(KEY_PREFIX + meetingId);
        if (!raw) {
            return { success: false, message: 'Meeting not found' };
        }
        return { success: true, data: JSON.parse(raw) as MeetingData };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to retrieve meeting data'
        };
    }
}

export async function deleteMeetingData(meetingId: string): Promise<ServiceResponse> {
    if (!hasStorage()) {
        return { success: false, message: 'localStorage unavailable' };
    }
    try {
        window.localStorage.removeItem(KEY_PREFIX + meetingId);
        writeRegistry(readRegistry().filter(id => id !== meetingId));
        return { success: true, message: 'Meeting data deleted successfully' };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to delete meeting data'
        };
    }
}

export async function getAllMeetings(): Promise<DataResponse<MeetingData[]>> {
    if (!hasStorage()) {
        return { success: true, data: [] };
    }
    try {
        const ids = readRegistry();
        const meetings: MeetingData[] = [];
        for (const id of ids) {
            const raw = window.localStorage.getItem(KEY_PREFIX + id);
            if (raw) {
                try { meetings.push(JSON.parse(raw) as MeetingData); } catch { /* skip */ }
            }
        }
        return { success: true, data: meetings };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to retrieve meetings',
            data: []
        };
    }
}
