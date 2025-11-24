import React from 'react';
import { View, Text, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import { BarChart2 } from 'lucide-react-native';

export default function Analytics() {
    return (
        <SafeAreaView className="flex-1 bg-primary">
            <StatusBar barStyle="light-content" />
            <ScrollView className="flex-1 px-5 pt-6">
                <View className="mb-8 mt-4">
                    <Text className="text-text-muted text-lg font-medium tracking-widest uppercase mb-1">Insights</Text>
                    <Text className="text-white text-4xl font-extrabold tracking-tight">Analytics</Text>
                </View>

                <View className="bg-secondary p-8 rounded-3xl items-center justify-center border border-white/5 min-h-[300px]">
                    <BarChart2 size={48} color="#3B82F6" className="mb-4" />
                    <Text className="text-white text-xl font-bold mb-2">Data Gathering...</Text>
                    <Text className="text-text-muted text-center px-8">
                        Track more time and habits to unlock detailed insights about your performance.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
