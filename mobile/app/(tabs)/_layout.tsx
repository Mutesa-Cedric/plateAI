import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors'; // Ensure your Colors object has a way to access the primary color
import { useColorScheme } from '@/hooks/useColorScheme';
import { View } from 'react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors['light'].tint,
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="Home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="Metrics"
        options={{
          title: 'Metrics',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? "stats-chart" : "stats-chart-outline"} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="MealScan"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                backgroundColor: '#28785A', // Primary color
                borderRadius: 50,
                padding: 10,
                height: 50,
                marginTop: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TabBarIcon
                name={focused ? 'add' : 'add-outline'}
                color="#fff" // White color for the icon
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="Assistant"
        options={{
          title: 'Assistant',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'chatbubbles' : 'chatbubbles-outline'} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'person' : 'person-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
