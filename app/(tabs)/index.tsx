import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, SafeAreaView, StatusBar, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { format, isToday, isYesterday } from 'date-fns';
import { Clock, CheckCircle2, TrendingUp, Settings } from 'lucide-react-native';
import TimerFloatingButton from '../../components/ui/TimerFloatingButton';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    trackedToday: 0, // in minutes
    habitsDone: 0,
    totalHabits: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 1. Fetch Today's Tracked Time
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const { data: logs } = await supabase
          .from('time_logs')
          .select('duration_seconds')
          .eq('user_id', user.id)
          .gte('start_time', todayStart.toISOString());

        const totalSeconds = logs?.reduce((acc, curr) => acc + (curr.duration_seconds || 0), 0) || 0;

        // 2. Fetch Habits
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const { count: habitsDone } = await supabase
          .from('habit_logs')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('date', todayStr)
          .eq('is_completed', true);

        const { count: totalHabits } = await supabase
          .from('habit_items')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats({
          trackedToday: Math.floor(totalSeconds / 60),
          habitsDone: habitsDone || 0,
          totalHabits: totalHabits || 0
        });

        // 3. Fetch Recent Activity (Last 10 items)
        const { data: recent } = await supabase
          .from('time_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('start_time', { ascending: false })
          .limit(10);

        setRecentActivity(recent || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Motivational messages based on stats
  const getMotivationalMessage = () => {
    const hour = new Date().getHours();
    const trackedMins = stats?.total_minutes || 0;
    const valueScore = stats?.average_value || 0;

    if (trackedMins === 0 && hour < 12) return "✨ Start your day strong! Track your first activity.";
    if (trackedMins === 0) return "💪 It's never too late! Begin tracking now.";
    if (trackedMins > 0 && trackedMins < 60) return "🔥 Great start! Keep the momentum going!";
    if (trackedMins >= 60 && trackedMins < 180) return "🌟 You're doing amazing! Keep it up!";
    if (trackedMins >= 180 && trackedMins < 360) return "🚀 Incredible progress today! You're on fire!";
    if (trackedMins >= 360) return "👑 Legendary! You're absolutely crushing it!";
    return "💫 Every moment counts. You've got this!";
  };

  // Achievement badges
  const getAchievementBadge = () => {
    const trackedMins = stats?.total_minutes || 0;
    if (trackedMins >= 480) return { emoji: "🏆", text: "8+ Hours!", color: "#F59E0B" };
    if (trackedMins >= 360) return { emoji: "⭐", text: "6+ Hours!", color: "#8B5CF6" };
    if (trackedMins >= 180) return { emoji: "🎯", text: "3+ Hours!", color: "#10B981" };
    return null;
  };


  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const greeting = getGreeting();

  // Group activities by date
  const groupedActivity = recentActivity.reduce((groups: any, item) => {
    const date = format(new Date(item.start_time), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  const getDateHeader = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMM dd, yyyy');
  };

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <StatusBar barStyle="light-content" />
      <ScrollView
        className="flex-1 px-5 pt-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
      >
        {/* Header with Motivation */}
        <View className="flex-row justify-between items-start mb-6 mt-4">
          <View className="flex-1">
            <Text className="text-white text-3xl font-black tracking-tight">
              {greeting}, {user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Improver'}!
            </Text>
            <Text className="text-text-subtle text-sm font-medium mt-2">
              {format(new Date(), 'EEEE, MMM do')}
            </Text>
            {/* Motivational Message */}
            <View className="mt-4 bg-accent/10 border border-accent/20 rounded-2xl p-4">
              <Text className="text-white text-base font-bold leading-relaxed">
                {getMotivationalMessage()}
              </Text>
            </View>
            {/* Achievement Badge */}
            {getAchievementBadge() && (
              <View className="mt-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl px-4 py-2 flex-row items-center">
                <Text className="text-3xl mr-2">{getAchievementBadge()?.emoji}</Text>
                <View>
                  <Text className="text-yellow-400 font-black text-sm">ACHIEVEMENT UNLOCKED</Text>
                  <Text className="text-white font-bold">{getAchievementBadge()?.text}</Text>
                </View>
              </View>
            )}
          </View>
          <View className="flex-row gap-3 ml-4">
            {!user && (
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login')}
                className="bg-accent px-4 py-2 rounded-full"
              >
                <Text className="text-white font-bold">Sign In</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => router.push('/modal/settings')}
              className="bg-secondary p-2.5 rounded-full border border-white/10"
            >
              <Settings size={22} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View className="flex-row gap-4 mb-8">
          {/* Tracked Today */}
          <View className="flex-1 bg-secondary p-5 rounded-3xl border border-white/10 shadow-lg">
            <View className="bg-accent/10 w-12 h-12 rounded-2xl items-center justify-center mb-3 border border-accent/20">
              <Clock size={22} color="#60A5FA" />
            </View>
            <Text className="text-text-subtle text-xs font-bold uppercase tracking-wider mb-1">Tracked Today</Text>
            <Text className="text-white text-3xl font-black tracking-tight">
              {Math.floor(stats.trackedToday / 60)}h {stats.trackedToday % 60}m
            </Text>
          </View>

          {/* Habits Progress */}
          <View className="flex-1 bg-secondary p-5 rounded-3xl border border-white/10 shadow-lg">
            <View className="bg-success/10 w-12 h-12 rounded-2xl items-center justify-center mb-3 border border-success/20">
              <CheckCircle2 size={22} color="#34D399" />
            </View>
            <Text className="text-text-subtle text-xs font-bold uppercase tracking-wider mb-1">Habits</Text>
            <Text className="text-white text-3xl font-black tracking-tight">
              {stats.habitsDone}/{stats.totalHabits}
            </Text>
          </View>
        </View>

        {/* This Week Chart/Insight */}
        <View className="bg-secondary p-6 rounded-3xl border border-white/10 mb-8 shadow-lg">
          <View className="flex-row items-center mb-4">
            <View className="bg-highlight/10 w-11 h-11 rounded-2xl items-center justify-center mr-3 border border-highlight/20">
              <TrendingUp size={20} color="#FB923C" />
            </View>
            <Text className="text-white text-xl font-extrabold">Weekly Summary</Text>
          </View>
          {/* Placeholder for chart/insight content */}
          <Text className="text-text-muted text-sm">Insights and trends will appear here soon!</Text>
        </View>

        {/* Recent Activity with Positive Empty State */}
        <View className="mb-24">
          <View className="flex-row justify-between items-center mb-5">
            <Text className="text-white text-2xl font-black tracking-tight">Recent Activity</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/timeline')}>
              <Text className="text-accentLight font-bold text-sm">View All →</Text>
            </TouchableOpacity>
          </View>

          {recentActivity.length === 0 ? (
            <View className="bg-accent/5 border border-accent/20 rounded-2xl p-8 items-center">
              <Text className="text-6xl mb-4">🎯</Text>
              <Text className="text-white font-bold text-lg mb-2">Your journey starts now!</Text>
              <Text className="text-text-subtle text-center text-sm leading-relaxed mb-4">
                Every great achievement begins with a single step. Start tracking your time and watch your productivity soar!
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/modal/log-time')}
                className="bg-accent px-6 py-3 rounded-full mt-2"
                activeOpacity={0.8}
              >
                <Text className="text-white font-black">Start Tracking Now 🚀</Text>
              </TouchableOpacity>
            </View>
          ) : (
            Object.keys(groupedActivity).map((date) => (
              <View key={date} className="mb-5">
                <Text className="text-text-subtle text-xs font-extrabold uppercase tracking-widest mb-3 ml-1">
                  {getDateHeader(date)}
                </Text>
                <View className="bg-secondary/80 rounded-3xl overflow-hidden border border-white/10 shadow-md">
                  {groupedActivity[date].map((item: any, index: number) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => router.push(`/modal/edit-log?id=${item.id}`)}
                      activeOpacity={0.8}
                    >
                      <View
                        className={`p-5 flex-row justify-between items-center ${index !== groupedActivity[date].length - 1 ? 'border-b border-white/5' : ''}`}
                      >
                        <View className="flex-1 mr-4">
                          <Text className="text-white font-bold text-base mb-2" numberOfLines={1}>
                            {item.note?.split('\n')[0] || 'Untitled Task'}
                          </Text>
                          <View className="flex-row items-center">
                            <Text className="text-text-subtle text-sm font-medium">
                              {format(new Date(item.start_time), 'h:mm a')}
                            </Text>
                            <Text className="text-text-subtle text-sm mx-2">•</Text>
                            <Text className="text-text-muted text-sm font-semibold">
                              {Math.floor(item.duration_seconds / 60)}min
                            </Text>
                          </View>
                        </View>
                        {item.value_score && (
                          <View className="bg-accent/10 px-3 py-2 rounded-xl border border-accent/20">
                            <Text className="text-accentLight font-black text-sm">★ {item.value_score}</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-6 left-0 right-0 items-center">
        <TimerFloatingButton />
      </View>
    </SafeAreaView>
  );
}
