import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { format, differenceInMinutes } from 'date-fns';

const HOUR_HEIGHT = 60;
const MIN_EVENT_HEIGHT = 40;

export default function Timeline() {
    const router = useRouter();
    const [events, setEvents] = useState<any[]>([]);
    const [processedEvents, setProcessedEvents] = useState<any[]>([]);

    const fetchTimeLogs = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // Fetch tasks that STARTED today (for cross-day task handling)
        const { data } = await supabase
            .from('time_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('start_time', todayStart.toISOString())
            .lte('start_time', todayEnd.toISOString())
            .order('start_time', { ascending: true });

        if (data) {
            setEvents(data);
            processLayout(data);
        }
    };

    // Google Calendar Style Layout Algorithm
    const processLayout = (events: any[]) => {
        if (!events || events.length === 0) {
            setProcessedEvents([]);
            return;
        }

        // 1. Convert times to minutes from start of day
        const parsedEvents = events.map(e => {
            const start = new Date(e.start_time);
            const end = e.end_time ? new Date(e.end_time) : new Date();
            const startMinutes = start.getHours() * 60 + start.getMinutes();
            let duration = differenceInMinutes(end, start);
            if (duration < 15) duration = 15;

            return {
                ...e,
                startMinutes,
                endMinutes: startMinutes + duration,
                duration,
                top: (startMinutes / 60) * HOUR_HEIGHT,
                height: Math.max((duration / 60) * HOUR_HEIGHT, MIN_EVENT_HEIGHT),
            };
        });

        // 2. Detect overlaps and assign columns
        const columns: any[][] = [];
        let lastEventEnding: number | null = null;

        const overlaps = (a: any, b: any) => a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;

        parsedEvents.forEach(event => {
            if (lastEventEnding !== null && event.startMinutes >= lastEventEnding) {
                columns.length = 0;
            }

            let placed = false;
            for (let i = 0; i < columns.length; i++) {
                const col = columns[i];
                const lastInCol = col[col.length - 1];
                if (!overlaps(event, lastInCol)) {
                    col.push(event);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                columns.push([event]);
            }

            const maxEnd = Math.max(...columns.flat().map(e => e.endMinutes));
            lastEventEnding = maxEnd;
        });

        // 3. Calculate widths and positions
        const allEvents = columns.flat();
        allEvents.forEach(event => {
            const overlappingEvents = allEvents.filter(e => overlaps(e, event));
            const columnCount = overlappingEvents.length;
            const columnIndex = overlappingEvents.indexOf(event);

            event.left = (columnIndex / columnCount) * 100;
            event.width = (1 / columnCount) * 100;
        });

        setProcessedEvents(allEvents);
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchTimeLogs();
        }, [])
    );

    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <StatusBar barStyle="light-content" />
            <View className="px-5 pt-6 pb-3">
                <Text className="text-white text-3xl font-bold">Timeline</Text>
                <Text className="text-text-muted text-sm mt-1">Today's Activity</Text>
            </View>

            <ScrollView className="flex-1 px-5">
                <View className="relative" style={{ height: 24 * HOUR_HEIGHT }}>
                    {hours.map(hour => (
                        <View key={hour} className="absolute w-full flex-row" style={{ top: hour * HOUR_HEIGHT }}>
                            <Text className="text-text-muted text-xs w-12">{format(new Date().setHours(hour, 0), 'h a')}</Text>
                            <View className="flex-1 border-t border-white/10 ml-2" />
                        </View>
                    ))}

                    {processedEvents.map((event) => (
                        <TouchableOpacity
                            key={event.id}
                            onPress={() => router.push(`/modal/edit-log?id=${event.id}`)}
                            className="absolute bg-accent/80 rounded-lg p-2 border-l-4 border-accent"
                            style={{
                                top: event.top,
                                height: event.height,
                                left: `${event.left}%`,
                                width: `${event.width}%`,
                            }}
                        >
                            <Text className="text-white font-bold text-xs" numberOfLines={1}>
                                {event.note?.split('\n')[0] || 'Untitled'}
                            </Text>
                            <Text className="text-white/70 text-xs">
                                {Math.floor(event.duration)} min
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
