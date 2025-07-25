
"use client";

import * as React from 'react';
import { Timer } from 'lucide-react';
import { Badge } from './ui/badge';

interface CountdownTimerProps {
    resetsAt: Date | null;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ resetsAt }) => {
    const [timeLeft, setTimeLeft] = React.useState<string>('--:--:--');

    React.useEffect(() => {
        if (!resetsAt) return;

        const calculateTimeLeft = () => {
            const now = new Date();
            const distance = resetsAt.getTime() - now.getTime();

            if (distance < 0) {
                setTimeLeft("00:00:00");
                return false; // Stop interval
            }

            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            const formattedTime = [hours, minutes, seconds]
                .map(v => v < 10 ? "0" + v : String(v))
                .join(":");
            
            setTimeLeft(formattedTime);
            return true; // Continue interval
        };

        if(calculateTimeLeft()) {
            const intervalId = setInterval(() => {
                if (!calculateTimeLeft()) {
                    clearInterval(intervalId);
                }
            }, 1000);

            return () => clearInterval(intervalId);
        }

    }, [resetsAt]);

    if (!resetsAt) {
        return null;
    }

    return (
        <Badge variant="outline" className="text-sm py-1 px-3 border-accent/50 flex items-center">
            <Timer className="mr-1.5 h-4 w-4 text-muted-foreground" />
            <span className="font-mono text-muted-foreground">{timeLeft}</span>
        </Badge>
    );
};

export default CountdownTimer;
