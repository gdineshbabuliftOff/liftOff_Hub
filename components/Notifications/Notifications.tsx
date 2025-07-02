import { openURL } from '@/utils/navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';
import { Image } from 'expo-image';
import * as Notifications from 'expo-notifications';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { BirthDayAnniversary } from '../Api/adminApi';
import Card from '../Layouts/Card';
import { styles } from '../Styles/Notification';

interface Notification {
  fullName: string;
  email: string;
  type: 'birthday' | 'anniversary';
  years?: number;
}

interface NotificationGroup {
  date: string;
  events: Notification[];
}

const requestNotificationPermission = async () => {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
};

const scheduleTodayNotificationIfNeeded = async (eventsToday: Notification[]) => {
  const now = dayjs();
  const nineAM = now.hour(9).minute(0).second(0);

  if (now.isAfter(nineAM)) {
    return;
  }

  if (eventsToday.length > 0) {
    const titles = eventsToday
      .map(e => e.fullName + (e.type === 'birthday' ? ' (Birthday)' : ' (Anniversary)'))
      .join(', ');

    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Today\'s Events',
        body: `Celebrations: ${titles}`,
        sound: true,
      },
      trigger: {
        type: 'calendar',
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  }
};

const NotificationsSection = () => {
  const [notifications, setNotifications] = useState<NotificationGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
    requestNotificationPermission();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const markNotificationsAsSeen = async () => {
        const today = dayjs().format('YYYY-MM-DD');
        await AsyncStorage.setItem('lastSeenNotification', today);
      };
      markNotificationsAsSeen();
    }, [])
  );

  const fetchNotifications = async () => {
    try {
      if (!refreshing) setLoading(true);
      const data: NotificationGroup[] = await BirthDayAnniversary();
      setNotifications(data);

      const today = dayjs().format('YYYY-MM-DD');
      const todayGroup = data.find(group => group.date === today);
      if (todayGroup) {
        scheduleTodayNotificationIfNeeded(todayGroup.events);
      }
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const getMessage = (item: Notification, date: string) => {
    const isToday = dayjs().isSame(date, 'day');
    if (item.type === 'birthday') {
      return isToday ? `Birthday is today 🎉` : `Upcoming Birthday 🎉`;
    } else {
      if (item.years === 0) {
        return `Joined today at Liftoff 🎊`;
      } else if (isToday) {
        const suffix = getOrdinalSuffix(item.years!);
        return `Completed ${item.years}${suffix} anniversary 🎊`;
      } else {
        const suffix = getOrdinalSuffix(item.years!);
        return `Celebrating ${item.years}${suffix} anniversary 🎊`;
      }
    }
  };

  const getOrdinalSuffix = (num: number) => {
    if (num % 100 >= 11 && num % 100 <= 13) return 'th';
    switch (num % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const formatDate = (date: string) => {
    const today = dayjs().format('YYYY-MM-DD');
    if (dayjs(date).format('YYYY-MM-DD') === today) {
      return 'Today';
    }
    const day = dayjs(date).date();
    const month = dayjs(date).format('MMM');
    return `${day}${getOrdinalSuffix(day)} ${month}`;
  };

  const renderNotificationItem = ({ item, date }: { item: Notification; date: string }) => (
    <Pressable
      style={[
        styles.notificationItem,
        item.type === 'birthday' ? styles.birthday : styles.anniversary,
      ]}
      onPress={() => openURL(`/contacts?email=${item?.email}`)}
    >
      <Image
        source={
          item.type === 'birthday'
            ? require('../../assets/videos/birthday2.gif')
            : require('../../assets/videos/anniversary.gif')
        }
        style={styles.icon}
      />
      <View style={styles.textContainer}>
        <Text style={styles.nameText}>{item.fullName}</Text>
        <Text style={styles.messageText}>{getMessage(item, date)}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Card
        topNavBackgroundColor="fff"
        topNavContent={<Text style={styles.header}>Notifications</Text>}
      >
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#000" />
          </View>
        ) : (
          <FlatList
            data={notifications}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            renderItem={({ item }) => (
              <View style={styles.dateGroup}>
                <Text style={styles.groupDate}>{formatDate(item.date)}</Text>
                <FlatList
                  data={item.events}
                  renderItem={({ item: event }) =>
                    renderNotificationItem({ item: event, date: item.date })
                  }
                  keyExtractor={(event, index) => `${event.email}-${index}`}
                />
              </View>
            )}
            keyExtractor={(item, index) => `${item.date}-${index}`}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Image
                  source={require('../../assets/images/noemployee.png')}
                  style={styles.noEmployeeImage}
                />
                <Text style={styles.emptyText}>
                  There are no events for the next 7 days.
                </Text>
              </View>
            }
          />
        )}
      </Card>
    </View>
  );
};

export default NotificationsSection;
