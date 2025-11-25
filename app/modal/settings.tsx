import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert, Switch, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { X, LogOut, Moon, Bell, User } from 'lucide-react-native';

export default function SettingsModal() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        getUser();
    }, []);

    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.full_name) {
            setName(user.user_metadata.full_name);
        } else {
            // Set default name for existing users
            setName('Pratik Acharya');
            // Auto-update the user's profile
            await supabase.auth.updateUser({
                data: { full_name: 'Pratik Acharya' }
            });
        }
    };

    const handleUpdateName = async () => {
        if (!name.trim()) return;
        setUpdating(true);
        const { error } = await supabase.auth.updateUser({
            data: { full_name: name }
        });

        if (error) {
            Alert.alert('Error', error.message);
        } else {
            Alert.alert('Success', 'Profile updated!');
        }
        setUpdating(false);
    };

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Error', error.message);
        } else {
            router.replace('/(auth)/login');
        }
    };

    return (
        <View className="flex-1 bg-primary p-6">
            <View className="flex-row justify-between items-center mb-8 mt-4">
                <Text className="text-white text-3xl font-extrabold tracking-tight">Settings</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-secondary p-2 rounded-full">
                    <X size={24} color="white" />
                </TouchableOpacity>
            </View>

            <View className="bg-secondary rounded-2xl p-4 mb-6 border border-white/5">
                <View className="mb-4 border-b border-white/5 pb-4">
                    <View className="flex-row items-center mb-2">
                        <User size={20} color="#94A3B8" />
                        <Text className="text-white text-lg ml-3 font-medium">Profile Name</Text>
                    </View>
                    <View className="flex-row gap-2">
                        <TextInput
                            className="flex-1 bg-tertiary text-white p-3 rounded-xl border border-white/5"
                            value={name}
                            onChangeText={setName}
                            placeholder="Your Name"
                            placeholderTextColor="#666"
                        />
                        <TouchableOpacity
                            onPress={handleUpdateName}
                            disabled={updating}
                            className="bg-accent px-4 justify-center rounded-xl"
                        >
                            <Text className="text-white font-bold">{updating ? '...' : 'Save'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View className="flex-row justify-between items-center py-3 border-b border-white/5">
                    <View className="flex-row items-center">
                        <Moon size={20} color="#94A3B8" />
                        <Text className="text-white text-lg ml-3 font-medium">Dark Mode</Text>
                    </View>
                    <Switch value={true} trackColor={{ false: '#334155', true: '#3B82F6' }} />
                </View>
                <View className="flex-row justify-between items-center py-3">
                    <View className="flex-row items-center">
                        <Bell size={20} color="#94A3B8" />
                        <Text className="text-white text-lg ml-3 font-medium">Notifications</Text>
                    </View>
                    <Switch value={false} trackColor={{ false: '#334155', true: '#3B82F6' }} />
                </View>
            </View>

            <TouchableOpacity
                onPress={handleLogout}
                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex-row items-center justify-center"
            >
                <LogOut size={20} color="#EF4444" className="mr-2" />
                <Text className="text-red-500 font-bold text-lg">Log Out</Text>
            </TouchableOpacity>

            <View className="mt-auto items-center">
                <Text className="text-text-muted text-xs">INPROVE v1.0.0</Text>
            </View>
        </View>
    );
}
