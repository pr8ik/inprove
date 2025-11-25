import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Play, Square } from 'lucide-react-native';
import { useStore } from '../../lib/store';
import { useRouter } from 'expo-router';
import { differenceInSeconds } from 'date-fns';

export default function TimerFloatingButton() {
    const { activeTimer } = useStore();
    const router = useRouter();
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (activeTimer) {
            interval = setInterval(() => {
                setElapsed(differenceInSeconds(new Date(), new Date(activeTimer.startTime)));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (!activeTimer) {
        return (
            <TouchableOpacity
                onPress={() => router.push('/modal/log-time')}
                className="bg-accent w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-accent/50"
            >
                <Play size={28} color="white" fill="white" className="ml-1" />
            </TouchableOpacity>
        );
    }

    return (
        <View className="items-center">
            {activeTimer.taskName && (
                <View className="bg-secondary/90 px-4 py-2 rounded-full mb-2 border border-white/10">
                    <Text className="text-white font-bold text-sm">{activeTimer.taskName}</Text>
                </View>
            )}
            <TouchableOpacity
                onPress={() => router.push('/modal/log-time')}
                className="bg-highlight w-16 h-16 rounded-full items-center justify-center shadow-lg shadow-highlight/50 animate-pulse"
            >
                <Square size={24} color="white" fill="white" />
            </TouchableOpacity>
            <View className="bg-secondary/80 px-3 py-1 rounded-full mt-2">
                <Text className="text-white font-mono font-bold">{formatTime(elapsed)}</Text>
            </View>
        </View>
    );
}
