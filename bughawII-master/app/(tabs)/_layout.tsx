import React from 'react';
import { Tabs } from 'expo-router';
import { CustomTabBar } from '../../components/CustomTabBar';

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="directory"
        options={{
          title: 'Directory',
        }}
      />
      <Tabs.Screen
        name="faculty"
        options={{
          title: 'Faculty',
          href: null,
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: 'Gallery',
        }}
      />
      <Tabs.Screen
        name="sections"
        options={{
          title: 'Sections',
          href: null,
        }}
      />
      <Tabs.Screen
        name="discovery"
        options={{
          title: 'Discover',
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'More',
        }}
      />
    </Tabs>
  );
}
