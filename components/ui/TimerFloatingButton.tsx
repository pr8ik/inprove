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

    return (
        <View className="absolute bottom-8 w-full items-center px-4">
            <TouchableOpacity
                className={`flex-row items-center justify-center w-full py-5 rounded-2xl shadow-2xl ${activeTimer ? 'bg-highlight' : 'bg-accent'
                    }`}
                style={{
                    shadowColor: activeTimer ? '#F97316' : '#3B82F6',
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                    elevation: 10,
                }}
                onPress={() => router.push('/modal/log-time')}
            >
                {activeTimer ? (
                    <>
                        <Square size={24} color="white" fill="white" />
                        <Text className="text-white font-black ml-3 text-2xl font-mono tracking-widest">
                            {formatTime(elapsed)}
                        </Text>
                    </>
                ) : (
                    <>
                        <Play size={24} color="white" fill="white" />
                        <Text className="text-white font-bold ml-3 text-xl tracking-wide uppercase">Start Tracking</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}
