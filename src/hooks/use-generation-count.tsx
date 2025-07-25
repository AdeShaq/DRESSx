
"use client";

import { useState, useEffect } from 'react';
import { doc, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const COUNTER_COLLECTION = 'global_state';
const COUNTER_DOCUMENT = 'generation_counter';
const DAILY_GENERATION_LIMIT = 100;

export const useGenerationCount = () => {
    const [generationsLeft, setGenerationsLeft] = useState<number | null>(null);
    const [resetsAt, setResetsAt] = useState<Date | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const docRef = doc(db, COUNTER_COLLECTION, COUNTER_DOCUMENT);

        const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
            const now = new Date();
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                const resetTimestamp = data.resetsAt as Timestamp;

                if (resetTimestamp && resetTimestamp.toDate() > now) {
                    setGenerationsLeft(data.count);
                    setResetsAt(resetTimestamp.toDate());
                } else {
                    // Counter is stale and will be reset on the next generation attempt by the server function.
                    // For the UI, we'll show the full limit and an estimated reset time.
                    setGenerationsLeft(DAILY_GENERATION_LIMIT);
                    const estimatedNextReset = new Date();
                    estimatedNextReset.setHours(1, 0, 0, 0); // Set to 1:00:00 AM today

                    // If 1 AM today has already passed, the next reset is 1 AM tomorrow.
                    if (estimatedNextReset < now) {
                        estimatedNextReset.setDate(estimatedNextReset.getDate() + 1);
                    }
                    setResetsAt(estimatedNextReset);
                }
            } else {
                // Document doesn't exist, it will be created on first generation.
                // Assume full limit for the UI.
                setGenerationsLeft(DAILY_GENERATION_LIMIT);
                const estimatedNextReset = new Date();
                estimatedNextReset.setHours(1, 0, 0, 0); // Set to 1:00:00 AM today
                // If 1 AM today has already passed, set for 1 AM tomorrow.
                if (estimatedNextReset < now) {
                    estimatedNextReset.setDate(estimatedNextReset.getDate() + 1);
                }
                setResetsAt(estimatedNextReset);
            }
            setError(null);
        }, (err) => {
            console.error("Error fetching real-time generation count:", err);
            setError("Could not get generation count. Functionality may be limited.");
            setGenerationsLeft(null);
            setResetsAt(null);
        });

        return () => unsubscribe();
    }, []);

    return { generationsLeft, resetsAt, error };
};
