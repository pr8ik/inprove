import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, StatusBar, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { BarChart2, TrendingUp, TrendingDown, Calendar, Award, Clock, Target } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

const TIME_RANGES = [
    { label: '7D', days: 7 },
    { label: '14D', days: 14 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
];

export default function Analytics() {
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState(7);
    const [stats, setStats] = useState<any>(null);
    const [comparison, setComparison] = useState<any>(null);

    const fetchAnalytics = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const endDate = new Date();
        const startDate = subDays(endDate, timeRange);
        const previousStartDate = subDays(startDate, timeRange);

        // Fetch Current Period Data
        const { data: currentLogs } = await supabase
            .from('time_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('start_time', startOfDay(startDate).toISOString())
            .lte('start_time', endOfDay(endDate).toISOString());

        // Fetch Previous Period Data (for comparison)
        const { data: prevLogs } = await supabase
            .from('time_logs')
            .select('*')
            .eq('user_id', user.id)
            .gte('start_time', startOfDay(previousStartDate).toISOString())
            .lte('start_time', endOfDay(startDate).toISOString());

        processStats(currentLogs || [], prevLogs || []);
        setLoading(false);
    };

    const processStats = (current: any[], previous: any[]) => {
        // Helper to calculate totals
        const calcTotalTime = (logs: any[]) => logs.reduce((acc, log) => acc + (log.duration_seconds || 0), 0);
        const calcTotalValue = (logs: any[]) => logs.reduce((acc, log) => acc + (log.value_score || 0), 0);

        const totalTime = calcTotalTime(current);
        const prevTotalTime = calcTotalTime(previous);

        const totalValue = calcTotalValue(current);
        const prevTotalValue = calcTotalValue(previous);

        // Category Breakdown (Time & Value)
        const categoryStats: any = {};
        current.forEach(log => {
            // Extract tags from note or use 'Uncategorized'
            const tags = log.note?.match(/Tags: (.*)/)?.[1]?.split(', ') || ['Uncategorized'];
            tags.forEach((tag: string) => {
                if (!categoryStats[tag]) categoryStats[tag] = { time: 0, value: 0, count: 0 };
                categoryStats[tag].time += log.duration_seconds || 0;
                categoryStats[tag].value += log.value_score || 0;
                categoryStats[tag].count += 1;
            });
        });

        // Sort categories by Value
        const sortedCategories = Object.entries(categoryStats)
            .map(([name, data]: [string, any]) => ({ name, ...data }))
            .sort((a, b) => b.value - a.value);

        setStats({
            totalTime,
            totalValue,
            avgValue: current.length ? (totalValue / current.length).toFixed(1) : 0,
            valuePerHour: totalTime > 0 ? ((totalValue / (totalTime / 3600))).toFixed(1) : 0,
            categories: sortedCategories,
            sessionCount: current.length,
        });

        setComparison({
            timeChange: prevTotalTime ? ((totalTime - prevTotalTime) / prevTotalTime) * 100 : 0,
            valueChange: prevTotalValue ? ((totalValue - prevTotalValue) / prevTotalValue) * 100 : 0,
        });
    };

    useFocusEffect(
        useCallback(() => {
            fetchAnalytics();
        }, [timeRange])
    );

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    return (
        <SafeAreaView className="flex-1 bg-primary">
            <StatusBar barStyle="light-content" />
            <ScrollView className="flex-1 px-5 pt-12">
                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-white text-3xl font-bold">Analytics</Text>
                    <View className="flex-row bg-secondary rounded-lg p-1">
                        {TIME_RANGES.map((range) => (
                            <TouchableOpacity
                                key={range.days}
                                onPress={() => setTimeRange(range.days)}
                                className={`px-3 py-1.5 rounded-md ${timeRange === range.days ? 'bg-accent' : ''}`}
                            >
                                <Text className={`text-xs font-bold ${timeRange === range.days ? 'text-white' : 'text-text-muted'}`}>
                                    {range.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {loading ? (
                    <ActivityIndicator size="large" color="#3B82F6" className="mt-20" />
                ) : (
                    <>
                        {/* Key Metrics Grid */}
                        <View className="flex-row flex-wrap gap-3 mb-6">
                            {/* Total Time */}
                            <View className="flex-1 min-w-[45%] bg-secondary p-4 rounded-2xl border border-white/5">
                                <View className="flex-row justify-between items-start mb-2">
                                    <Clock size={20} color="#3B82F6" />
                                    {comparison.timeChange !== 0 && (
                                        <View className="flex-row items-center">
                                            {comparison.timeChange > 0 ? <TrendingUp size={12} color="#10B981" /> : <TrendingDown size={12} color="#EF4444" />}
                                            <Text className={`text-xs font-bold ml-1 ${comparison.timeChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {Math.abs(comparison.timeChange).toFixed(0)}%
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text className="text-text-muted text-xs uppercase font-bold">Total Time</Text>
                                <Text className="text-white text-xl font-extrabold mt-1">{formatDuration(stats.totalTime)}</Text>
                            </View>

                            {/* Total Value */}
                            <View className="flex-1 min-w-[45%] bg-secondary p-4 rounded-2xl border border-white/5">
                                <View className="flex-row justify-between items-start mb-2">
                                    <Award size={20} color="#F59E0B" />
                                    {comparison.valueChange !== 0 && (
                                        <View className="flex-row items-center">
                                            {comparison.valueChange > 0 ? <TrendingUp size={12} color="#10B981" /> : <TrendingDown size={12} color="#EF4444" />}
                                            <Text className={`text-xs font-bold ml-1 ${comparison.valueChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {Math.abs(comparison.valueChange).toFixed(0)}%
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <Text className="text-text-muted text-xs uppercase font-bold">Total Value</Text>
                                <Text className="text-white text-xl font-extrabold mt-1">{stats.totalValue} pts</Text>
                            </View>

                            {/* Avg Value */}
                            <View className="flex-1 min-w-[45%] bg-secondary p-4 rounded-2xl border border-white/5">
                                <Target size={20} color="#8B5CF6" className="mb-2" />
                                <Text className="text-text-muted text-xs uppercase font-bold">Avg Value</Text>
                                <Text className="text-white text-xl font-extrabold mt-1">{stats.avgValue} pts</Text>
                            </View>

                            {/* Value/Hour */}
                            <View className="flex-1 min-w-[45%] bg-secondary p-4 rounded-2xl border border-white/5">
                                <BarChart2 size={20} color="#10B981" className="mb-2" />
                                <Text className="text-text-muted text-xs uppercase font-bold">Value/Hour</Text>
                                <Text className="text-white text-xl font-extrabold mt-1">{stats.valuePerHour} pts</Text>
                            </View>
                        </View>

                        {/* Efficiency Chart */}
                        <View className="bg-secondary p-5 rounded-3xl border border-white/5 mb-6">
                            <Text className="text-white text-lg font-bold mb-6">Efficiency (Value / Hour)</Text>
                            <View className="flex-row items-end gap-2" style={{ height: 180 }}>
                                {stats.categories.slice(0, 5).map((cat: any, index: number) => {
                                    const hours = cat.time / 3600;
                                    const ratio = hours > 0 ? cat.value / hours : 0;
                                    const maxRatio = Math.max(...stats.categories.slice(0, 5).map((c: any) => c.time > 0 ? c.value / (c.time / 3600) : 0), 1);
                                    const heightPx = Math.max((ratio / maxRatio) * 140, 10);

                                    return (
                                        <View key={index} className="flex-1 items-center">
                                            <View className="w-full bg-accent/20 rounded-t-lg relative" style={{ height: heightPx }}>
                                                <View className="absolute bottom-0 w-full bg-accent rounded-t-lg" style={{ height: '100%' }} />
                                            </View>
                                            <Text className="text-white text-xs font-bold mt-2 text-center" numberOfLines={1}>{cat.name}</Text>
                                            <Text className="text-text-muted text-[10px]">{ratio.toFixed(1)}/hr</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Time vs Value Breakdown */}
                        <View className="bg-secondary p-5 rounded-3xl border border-white/5 mb-6">
                            <Text className="text-white text-lg font-bold mb-4">Time vs Value by Category</Text>
                            {stats.categories.map((cat: any, index: number) => {
                                const timePercent = (cat.time / stats.totalTime) * 100;
                                const valuePercent = stats.totalValue > 0 ? (cat.value / stats.totalValue) * 100 : 0;

                                return (
                                    <View key={index} className="mb-4">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-white font-bold">{cat.name}</Text>
                                            <Text className="text-text-muted text-xs">{cat.count} sessions</Text>
                                        </View>

                                        {/* Time Bar */}
                                        <View className="mb-1">
                                            <Text className="text-text-muted text-[10px] mb-1">Time: {formatDuration(cat.time)}</Text>
                                            <View className="h-2 bg-tertiary rounded-full overflow-hidden">
                                                <View className="h-full bg-blue-500 rounded-full" style={{ width: `${timePercent}%` }} />
                                            </View>
                                        </View>

                                        {/* Value Bar */}
                                        <View>
                                            <Text className="text-text-muted text-[10px] mb-1">Value: {cat.value} pts</Text>
                                            <View className="h-2 bg-tertiary rounded-full overflow-hidden">
                                                <View className="h-full bg-amber-500 rounded-full" style={{ width: `${valuePercent}%` }} />
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Summary Stats */}
                        <View className="bg-secondary p-5 rounded-3xl border border-white/5 mb-24">
                            <Text className="text-white text-lg font-bold mb-4">Summary</Text>
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-text-muted">Total Sessions</Text>
                                <Text className="text-white font-bold">{stats.sessionCount}</Text>
                            </View>
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-text-muted">Total Time Tracked</Text>
                                <Text className="text-white font-bold">{formatDuration(stats.totalTime)}</Text>
                            </View>
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-text-muted">Total Value Points</Text>
                                <Text className="text-white font-bold">{stats.totalValue} pts</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-text-muted">Most Productive Category</Text>
                                <Text className="text-white font-bold">{stats.categories[0]?.name || 'N/A'}</Text>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
