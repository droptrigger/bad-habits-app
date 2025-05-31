import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressRing from '../components/ProgressRing';
import FAB from '../components/FAB';
import { useTheme } from '../themes/ThemeContext';
import { useLanguage } from '../localization/LanguageContext';
import i18n from '../localization/i18n';
import { getHabits } from '../storage/habits';
import { useFocusEffect } from '@react-navigation/native';

const MainScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [habits, setHabits] = useState([]);
  const { theme, toggleTheme, isDark } = useTheme();
  const { lang, switchLanguage } = useLanguage();

  useFocusEffect(
    useCallback(() => {
      getHabits().then(setHabits);
    }, [])
  );

  const filteredHabits = habits.filter(habit =>
    habit.name.toLowerCase().includes(search.toLowerCase())
  );

  function getLastAttemptStart(events) {
    for (const event of events) {
      if (event.type === 'relapse' || event.type === 'start') {
        return new Date(event.date);
      }
    }
    return null;
  }

  function getCurrentProgress(events, goal) {
    const start = getLastAttemptStart(events);
    if (!start) return 0;
    const now = new Date();
    const ms = now - start;
    const days = ms / (1000 * 60 * 60 * 24);
    return Math.min(days, goal);
  }

  function getMaxStreak(events) {
    let maxStreak = 0;
    let lastStart = null;
    for (let i = events.length - 1; i >= 0; i--) {
      const ev = events[i];
      if (ev.type === 'relapse' || ev.type === 'start') {
        if (lastStart) {
          const days = (new Date(lastStart) - new Date(ev.date)) / (1000 * 60 * 60 * 24);
          if (days > maxStreak) maxStreak = days;
        }
        lastStart = ev.date;
      }
    }
    if (lastStart) {
      const days = (new Date() - new Date(lastStart)) / (1000 * 60 * 60 * 24);
      if (days > maxStreak) maxStreak = days;
    }
    return Math.floor(maxStreak);
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Верхняя панель */}
      <View style={styles.topBar}>
        <TextInput
          style={[styles.search, { color: theme.text, backgroundColor: isDark ? '#222' : '#f5f5f5', borderColor: isDark ? '#444' : '#ccc' }]}
          placeholder={i18n.t('search_placeholder') || 'Поиск...'}
          placeholderTextColor={isDark ? '#aaa' : '#888'}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={styles.settingsBtn}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.6}
        >
          <Ionicons name="settings-outline" size={26} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Список привычек */}
      <FlatList
        data={filteredHabits}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => {
          const dynamicCurrent = getCurrentProgress(item.events, item.goal);
          return (
            <TouchableOpacity onPress={() => navigation.navigate('HabitDetail', { id: item.id, name: item.name })}>
              <View style={[styles.habitItem, { backgroundColor: isDark ? '#222' : '#fafafa' }]}>
                <ProgressRing value={dynamicCurrent} goal={item.goal} color={item.color} size={80} isDark={isDark} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.habitName, { color: theme.text }]}>{item.name}</Text>
                  <Text style={styles.habitGoal}>{i18n.t('current_goal')}: {Math.floor(dynamicCurrent)} / {item.goal} {i18n.t('days') || 'дней'}</Text>
                  <Text style={styles.habitAttempt}>{i18n.t('attempt')} №{item.attempt}</Text>
                  <Text style={styles.habitRecord}>{i18n.t('streak')}: {getMaxStreak(item.events)} {i18n.t('days') || 'дней'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      {/* FAB */}
      <FAB onPress={() => navigation.navigate('CreateHabit')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  settingsBtn: {
    marginLeft: 8,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 12,
    padding: 12,
    elevation: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  habitGoal: {
    fontSize: 14,
    color: '#666',
  },
  habitAttempt: {
    fontSize: 14,
    color: '#888',
  },
  habitRecord: {
    fontSize: 14,
    color: '#388e3c',
    fontWeight: 'bold',
  },
});

export default MainScreen; 