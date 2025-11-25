import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StatusBar, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Check, Flame } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

export default function CreateHabitModal() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedColor, setSelectedColor] = useState('#3B82F6');

    const colors = ['#3B82F6', '#10B981', '#F97316', '#EF4444', '#8B5CF6', '#EC4899'];

    const handleCreate = async () => {
        if (!name.trim()) {
            Alert.alert('Required', 'Please enter a habit name.');
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

        console.log('Creating habit for user:', user.id);

        // 1. Get or Create Active Program
        let programId;
        const { data: programs } = await supabase
            .from('habit_programs')
            .select('id')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .limit(1);

        if (programs && programs.length > 0) {
            programId = programs[0].id;
            console.log('Using existing program:', programId);
        } else {
            const { data: newProgram, error: progError } = await supabase
                .from('habit_programs')
                .insert({
                    user_id: user.id,
                    name: 'Main Program',
                    status: 'active'
                })
                .select()
                .single();

            if (progError) {
                console.error('Program creation error:', progError);
                Alert.alert('Error', progError.message);
                setLoading(false);
                return;
            }
            programId = newProgram.id;
            console.log('Created new program:', programId);
        }

        // 2. Create Habit Item
        const { data: newHabit, error } = await supabase.from('habit_items').insert({
            program_id: programId,
            // user_id: user.id, // Removed: Schema does not have user_id on habit_items
            name,
            target_value: 1,
            target_unit: 'count',
            // color: selectedColor, // Removed as column doesn't exist in DB
        }).select().single();

        if (error) {
            console.error('Habit creation error:', error);
            Alert.alert('Error', error.message);
            setLoading(false);
        } else {
            console.log('Habit created successfully:', newHabit);
            router.back();
        }
        setLoading(false);
    };

    return (
        <View className="flex-1 bg-secondary p-6">
            <StatusBar barStyle="light-content" />
            <View className="flex-row justify-between items-center mb-10 mt-4">
                <Text className="text-white text-3xl font-extrabold tracking-tight">New Habit</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-tertiary p-2 rounded-full">
                    <X size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View className="mb-8">
                <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-4">Habit Name</Text>
                <TextInput
                    className="bg-tertiary text-white p-5 rounded-2xl border border-white/5 text-lg font-bold"
                    placeholder="e.g. Read 10 Pages"
                    placeholderTextColor="#666"
                    value={name}
                    onChangeText={setName}
                />
            </View>

            <View className="mb-8">
                <Text className="text-text-muted text-sm font-bold uppercase tracking-wider mb-4">Color Code</Text>
                <View className="flex-row gap-4">
                    {colors.map((c) => (
                        <TouchableOpacity
                            key={c}
                            onPress={() => setSelectedColor(c)}
                            className={`w-12 h-12 rounded-full items-center justify-center ${selectedColor === c ? 'border-4 border-white' : ''
                                }`}
                            style={{ backgroundColor: c }}
                        >
                            {selectedColor === c && <Check size={20} color="white" />}
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            <TouchableOpacity
                className="mt-auto bg-accent p-5 rounded-2xl items-center flex-row justify-center shadow-lg"
                onPress={handleCreate}
                disabled={loading}
            >
                <Flame size={24} color="white" fill="white" />
                <Text className="text-white font-black text-xl ml-3 tracking-wide">CREATE HABIT</Text>
            </TouchableOpacity>
        </View>
    );
}
