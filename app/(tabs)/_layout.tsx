import { Tabs } from 'expo-router';
import { Chrome as Home, Clock, CheckSquare, BarChart2 } from 'lucide-react-native';
import { View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F172A', // Slate 900
          borderTopColor: '#1E293B', // Slate 800
          height: 80,
          paddingTop: 10,
        },
        tabBarActiveTintColor: '#3B82F6', // Electric Blue
        tabBarInactiveTintColor: '#94A3B8', // Slate 400
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 10,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Home size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: 'Timeline',
          tabBarIcon: ({ color }) => <Clock size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="habits"
        options={{
          title: 'Habits',
          tabBarIcon: ({ color }) => <CheckSquare size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <BarChart2 size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}
