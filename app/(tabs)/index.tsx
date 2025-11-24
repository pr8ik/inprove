import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, SafeAreaView, StatusBar, TouchableOpacity, RefreshControl } from 'react-native';
import TimerFloatingButton from '../../components/ui/TimerFloatingButton';
import { useRouter, useFocusEffect } from 'expo-router';
import { useStore } from '../../lib/store';
import { Zap, TrendingUp, Calendar, Clock } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

export default function Dashboard() {
  const router = useRouter();
  const { theme } = useStore();
  const [greeting, setGreeting] = useState('Good Morning');
  const [user, setUser] = useState<any>(null);

  // Stats
  const [trackedToday, setTrackedToday] = useState('0h 0m');
  const [habitsDone, setHabitsDone] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);

    if (!user) {
      setTrackedToday('0h 0m');
      setHabitsDone(0);
      setRecentActivity([]);
      return;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Tracked Today
    const { data: timeLogs } = await supabase
      .from('time_logs')
      .select('duration_seconds')
      .eq('user_id', user.id)
      .gte('start_time', todayStart.toISOString())
      .lte('start_time', todayEnd.toISOString());

    if (timeLogs) {
      const totalSeconds = timeLogs.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      setTrackedToday(`${hours}h ${minutes}m`);
    }

    // 2. Habits Done
    const { count } = await supabase
      .from('habit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('date', format(new Date(), 'yyyy-MM-dd'))
      .eq('is_completed', true);

    setHabitsDone(count || 0);

    // 3. Recent Activity
    const { data: recent } = await supabase
      .from('time_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('start_time', { ascending: false })
      .limit(5);

    setRecentActivity(recent || []);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    // Dynamic Greeting
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 18) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" />
      <ScrollView
        className="flex-1 px-5 pt-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {/* Header */}
        <View className="mb-6 mt-2 flex-row justify-between items-end">
          <View>
            <Text className="text-text-muted text-xs font-bold tracking-widest uppercase mb-1">INPROVE</Text>
            <Text className="text-white text-3xl font-bold tracking-tight">
              {greeting}, {user?.email?.split('@')[0] || 'Improver'}.
            </Text>
          </View>
          {!user && (
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              className="bg-accent px-4 py-2 rounded-full"
            >
              <Text className="text-white font-bold">Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats Row */}
        <View className="flex-row gap-3 mb-6">
          <View className="flex-1 bg-secondary p-4 rounded-2xl border border-white/5">
            <Clock size={20} color="#3B82F6" className="mb-2" />
            <Text className="text-white text-2xl font-bold">{trackedToday}</Text>
            <Text className="text-text-muted text-xs font-medium uppercase">Tracked Today</Text>
          </View>
          <View className="flex-1 bg-secondary p-4 rounded-2xl border border-white/5">
            <Calendar size={20} color="#10B981" className="mb-2" />
            <Text className="text-white text-2xl font-bold">{habitsDone}</Text>
            <Text className="text-text-muted text-xs font-medium uppercase">Habits Done</Text>
          </View>
        </View>

        {/* Recent Activity Header */}
        <View className="mb-4 flex-row justify-between items-center">
          <Text className="text-white text-lg font-bold">Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/timeline')}>
            <Text className="text-accent font-bold">View All</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity List */}
        <View className="bg-secondary rounded-2xl border border-white/5 mb-24 overflow-hidden">
          {recentActivity.length === 0 ? (
            <View className="p-6 items-center">
              <Text className="text-text-muted italic">No activity yet. Start tracking!</Text>
            </View>
          ) : (
            recentActivity.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => router.push(`/modal/edit-log?id=${item.id}`)}
                activeOpacity={0.7}
              >
                <View
                  className={`p-4 flex-row justify-between items-center ${index !== recentActivity.length - 1 ? 'border-b border-white/5' : ''}`}
                >
                  <View>
                    <Text className="text-white font-bold text-base">
                      {item.note?.split('\n')[0] || 'Untitled Task'}
                    </Text>
                    <Text className="text-text-muted text-xs">
                      {format(new Date(item.start_time), 'h:mm a')} - {item.duration_seconds ? `${Math.floor(item.duration_seconds / 60)}m` : '...'}
                    </Text>
                  </View>
                  <View className="bg-tertiary px-3 py-1 rounded-full">
                    <Text className="text-text-muted text-xs font-bold">
                      {item.value_score || '-'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      <TimerFloatingButton />
    </SafeAreaView>
  );
}
