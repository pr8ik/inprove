import React, { useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Plus, Check, Flame } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format, subDays, isAfter, isBefore } from 'date-fns';

export default function Habits() {
    const router = useRouter();
    const [habits, setHabits] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const calculateStreak = (habitLogs: any[]) => {
        if (!habitLogs || habitLogs.length === 0) return 0;

        // Sort by date descending
        const sortedLogs = habitLogs
            .filter(log => log.is_completed)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (sortedLogs.length === 0) return 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = format(today, 'yyyy-MM-dd');
        const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

        // Check if streak is active (completed today or yesterday)
        const mostRecent = sortedLogs[0].date;
        if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
            return 0; // Streak broken
        }

        // Count consecutive days from most recent
        let streak = 1;
        let currentDate = new Date(sortedLogs[0].date);

        for (let i = 1; i < sortedLogs.length; i++) {
            const prevDate = new Date(sortedLogs[i].date);
            const expectedPrevDate = subDays(currentDate, 1);

            if (format(prevDate, 'yyyy-MM-dd') === format(expectedPrevDate, 'yyyy-MM-dd')) {
                streak++;
                currentDate = prevDate;
            } else {
                break; // Streak broken
            }
        }

        return streak;
    };

    const fetchHabits = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Fetch habit items
        const { data: habitItems, error: habitsError } = await supabase
            .from('habit_items')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (habitsError) {
            console.error('Error fetching habits:', habitsError);
            setLoading(false);
            return;
        }

        if (!habitItems || habitItems.length === 0) {
            setHabits([]);
            setLoading(false);
            return;
        }

        // Fetch last 30 days of logs for streak calculation
        const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
        const { data: allLogs } = await supabase
            .from('habit_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('date', thirtyDaysAgo);

        // Fetch today's logs
        const today = format(new Date(), 'yyyy-MM-dd');
        const { data: todayLogs } = await supabase
            .from('habit_logs')
            .select('*')
            .eq('user_id', user.id)
            .eq('date', today);

        const habitsWithStatus = habitItems.map(habit => {
            const habitLogs = allLogs?.filter(l => l.habit_id === habit.id) || [];
            const todayLog = todayLogs?.find(l => l.habit_id === habit.id);
            const streak = calculateStreak(habitLogs);

            return {
                ...habit,
                completed: todayLog?.is_completed || false,
                logId: todayLog?.id,
                streak,
            };
        });

        setHabits(habitsWithStatus);
        setLoading(false);
    };

    const toggleHabit = async (habit: any) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const today = format(new Date(), 'yyyy-MM-dd');
        const newCompletedStatus = !habit.completed;

        // Optimistic update
        setHabits(prev =>
            prev.map(h =>
                h.id === habit.id ? { ...h, completed: newCompletedStatus } : h
            )
        );

        if (habit.logId) {
            await supabase
                .from('habit_logs')
                .update({ is_completed: newCompletedStatus })
                .eq('id', habit.logId);
        } else {
            await supabase.from('habit_logs').insert({
                user_id: user.id,
                habit_id: habit.id,
                date: today,
                is_completed: newCompletedStatus,
            });
        }

        // Refresh to recalculate streak
        fetchHabits();
    };

    useFocusEffect(
        React.useCallback(() => {
            fetchHabits();
        }, [])
    );

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <StatusBar barStyle="light-content" />
            <View className="px-5 pt-6 pb-3 flex-row justify-between items-center">
                <View>
                    <Text className="text-white text-3xl font-bold">Habits</Text>
                    <Text className="text-text-muted text-sm mt-1">Build your routine</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.push('/modal/create-habit')}
                    className="bg-accent w-12 h-12 rounded-full items-center justify-center"
                >
                    <Plus size={24} color="white" strokeWidth={2.5} />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1 px-5">
                {loading ? (
                    <View className="items-center justify-center mt-20">
                        <Text className="text-text-muted">Loading...</Text>
                    </View>
                ) : habits.length === 0 ? (
                    <View className="items-center justify-center mt-20">
                        <Text className="text-text-muted text-center italic">
                            No habits yet. Create your first one!
                        </Text>
                    </View>
                ) : (
                    habits.map((habit) => (
                        <TouchableOpacity
                            key={habit.id}
                            onPress={() => toggleHabit(habit)}
                            className={`mb-3 p-4 rounded-2xl border flex-row items-center justify-between ${habit.completed
                                    ? 'bg-accent/10 border-accent/30'
                                    : 'bg-secondary border-white/5'
                                }`}
                            style={{
                                opacity: habit.completed ? 0.8 : 1
                            }}
                        >
                            <View className="flex-row items-center flex-1">
                                <View
                                    className={`w-8 h-8 rounded-full border-2 mr-4 items-center justify-center ${habit.completed
                                            ? 'bg-accent border-accent'
                                            : 'border-white/20 bg-white/5'
                                        }`}
                                >
                                    {habit.completed && <Check size={16} color="white" strokeWidth={3} />}
                                </View>
                                <View>
                                    <Text className={`text-lg font-bold ${habit.completed ? 'text-white/50 line-through' : 'text-white'}`}>
                                        {habit.name}
                                    </Text>
                                    <Text className="text-text-muted text-xs">Daily Goal</Text>
                                </View>
                            </View>

                            <View className="flex-row items-center bg-primary/50 px-3 py-1.5 rounded-lg">
                                <Text className="text-white font-bold mr-1.5">{habit.streak}</Text>
                                <Flame size={14} color={habit.color || '#F59E0B'} fill={habit.color || '#F59E0B'} />
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
