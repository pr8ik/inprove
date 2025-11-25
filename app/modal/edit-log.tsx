import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StatusBar, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Trash2, Save, AlertCircle } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { format, differenceInMinutes, isSameDay } from 'date-fns';
import DateTimePickerComponent from '../../components/ui/DateTimePicker';

export default function EditLogModal() {
    const router = useRouter();
    const { id } = useLocalSearchParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form State
    const [taskName, setTaskName] = useState('');
    const [note, setNote] = useState('');
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [valueScore, setValueScore] = useState('');
    const [startTime, setStartTime] = useState(new Date());
    const [endTime, setEndTime] = useState(new Date());

    // Original data for reference
    const [originalLog, setOriginalLog] = useState<any>(null);

    // Categories
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

    const toggleCategory = (id: string) => {
        if (selectedCategories.includes(id)) {
            setSelectedCategories(selectedCategories.filter(c => c !== id));
        } else {
            setSelectedCategories([...selectedCategories, id]);
        }
    };

    useEffect(() => {
        fetchLogDetails();
    }, [id]);

    const fetchLogDetails = async () => {
        if (!id) return;
        const { data, error } = await supabase
            .from('time_logs')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            Alert.alert('Error', 'Could not fetch log details');
            router.back();
            return;
        }

        setOriginalLog(data);

        // Parse task name, notes, and tags
        const fullNote = data.note || '';
        const lines = fullNote.split('\n');

        let extractedTaskName = lines[0] || '';
        let extractedTags = '';
        let extractedNoteLines: string[] = [];

        // Look for Tags line
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            if (line.trim().startsWith('Tags:')) {
                extractedTags = line.replace('Tags:', '').trim();
            } else {
                extractedNoteLines.push(line);
            }
        }

        setTaskName(extractedTaskName);
        setNote(extractedNoteLines.join('\n').trim());
        // Parse tags into selected categories
        if (extractedTags) {
            const tagArray = extractedTags.split(',').map(t => t.trim()).filter(t => t);
            setSelectedCategories(tagArray);
        }

        setValueScore(data.value_score?.toString() || '');
        setStartTime(new Date(data.start_time));
        setEndTime(data.end_time ? new Date(data.end_time) : new Date());

        setFetching(false);
    };

    const isCrossDay = () => {
        return !isSameDay(startTime, endTime);
    };

    const handleSave = async () => {
        // Validation
        if (endTime <= startTime) {
            Alert.alert('Invalid Times', 'End time must be after start time');
            return;
        }

        setLoading(true);

        const durationSeconds = differenceInMinutes(endTime, startTime) * 60;

        // Rebuild note with tags
        const tagsString = selectedCategories.join(', ');
        const finalNote = `${taskName}\n${note || ''}\nTags: ${tagsString}`;

        const { error } = await supabase
            .from('time_logs')
            .update({
                note: finalNote,
                value_score: valueScore ? parseInt(valueScore) : null,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                duration_seconds: durationSeconds
            })
            .eq('id', id);

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.back();
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        Alert.alert('Delete Log', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    const { error } = await supabase.from('time_logs').delete().eq('id', id);
                    if (!error) router.back();
                }
            }
        ]);
    };

    if (fetching) return <View className="flex-1 bg-secondary items-center justify-center"><Text className="text-white">Loading...</Text></View>;

    return (
        <View className="flex-1 bg-secondary">
            <StatusBar barStyle="light-content" />
            <ScrollView className="flex-1 p-6">
                <View className="flex-row justify-between items-center mb-8 mt-4">
                    <Text className="text-white text-3xl font-extrabold tracking-tight">Edit Session</Text>
                    <TouchableOpacity onPress={() => router.back()} className="bg-tertiary p-2 rounded-full">
                        <X size={24} color="white" />
                    </TouchableOpacity>
                </View>

                {/* Task Name */}
                <View className="mb-6">
                    <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Task Name</Text>
                    <TextInput
                        className="bg-tertiary text-white p-4 rounded-2xl border border-white/5 text-lg font-bold"
                        value={taskName}
                        onChangeText={setTaskName}
                        placeholder="What did you work on?"
                        placeholderTextColor="#666"
                    />
                </View>

                {/* Cross-Day Indicator */}
                {isCrossDay() && (
                    <View className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex-row items-center">
                        <AlertCircle size={20} color="#F59E0B" />
                        <Text className="text-amber-500 ml-2 font-semibold">
                            This task spans across {format(startTime, 'MMM dd')} - {format(endTime, 'MMM dd')}
                        </Text>
                    </View>
                )}

                {/* Date/Time Pickers */}
                <DateTimePickerComponent
                    label="Start Date & Time"
                    value={startTime}
                    onChange={setStartTime}
                    mode="datetime"
                />

                <DateTimePickerComponent
                    label="End Date & Time"
                    value={endTime}
                    onChange={setEndTime}
                    mode="datetime"
                    minimumDate={startTime}
                />

                {/* Duration Display */}
                <View className="mb-6 bg-primary/50 rounded-xl p-4">
                    <Text className="text-text-muted text-xs uppercase mb-1">Duration</Text>
                    <Text className="text-white text-2xl font-bold">
                        {Math.floor(differenceInMinutes(endTime, startTime) / 60)}h {differenceInMinutes(endTime, startTime) % 60}m
                    </Text>
                </View>

                {/* Categories */}
                <View className="mb-6">
                    <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Categories (Multi-select)</Text>
                    <View className="flex-row flex-wrap gap-2">
                        {categories.map((cat) => {
                            const isSelected = selectedCategories.includes(cat.id);
                            return (
                                <TouchableOpacity
                                    key={cat.id}
                                    onPress={() => toggleCategory(cat.id)}
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

                {/* Notes */}
                <View className="mb-6">
                    <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Additional Notes</Text>
                    <TextInput
                        className="bg-tertiary text-white p-4 rounded-2xl border border-white/5 text-base"
                        value={note}
                        onChangeText={setNote}
                        multiline
                        numberOfLines={3}
                        placeholder="Optional details..."
                        placeholderTextColor="#666"
                    />
                </View>

                {/* Value Score */}
                <View className="mb-6">
                    <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-2">Value Score</Text>
                    <TextInput
                        className="bg-tertiary text-white p-4 rounded-2xl border border-white/5 text-lg"
                        value={valueScore}
                        onChangeText={setValueScore}
                        keyboardType="numeric"
                        placeholder="1-10"
                        placeholderTextColor="#666"
                    />
                </View>

                {/* Delete Button */}
                <TouchableOpacity
                    onPress={handleDelete}
                    className="flex-row items-center justify-center p-4 mb-24"
                >
                    <Trash2 size={20} color="#EF4444" className="mr-2" />
                    <Text className="text-red-500 font-bold">Delete Entry</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Footer Button */}
            <View className="absolute bottom-0 left-0 right-0 p-6 bg-secondary border-t border-white/5">
                <TouchableOpacity
                    className="bg-accent p-5 rounded-2xl items-center flex-row justify-center shadow-lg"
                    onPress={handleSave}
                    disabled={loading}
                >
                    <Save size={24} color="white" />
                    <Text className="text-white font-black text-xl ml-3 tracking-wide">SAVE CHANGES</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
