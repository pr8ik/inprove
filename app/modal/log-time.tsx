import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StatusBar, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../lib/store';
import { X, Play, Square, Save } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { differenceInMinutes } from 'date-fns';
import SimpleDateTimePicker from '../../components/ui/SimpleDateTimePicker';

export default function LogTimeModal() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { activeTimer, setActiveTimer } = useStore();
    const [taskName, setTaskName] = useState('');
    const [note, setNote] = useState('');
    const [valueScore, setValueScore] = useState('');
    const [loading, setLoading] = useState(false);

    // Manual Entry Mode
    const [isManualMode, setIsManualMode] = useState(params.manual === 'true');
    const [manualStartTime, setManualStartTime] = useState(new Date());
    const [manualEndTime, setManualEndTime] = useState<Date | null>(params.manual === 'true' ? new Date() : null);

    // Updated Categories
    const categories = [
        { id: 'work', name: 'Work', color: '#3B82F6' },
        { id: 'wellbeing', name: 'Wellbeing', color: '#10B981' },
        { id: 'general', name: 'General', color: '#9CA3AF' },
        { id: 'learning', name: 'Learning', color: '#F97316' },
        { id: 'deep_work', name: 'Deep Work', color: '#8B5CF6' },
        { id: 'entertainment', name: 'Entertainment', color: '#EC4899' },
        { id: 'family', name: 'Family', color: '#EF4444' },
        { id: 'others', name: 'Others', color: '#6B7280' },
    ];
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    useEffect(() => {
        if (activeTimer) {
            setTaskName(activeTimer.taskName || '');
            setNote(activeTimer.note || '');
            setSelectedCategories(activeTimer.categoryIds || []);
            setValueScore(activeTimer.valueScore || '');
        }
    }, [activeTimer]);

    const toggleCategory = (id: string) => {
        if (selectedCategories.includes(id)) {
            setSelectedCategories(selectedCategories.filter(c => c !== id));
        } else {
            setSelectedCategories([...selectedCategories, id]);
        }
    };

    const handleStart = async () => {
        if (!taskName.trim()) {
            Alert.alert('Required', 'Please enter a task name.');
            return;
        }
        setActiveTimer({
            startTime: isManualMode ? manualStartTime : new Date(),
            categoryIds: selectedCategories,
            taskName,
            note,
            valueScore,
        });
        router.back();
    };

    const handleStop = async () => {
        if (!activeTimer) return;
        setLoading(true);

        const endTime = new Date();
        const startTime = new Date(activeTimer.startTime);
        const durationSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            console.error('Auth Error:', authError);
            Alert.alert('Session Expired', 'Please login again.', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') }
            ]);
            setLoading(false);
            return;
        }

        const tags = activeTimer.categoryIds?.join(', ');
        const finalNote = `${activeTimer.taskName}\n${activeTimer.note || ''}\nTags: ${tags}`;

        const { error } = await supabase.from('time_logs').insert({
            user_id: user.id,
            category_id: null,
            start_time: activeTimer.startTime,
            end_time: endTime,
            duration_seconds: durationSeconds,
            note: finalNote,
            value_score: valueScore ? parseInt(valueScore) : null,
        });

        if (error) {
            console.error(error);
            Alert.alert('Failed to save log', error.message);
        } else {
            setActiveTimer(null);
            router.back();
        }
        setLoading(false);
    };

    const handleManualSave = async () => {
        if (!taskName.trim()) {
            Alert.alert('Required', 'Please enter a task name.');
            return;
        }

        if (!manualEndTime) {
            Alert.alert('Required', 'Please set an end time.');
            return;
        }

        if (manualEndTime <= manualStartTime) {
            Alert.alert('Invalid Times', 'End time must be after start time.');
            return;
        }

        setLoading(true);

        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            Alert.alert('Session Expired', 'Please login again.', [
                { text: 'OK', onPress: () => router.replace('/(auth)/login') }
            ]);
            setLoading(false);
            return;
        }

        const durationSeconds = differenceInMinutes(manualEndTime, manualStartTime) * 60;
        const tags = selectedCategories.join(', ');
        const finalNote = `${taskName}\n${note || ''}\nTags: ${tags}`;

        const { error } = await supabase.from('time_logs').insert({
            user_id: user.id,
            category_id: null,
            start_time: manualStartTime.toISOString(),
            end_time: manualEndTime.toISOString(),
            duration_seconds: durationSeconds,
            note: finalNote,
            value_score: valueScore ? parseInt(valueScore) : null,
        });

        if (error) {
            console.error(error);
            Alert.alert('Failed to save log', error.message);
        } else {
            router.back();
        }
        setLoading(false);
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#1E293B' }}>
            <StatusBar barStyle="light-content" />
            <ScrollView className="flex-1 p-6">
                <View className="flex-row justify-between items-center mb-8 mt-4">
                    <Text className="text-white text-3xl font-extrabold tracking-tight">
                        {activeTimer ? 'Stop Session' : 'New Session'}
                    </Text>
                    <TouchableOpacity onPress={() => router.back()} className="bg-tertiary p-2 rounded-full">
                        <X size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* TODO: Manual mode temporarily disabled due to NativeWind navigation context conflict */}
                {/* Will fix after Timeline enhancements */}
                {false && !activeTimer && (
                    <View key="mode-toggle" className="flex-row bg-tertiary p-1 rounded-xl mb-6">
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg items-center ${!isManualMode ? 'bg-secondary shadow-sm' : ''}`}
                            onPress={() => setIsManualMode(false)}
                            activeOpacity={0.7}
                        >
                            <Text className={`font-bold ${!isManualMode ? 'text-white' : 'text-text-muted'}`}>Stopwatch</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className={`flex-1 py-3 rounded-lg items-center ${isManualMode ? 'bg-secondary shadow-sm' : ''}`}
                            onPress={() => setIsManualMode(true)}
                            activeOpacity={0.7}
                        >
                            <Text className={`font-bold ${isManualMode ? 'text-white' : 'text-text-muted'}`}>Manual Entry</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Task Name */}
                <View className="mb-6">
                    <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Task Name *</Text>
                    <TextInput
                        className="bg-tertiary text-white p-4 rounded-2xl border border-white/5 text-lg font-bold"
                        placeholder="e.g. Project Proposal"
                        placeholderTextColor="#666"
                        value={taskName}
                        onChangeText={setTaskName}
                        editable={!activeTimer}
                    />
                </View>

                {/* Manual Time Entry Fields */}
                {isManualMode && !activeTimer && (
                    <>
                        <SimpleDateTimePicker
                            label="Start Time"
                            value={manualStartTime}
                            onChange={setManualStartTime}
                            mode="datetime"
                        />

                        <SimpleDateTimePicker
                            label="End Time (Optional)"
                            value={manualEndTime || new Date()}
                            onChange={(date) => setManualEndTime(date)}
                            mode="datetime"
                            minimumDate={manualStartTime}
                        />

                        {manualEndTime && (
                            <View style={{ marginBottom: 24, backgroundColor: 'rgba(15, 23, 42, 0.5)', borderRadius: 12, padding: 16 }}>
                                <Text style={{ color: '#94A3B8', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 }}>Duration</Text>
                                <Text style={{ color: '#F8FAFC', fontSize: 24, fontWeight: '700' }}>
                                    {Math.floor(differenceInMinutes(manualEndTime, manualStartTime) / 60)}h {differenceInMinutes(manualEndTime, manualStartTime) % 60}m
                                </Text>
                            </View>
                        )}
                    </>
                )}

                {/* Categories */}
                <View className="mb-6">
                    <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Categories (Multi-select)</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {categories.map((cat) => {
                            const isSelected = selectedCategories.includes(cat.id);
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => !activeTimer && toggleCategory(cat.id)}
                                    className={`px-4 py-2 rounded-full border ${isSelected ? 'bg-accent/20 border-accent' : 'bg-tertiary border-white/5'}`}
                                >
                                    <Text className={`font-bold ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                                        {cat.name}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Value Score (Optional) */}
                <View className="mb-6">
                    <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Value Score (1-10)</Text>
                    <TextInput
                        className="bg-tertiary text-white p-4 rounded-2xl border border-white/5 text-lg"
                        placeholder="5"
                        placeholderTextColor="#666"
                        value={valueScore}
                        onChangeText={setValueScore}
                        keyboardType="numeric"
                    />
                </View>

                {/* Notes */}
                <View className="mb-24">
                    <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Notes</Text>
                    <TextInput
                        className="bg-tertiary text-white p-4 rounded-2xl border border-white/5 text-lg"
                        placeholder="Details..."
                        placeholderTextColor="#666"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>
            </ScrollView>

            {/* Footer Button */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-secondary border-t border-white/5">
                <TouchableOpacity
                    className={`p-5 rounded-2xl items-center flex-row justify-center shadow-lg ${activeTimer ? 'bg-highlight' : isManualMode ? 'bg-green-600' : 'bg-accent'
                        }`}
                    onPress={activeTimer ? handleStop : isManualMode ? handleManualSave : handleStart}
                    disabled={loading}
                >
                    {activeTimer ? (
                        <>
                            <Square size={24} color="white" fill="white" />
                            <Text className="text-white font-black text-xl ml-3 tracking-wide">FINISH SESSION</Text>
                        </>
                    ) : isManualMode ? (
                        <>
                            <Save size={24} color="white" />
                            <Text className="text-white font-black text-xl ml-3 tracking-wide">SAVE LOG</Text>
                        </>
                    ) : (
                        <>
                            <Play size={24} color="white" fill="white" />
                            <Text className="text-white font-black text-xl ml-3 tracking-wide">START TIMER</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
