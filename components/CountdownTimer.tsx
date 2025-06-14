'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface CountdownTimerProps {
    targetDate: Date;
    onCountdownComplete: () => void;
    showCard?: boolean;
}

export function CountdownTimer({ targetDate, onCountdownComplete, showCard = true }: CountdownTimerProps) {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = targetDate.getTime() - new Date().getTime();

            if (difference <= 0) {
                onCountdownComplete();
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            return {
                days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        };

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate, onCountdownComplete]);

    const TimeBlock = ({ value, label, max }: { value: number; label: string; max: number }) => {
        const percentage = (value / max) * 100;
        const strokeDasharray = `${percentage} 100`;

        return (
            <div className="relative flex flex-col items-center">
                <div className="relative w-16 h-16 md:w-20 md:h-20">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                        <path
                            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="#E5E7EB"
                            strokeWidth="3"
                        />
                        <path
                            d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
                            fill="none"
                            stroke="currentColor"
                            className="text-primary"
                            strokeWidth="3"
                            strokeDasharray={strokeDasharray}
                            strokeLinecap="round"
                            transform="rotate(-90 18 18)"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-lg md:text-xl font-bold text-primary">{value}</span>
                    </div>
                </div>
                <span className="text-xs md:text-sm text-gray-600 mt-2">{label}</span>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl mx-auto px-4"
        >
            {showCard ? (
                <Card className="bg-white/90 shadow-lg border-2 border-primary/20">
                    <CardHeader className="space-y-4">
                        <div className="text-center text-sm md:text-base text-gray-700 bg-primary/5 p-4 rounded-lg border border-primary/10">
                            <p className="font-medium">Registration will close on {targetDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}</p>
                        </div>
                        <CardTitle className="text-center text-xl md:text-2xl font-bold text-primary">
                            Time Remaining
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                            <TimeBlock value={timeLeft.days} label="दिन / Days" max={365} />
                            <TimeBlock value={timeLeft.hours} label="घंटे / Hours" max={24} />
                            <TimeBlock value={timeLeft.minutes} label="मिनट / Minutes" max={60} />
                            <TimeBlock value={timeLeft.seconds} label="सेकंड / Seconds" max={60} />
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    <div className="text-center text-sm md:text-base text-gray-700 bg-primary/5 p-4 mb-4 rounded-lg border border-primary/10">
                        <p className="font-medium">Registration will close on {targetDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}</p>
                    </div>
                    <div className="text-center text-xl mb-4 md:text-2xl font-bold text-primary">
                        Time Remaining
                    </div>
                    <div className="flex flex-wrap justify-center gap-6 md:gap-8">
                        <TimeBlock value={timeLeft.days} label="दिन / Days" max={365} />
                        <TimeBlock value={timeLeft.hours} label="घंटे / Hours" max={24} />
                        <TimeBlock value={timeLeft.minutes} label="मिनट / Minutes" max={60} />
                        <TimeBlock value={timeLeft.seconds} label="सेकंड / Seconds" max={60} />
                    </div>
                </>
            )}
        </motion.div>
    );
} 