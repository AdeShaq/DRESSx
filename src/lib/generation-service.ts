
'use server';

import { db } from './firebase-server';
import { doc, runTransaction, Timestamp } from 'firebase/firestore';

const COUNTER_COLLECTION = 'global_state';
const COUNTER_DOCUMENT = 'generation_counter';
const DAILY_GENERATION_LIMIT = 100;

export async function decrementGenerationsLeft(): Promise<{ success: boolean; error?: string }> {
  try {
    const counterRef = doc(db, COUNTER_COLLECTION, COUNTER_DOCUMENT);

    await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      const now = Timestamp.now();
      const data = counterDoc.data();
      const resetsAt = data?.resetsAt as Timestamp | undefined;

      // Check if we need to reset the counter
      if (!counterDoc.exists() || (resetsAt && resetsAt.toMillis() < now.toMillis())) {
        const now_dt = now.toDate();
        const nextReset = new Date(now_dt);
        nextReset.setHours(1, 0, 0, 0); // Set to 1:00:00 AM today

        // If 1 AM today has already passed, set for 1 AM tomorrow
        if (nextReset < now_dt) {
            nextReset.setDate(nextReset.getDate() + 1);
        }
        
        // Resetting the counter
        transaction.set(counterRef, { 
            count: DAILY_GENERATION_LIMIT - 1,
            resetsAt: Timestamp.fromDate(nextReset)
        });
        return;
      }
      
      if (!data) {
        throw new Error("Could not retrieve generation data.");
      }
      const currentCount = data.count;
      if (currentCount <= 0) {
        // Find time remaining until reset
        const resetDate = resetsAt!.toDate();
        const remainingMillis = resetDate.getTime() - now.toDate().getTime();
        const hours = Math.floor(remainingMillis / 3600000);
        const minutes = Math.floor((remainingMillis % 3600000) / 60000);
        const hoursText = hours > 0 ? `${hours}h` : '';
        const minutesText = minutes > 0 ? `${minutes}m` : '';

        if (hours > 0 || minutes > 0) {
          throw new Error(`No generations left. Please check back in about ${hoursText} ${minutesText}.`);
        } else {
          throw new Error("No generations left. Please check back in a moment.");
        }
      }
      transaction.update(counterRef, { count: currentCount - 1 });
    });

    return { success: true };
  } catch (error) {
    console.error("Error decrementing generation count:", error);
    if (error instanceof Error) {
        return { success: false, error: error.message };
    }
    return { success: false, error: "An unknown error occurred while updating generation count." };
  }
}
