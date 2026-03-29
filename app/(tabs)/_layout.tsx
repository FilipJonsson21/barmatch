import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/lib/constants';
import { GroupSessionProvider } from '@/lib/group-session-context';

type TabIcon = React.ComponentProps<typeof Ionicons>['name'];

const TAB_CONFIG: {
  name: string;
  title: string;
  icon: TabIcon;
  iconFocused: TabIcon;
}[] = [
  {
    name: 'discover',
    title: 'Discover',
    icon: 'compass-outline',
    iconFocused: 'compass',
  },
  {
    name: 'group',
    title: 'Mitt Gäng',
    icon: 'people-outline',
    iconFocused: 'people',
  },
  {
    name: 'matches',
    title: 'Matches',
    icon: 'heart-outline',
    iconFocused: 'heart',
  },
  {
    name: 'profile',
    title: 'Profil',
    icon: 'person-outline',
    iconFocused: 'person',
  },
];

export default function TabsLayout() {
  return (
    <GroupSessionProvider>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconFocused : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
    </GroupSessionProvider>
  );
}
