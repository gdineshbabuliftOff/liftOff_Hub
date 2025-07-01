import { BirthDayAnniversary } from '@/components/Api/adminApi';
import { isAdmin, isEditor, viewUsers } from '@/utils/permissions';
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { Tabs } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

function AnimatedIcon({
  focused,
  children,
}: {
  focused: boolean;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(focused ? 1.2 : 1);

  useEffect(() => {
    scale.value = withTiming(focused ? 1.2 : 1, { duration: 200 });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showDashboard, setShowDashboard] = useState(false);
  const [showNotificationDot, setShowNotificationDot] = useState(false);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(true);

  const checkPermissions = async () => {
    try {
      const admin = await isAdmin();
      const editor = await isEditor();
      const viewusers = await viewUsers();
      const canViewDashboard = admin || (editor && viewusers);
      setShowDashboard(canViewDashboard);
    } catch (error) {
      console.error('Error checking permissions:', error);
      setShowDashboard(false);
    } finally {
      setIsLoadingPermissions(false);
    }
  };

  const checkNotificationStatus = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      const lastSeen = await AsyncStorage.getItem('lastSeenNotification');
      const notifications = await BirthDayAnniversary();
      const hasNotifications =
        Array.isArray(notifications) &&
        notifications.some(
          (group) => Array.isArray(group.events) && group.events.length > 0
        );
      const shouldShowDot = hasNotifications && lastSeen !== today;
      setShowNotificationDot(shouldShowDot);
    } catch (error) {
      console.error('Error checking notifications:', error);
      setShowNotificationDot(false);
    }
  };

  const markNotificationsAsSeen = async () => {
    try {
      const today = dayjs().format('YYYY-MM-DD');
      await AsyncStorage.setItem('lastSeenNotification', today);
      setShowNotificationDot(false);
    } catch (error) {
      console.error('Error marking notifications as seen:', error);
    }
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkNotificationStatus();
    }, [])
  );

  if (isLoadingPermissions) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#1a1a1a' : '#f0f0f0' }}>
        <Text style={{ fontSize: 18, color: isDark ? '#fff' : '#000' }}>
          Loading app...
        </Text>
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: isDark ? '#888' : '#aaa',
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingTop: 4,
          elevation: 10,
          backgroundColor: '#fff',
          height: 70,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        tabBarLabel: ({ focused, color }) => (
          <Animated.Text style={{ color, fontSize: 11, fontWeight: '500' }}>
            {route.name.charAt(0).toUpperCase() + route.name.slice(1)}
          </Animated.Text>
        ),
        tabBarIcon: ({ focused, color }) => {
          const size = focused ? 26 : 20;
          switch (route.name) {
            case 'dashboard':
              return (
                <AnimatedIcon focused={focused}>
                  <Ionicons
                    name={focused ? 'grid' : 'grid-outline'}
                    size={size}
                    color={color}
                  />
                </AnimatedIcon>
              );
            case 'profile':
              return (
                <AnimatedIcon focused={focused}>
                  <MaterialIcons
                    name={focused ? 'person' : 'person-outline'}
                    size={size}
                    color={color}
                  />
                </AnimatedIcon>
              );
            case 'contacts':
              return (
                <AnimatedIcon focused={focused}>
                  <Feather name={focused ? 'users' : 'user'} size={size} color={color} />
                </AnimatedIcon>
              );
            case 'policy':
              return (
                <AnimatedIcon focused={focused}>
                  <FontAwesome5 name="file-alt" size={size} color={color} />
                </AnimatedIcon>
              );
            case 'notification':
              return (
                <AnimatedIcon focused={focused}>
                  <View>
                    <Ionicons
                      name={focused ? 'notifications' : 'notifications-outline'}
                      size={size}
                      color={color}
                    />
                    {showNotificationDot && (
                      <View
                        style={{
                          position: 'absolute',
                          top: -2,
                          right: -2,
                          width: 10,
                          height: 10,
                          borderRadius: 5,
                          backgroundColor: 'red',
                        }}
                      />
                    )}
                  </View>
                </AnimatedIcon>
              );
            default:
              return null;
          }
        },
        tabBarHideOnKeyboard: true,
      })}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          href: showDashboard ? '/dashboard' : null,
        }}
      />

      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      <Tabs.Screen name="contacts" options={{ title: 'Contacts' }} />
      <Tabs.Screen name="policy" options={{ title: 'Policy' }} />
      <Tabs.Screen
        name="notification"
        options={{ title: 'Notification' }}
        listeners={({ route }) => ({
          tabPress: (e) => {
            if (route.name === 'notification') {
              if (showNotificationDot) {
                markNotificationsAsSeen();
              }
            }
          },
        })}
      />
    </Tabs>
  );
}