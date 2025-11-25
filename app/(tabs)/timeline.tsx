import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, PanResponder, Animated, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { format, differenceInMinutes, addDays, subDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Plus } from 'lucide-react-native';
import DateTimePickerComponent from '../../components/ui/DateTimePicker';

const HOUR_HEIGHT = 60;
const MIN_EVENT_HEIGHT = 40;

export default function Timeline() {
    const router = useRouter();
    const [events, setEvents] = useState<any[]>([]);
    const [processedEvents, setProcessedEvents] = useState<any[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const swipeAnim = new Animated.Value(0);

    const getCategoryGradient = (note: string) => {
        const lower = note.toLowerCase();
        if (lower.includes('work')) return { start: '#3B82F6', end: '#2563EB', border: '#60A5FA' };
        if (lower.includes('wellbeing')) return { start: '#10B981', end: '#059669', border: '#34D399' };
        if (lower.includes('learning')) return { start: '#F97316', end: '#EA580C', border: '#FB923C' };
        if (lower.includes('deep')) return { start: '#8B5CF6', end: '#7C3AED', border: '#A78BFA' };
        if (lower.includes('entertainment')) return { start: '#EC4899', end: '#DB2777', border: '#F472B6' };
        if (lower.includes('family')) return { start: '#EF4444', end: '#DC2626', border: '#F87171' };
        return { start: '#60A5FA', end: '#3B82F6', border: '#93C5FD' };
    };

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 15 && Math.abs(gestureState.dy) < 30,
        onPanResponderGrant: () => swipeAnim.setValue(0),
        onPanResponderMove: (_, gestureState) => swipeAnim.setValue(gestureState.dx),
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dx > 80) {
                Animated.timing(swipeAnim, { toValue: 100, duration: 200, useNativeDriver: true }).start(() => {
                    setCurrentDate(subDays(currentDate, 1));
                    swipeAnim.setValue(0);
                });
            } else if (gestureState.dx < -80) {
                Animated.timing(swipeAnim, { toValue: -100, duration: 200, useNativeDriver: true }).start(() => {
                    setCurrentDate(addDays(currentDate, 1));
                    swipeAnim.setValue(0);
                });
            } else {
                Animated.spring(swipeAnim, { toValue: 0, useNativeDriver: true }).start();
            }
        },
    });

    const fetchTimeLogs = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);

        const searchStart = subDays(dayStart, 2);
        const searchEnd = addDays(dayEnd, 1);

        const { data } = await supabase
            .from('time_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('start_time', searchStart.toISOString())
            .lte('start_time', searchEnd.toISOString())
            .order('start_time', { ascending: true });

        if (data) {
            const filteredEvents = data.filter(event => {
                const eventStart = new Date(event.start_time);
                const eventEnd = event.end_time ? new Date(event.end_time) : new Date();
                return eventStart <= dayEnd && eventEnd >= dayStart;
            });
            setEvents(filteredEvents);
            processLayout(filteredEvents);
        } else {
            setEvents([]);
            setProcessedEvents([]);
        }
    };

    const processLayout = (events: any[]) => {
        if (!events || events.length === 0) {
            setProcessedEvents([]);
            return;
        }

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

        const columns: any[][] = [];
        let lastEventEnding: number | null = null;
        const overlaps = (a: any, b: any) => a.startMinutes < b.endMinutes && b.startMinutes < a.endMinutes;

        parsedEvents.forEach(event => {
            if (lastEventEnding !== null && event.startMinutes >= lastEventEnding) columns.length = 0;

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

            if (!placed) columns.push([event]);
            const maxEnd = Math.max(...columns.flat().map(e => e.endMinutes));
            lastEventEnding = maxEnd;
        });

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
        }, [currentDate])
    );

    const handlePrevDay = () => setCurrentDate(subDays(currentDate, 1));
    const handleNextDay = () => setCurrentDate(addDays(currentDate, 1));
    const hours = Array.from({ length: 24 }, (_, i) => i);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Compact Header */}
            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <View style={styles.headerTitle}>
                        <Text style={styles.title}>Timeline</Text>
                        <Text style={styles.subtitle}>
                            {isSameDay(currentDate, new Date()) ? 'Today' : format(currentDate, 'MMM dd')}
                        </Text>
                    </View>

                    <View style={styles.dateNav}>
                        <TouchableOpacity onPress={handlePrevDay} style={styles.navButton} activeOpacity={0.7}>
                            <ChevronLeft size={20} color="#60A5FA" strokeWidth={2.5} />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setShowDatePicker(!showDatePicker)} style={styles.dateButton}>
                            <Calendar size={16} color="#60A5FA" />
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleNextDay} style={styles.navButton} activeOpacity={0.7}>
                            <ChevronRight size={20} color="#60A5FA" strokeWidth={2.5} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {showDatePicker && (
                <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                    <DateTimePickerComponent
                        label="Jump to Date"
                        value={currentDate}
                        onChange={(date) => {
                            setCurrentDate(date);
                            setShowDatePicker(false);
                        }}
                        mode="date"
                    />
                </View>
            )}

            <Animated.View style={{ flex: 1, transform: [{ translateX: swipeAnim }] }} {...panResponder.panHandlers}>
                <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
                    <View style={{ position: 'relative', marginBottom: 40, height: 24 * HOUR_HEIGHT }}>
                        {hours.map(hour => (
                            <View key={hour} style={[
                                styles.hourRow,
                                { top: hour * HOUR_HEIGHT, backgroundColor: hour % 2 === 0 ? 'rgba(30, 41, 59, 0.3)' : 'transparent' }
                            ]}>
                                <Text style={styles.hourText}>{format(new Date().setHours(hour, 0), 'h a')}</Text>
                                <View style={styles.hourLine} />
                            </View>
                        ))}

                        {processedEvents.map((event) => {
                            const gradient = getCategoryGradient(event.note || '');
                            return (
                                <TouchableOpacity
                                    key={event.id}
                                    onPress={() => router.push(`/modal/edit-log?id=${event.id}`)}
                                    style={{
                                        position: 'absolute',
                                        top: event.top,
                                        height: event.height,
                                        left: `${event.left}%`,
                                        width: `${event.width}%`,
                                        zIndex: 10,
                                    }}
                                    activeOpacity={0.75}
                                >
                                    <View style={{
                                        flex: 1,
                                        backgroundColor: gradient.start,
                                        borderRadius: 8,
                                        padding: 10,
                                        borderLeftWidth: 4,
                                        borderLeftColor: gradient.border,
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 1 },
                                        shadowOpacity: 0.2,
                                        shadowRadius: 2,
                                        elevation: 2,
                                    }}>
                                        <Text style={styles.eventTitle} numberOfLines={2}>
                                            {event.note?.split('\n')[0] || 'Untitled'}
                                        </Text>
                                        <Text style={styles.eventTime} numberOfLines={1}>
                                            {format(new Date(event.start_time), 'h:mm')} - {format(new Date(event.end_time || new Date()), 'h:mm a')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {isSameDay(currentDate, new Date()) && (
                            <View style={[styles.currentTime, {
                                top: (new Date().getHours() * 60 + new Date().getMinutes()) / 60 * HOUR_HEIGHT
                            }]}>
                                <View style={styles.currentTimeDot} />
                            </View>
                        )}
                    </View>
                </ScrollView>
            </Animated.View>

            <TouchableOpacity onPress={() => router.push('/modal/log-time?manual=true')} style={styles.fab}>
                <Plus size={32} color="white" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#0F172A' },
    header: { paddingHorizontal: 20, paddingTop: 48, paddingBottom: 12, backgroundColor: '#0F172A' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { flex: 1 },
    title: { color: '#F8FAFC', fontSize: 28, fontWeight: '900', letterSpacing: -0.5 },
    subtitle: { color: '#64748B', fontSize: 13, fontWeight: '600', marginTop: 2 },
    dateNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navButton: { backgroundColor: 'rgba(51, 65, 85, 0.8)', padding: 8, borderRadius: 10 },
    dateButton: {
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
    },
    hourRow: { position: 'absolute', width: '100%', flexDirection: 'row', height: HOUR_HEIGHT },
    hourText: { color: '#64748B', fontSize: 12, width: 50, fontWeight: '600' },
    hourLine: { flex: 1, borderTopWidth: 1, borderColor: 'rgba(255, 255, 255, 0.05)', marginLeft: 8 },
    eventTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
    eventTime: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 11, marginTop: 4, fontWeight: '500' },
    currentTime: {
        position: 'absolute',
        width: '100%',
        borderTopWidth: 2,
        borderColor: '#EF4444',
        zIndex: 20,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#EF4444',
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    currentTimeDot: {
        width: 10,
        height: 10,
        backgroundColor: '#EF4444',
        borderRadius: 5,
        marginLeft: -5,
        borderWidth: 2,
        borderColor: '#FEE2E2',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#3B82F6',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
});
