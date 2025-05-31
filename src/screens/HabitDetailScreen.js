import React, { useEffect, useState, useLayoutEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { getHabits, updateHabit, deleteHabit } from '../storage/habits';
import ProgressRing from '../components/ProgressRing';
import { useTheme } from '../themes/ThemeContext';
import i18n from '../localization/i18n';

function getLastAttemptStart(events) {
  for (const event of events) {
    if (event.type === 'relapse' || event.type === 'start') {
      return new Date(event.date);
    }
  }
  return null;
}

function formatDuration(ms) {
  let totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  totalSeconds %= 86400;
  const hours = Math.floor(totalSeconds / 3600);
  totalSeconds %= 3600;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function getCurrentProgress(events, goal) {
  const start = getLastAttemptStart(events);
  if (!start) return 0;
  const now = new Date();
  const ms = now - start;
  const days = ms / (1000 * 60 * 60 * 24);
  return days < 0 ? 0 : days;
}

function getCurrentStreak(events) {
  const start = getLastAttemptStart(events);
  if (!start) return 0;
  const now = new Date();
  const ms = now - start;
  const days = ms / (1000 * 60 * 60 * 24);
  return days < 0 ? 0 : Math.floor(days);
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

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

const EVENT_ICONS = {
  start: '🚀',
  relapse: '🔄',
  record: '��',
  comment: '💬',
};

const HabitDetailScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const [habit, setHabit] = useState(null);
  const [showRelapseModal, setShowRelapseModal] = useState(false);
  const [timer, setTimer] = useState('00:00:00:00');
  const [comment, setComment] = useState('');
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [deleteIdx, setDeleteIdx] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useFocusEffect(
    useCallback(() => {
      getHabits().then(habits => {
        const found = habits.find(h => h.id === route.params?.id);
        setHabit(found);
      });
    }, [route.params?.id])
  );

  useEffect(() => {
    if (!habit || !habit.events) return;
    const startDate = getLastAttemptStart(habit.events);
    if (!startDate) return;
    const update = () => {
      const now = new Date();
      setTimer(formatDuration(now - startDate));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [habit]);

  useEffect(() => {
    if (!habit) return;
    const days = getCurrentProgress(habit.events, habit.goal);
    let newGoal = habit.goal;
    if (days >= habit.goal) {
      if (habit.goal === 7) newGoal = 31;
      else if (habit.goal === 31) newGoal = 365;
      else newGoal = 365;
    }
    if (newGoal !== habit.goal) {
      updateHabit(habit.id, h => ({ ...h, goal: newGoal })).then(setHabit);
    }
  }, [habit]);

  const dynamicCurrent = habit ? Math.min(getCurrentProgress(habit.events, habit.goal), habit.goal) : 0;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => setShowMenu(true)} style={{ paddingRight: 22, paddingLeft: 8, paddingVertical: 2, justifyContent: 'center', alignItems: 'center', height: 30 }}>
          <View style={{ width: 20, height: 15, justifyContent: 'space-between' }}>
            <View style={{ height: 2, borderRadius: 2, backgroundColor: theme.text, marginBottom: 5 }} />
            <View style={{ height: 2, borderRadius: 2, backgroundColor: theme.text, marginBottom: 5 }} />
            <View style={{ height: 2, borderRadius: 2, backgroundColor: theme.text }} />
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, theme]);

  const handleRelapse = async () => {
    setShowRelapseModal(false);
    if (!habit) return;
    const now = new Date();

    const currentStreak = getCurrentStreak(habit.events);
    let newGoal = habit.goal;
    if (currentStreak >= habit.goal) {
      if (habit.goal === 7) newGoal = 31;
      else if (habit.goal === 31) newGoal = 365;
      else newGoal = 365;
    }
    const updated = await updateHabit(habit.id, h => ({
      ...h,
      current: 0,
      attempt: h.attempt + 1,
      goal: newGoal,
      record: Math.max(h.record, currentStreak),
      events: [
        { type: 'relapse', date: now.toISOString() },
        ...h.events
      ],
    }));
    setHabit(updated);
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    const now = new Date().toISOString();
    const updated = await updateHabit(habit.id, h => ({
      ...h,
      events: [
        { type: 'comment', date: now, text: comment.trim() },
        ...h.events
      ],
    }));
    setHabit(updated);
    setComment('');
    setShowCommentModal(false);
  };

  const handleDeleteEvent = async () => {
    if (deleteIdx === null) return;

    if (habit.events[deleteIdx]?.type === 'start') {
      setDeleteIdx(null);
      setShowDeleteModal(false);
      return;
    }
    const newEvents = habit.events.filter((ev, i) => i !== deleteIdx || ev.type === 'start');

    const newAttempt = 1 + newEvents.filter(ev => ev.type === 'relapse').length;
    const updated = await updateHabit(habit.id, h => ({
      ...h,
      events: newEvents,
      attempt: newAttempt,
    }));
    setHabit(updated);
    setDeleteIdx(null);
    setShowDeleteModal(false);
  };

  const handleMenuEdit = () => {
    setShowMenu(false);
    navigation.navigate('EditHabit', { id: habit.id });
  };

  const handleMenuDelete = () => {
    setShowMenu(false);
    Alert.alert(
      i18n.t('delete_habit_confirm_title') || 'Удалить привычку?',
      i18n.t('delete_habit_confirm_text') || 'Вы уверены, что хотите удалить эту привычку?',
      [
        { text: i18n.t('close_button'), style: 'cancel' },
        { text: i18n.t('delete_event_button'), style: 'destructive', onPress: async () => {
            await deleteHabit(habit.id);
            navigation.goBack();
          }
        },
      ]
    );
  };

  if (!habit) {
    return <View style={[styles.container, { backgroundColor: theme.background }]}><Text style={{ color: theme.text }}>...</Text></View>;
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}> 
        <Text style={[styles.title, { color: theme.text }]}>{habit.name}</Text>
        <View style={styles.progressRow}>
          <ProgressRing value={dynamicCurrent} goal={habit.goal} color={habit.color} size={100} isDark={isDark} />
          <View style={{ marginLeft: 20 }}>
            <Text style={[styles.goal, { color: theme.text }]}>{i18n.t('current_goal')}: {Math.floor(dynamicCurrent)} / {habit.goal} {i18n.t('days')}</Text>
            <Text style={[styles.attempt, { color: theme.text }]}>{i18n.t('attempt')} №{habit.attempt}</Text>
            <Text style={[styles.streak, { color: theme.text }]}>{i18n.t('current_streak') || 'Сейчас'}: {getCurrentStreak(habit.events)} {i18n.t('days')}</Text>
            <Text style={[styles.record, { color: theme.text }]}>{i18n.t('record')}: {habit.record} {i18n.t('days')}</Text>
          </View>
        </View>
        {/* Таймер */}
        <Text style={[styles.timer, { color: theme.text }]}>{i18n.t('timer') || 'Таймер'}: {timer}</Text>
        {/* Кнопка рецидива */}
        <TouchableOpacity style={[styles.relapseBtn, { backgroundColor: habit.color }]} onPress={() => setShowRelapseModal(true)}>
          <Text style={styles.relapseBtnText}>{i18n.t('relapse_button')}</Text>
        </TouchableOpacity>
        <Modal visible={showRelapseModal} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { backgroundColor: theme.background, paddingTop: 30 }]}> 
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10, alignSelf: 'flex-start' }}>{i18n.t('relapse_confirm_title') || 'Подтвердите рецидив'}</Text>
              <Text style={{ color: theme.text, fontSize: 16, marginBottom: 15, alignSelf: 'flex-start' }}>{i18n.t('relapse_confirm_text') || 'Вы уверены, что хотите сбросить прогресс и начать новую попытку?'}</Text>
              <TouchableOpacity style={[styles.relapseFullBtn, { backgroundColor: habit.color }]} onPress={handleRelapse}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>{i18n.t('relapse_button')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeFullBtn} onPress={() => setShowRelapseModal(false)}>
                <Text style={{ color: isDark ? '#fff' : '#222', fontWeight: 'bold', fontSize: 18 }}>{i18n.t('close_button')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Добавить комментарий (модалка) */}
        <TouchableOpacity style={styles.addCommentToggle} onPress={() => setShowCommentModal(true)}>
          <Text style={{ color: habit.color, fontWeight: 'bold' }}>{i18n.t('add_comment_button') || 'Добавить комментарий'}</Text>
        </TouchableOpacity>
        <Modal visible={showCommentModal} transparent animationType="fade">
          <KeyboardAvoidingView
            style={styles.modalBg}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <View style={[styles.modalContent, { backgroundColor: theme.background, paddingTop: 32 }]}> 
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 20, alignSelf: 'flex-start' }}>{i18n.t('add_comment_button') || 'Добавить комментарий'}</Text>
              <TextInput
                style={[styles.commentInputModern, { color: theme.text, backgroundColor: isDark ? '#23272e' : '#f3f6fa', borderColor: isDark ? '#444' : '#d0d7e2' }]}
                placeholder={i18n.t('add_comment_placeholder') || 'Комментарий...'}
                placeholderTextColor={isDark ? '#aaa' : '#888'}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                returnKeyType="done"
                onSubmitEditing={() => { Keyboard.dismiss(); }}
              />
              <TouchableOpacity style={[styles.addCommentModernBtnFull, { backgroundColor: habit.color }]} onPress={handleAddComment}>
                <Text style={styles.addCommentModernBtnText}>{i18n.t('continue_button') || 'Добавить'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeFullBtn} onPress={() => { setShowCommentModal(false); setComment(''); }}>
                <Text style={{ color: isDark ? '#fff' : '#222', fontWeight: 'bold', fontSize: 18 }}>{i18n.t('close_button')}</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
        {/* Подтверждение удаления события */}
        <Modal visible={showDeleteModal} transparent animationType="fade">
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { backgroundColor: theme.background, paddingTop: 30 }]}> 
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: 'bold', marginBottom: 10, alignSelf: 'flex-start' }}>{i18n.t('delete_event_confirm_title') || 'Удалить событие?'}</Text>
              <Text style={{ color: theme.text, fontSize: 16, marginBottom: 15, alignSelf: 'flex-start' }}>{i18n.t('delete_event_confirm_text') || 'Вы уверены, что хотите удалить это событие?'}</Text>
              <TouchableOpacity style={styles.deleteFullBtn} onPress={handleDeleteEvent}>
                <Text style={styles.deleteFullBtnText}>{i18n.t('delete_event_button') || 'Удалить'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeFullBtn} onPress={() => setShowDeleteModal(false)}>
                <Text style={{ color: isDark ? '#fff' : '#222', fontWeight: 'bold', fontSize: 18 }}>{i18n.t('close_button')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* История событий */}
        <Text style={[styles.historyTitle, { color: theme.text }]}>История событий</Text>
        <View style={styles.historyList}>
          {habit.events?.map((event, idx) => (
            <View key={idx} style={styles.historyItem}>
              <Text style={styles.eventIcon}>{EVENT_ICONS[event.type] || '❔'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text }}>
                  {event.type === 'comment' ? event.text : i18n.t('event_' + event.type) || event.type}
                </Text>
                <Text style={{ color: '#888', fontSize: 12 }}>{formatDate(event.date)} {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
              {event.type !== 'start' && (
                <TouchableOpacity onPress={() => { setDeleteIdx(idx); setShowDeleteModal(true); }}>
                  <Text style={styles.deleteEvent}>✖</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
        {/* Меню три точки */}
        <Modal visible={showMenu} transparent animationType="fade" onRequestClose={() => setShowMenu(false)}>
          <TouchableOpacity style={styles.menuBg} activeOpacity={1} onPress={() => setShowMenu(false)}>
            <View style={[styles.menuSheet, { backgroundColor: theme.background }]}> 
              <TouchableOpacity style={styles.menuItem} onPress={handleMenuEdit}>
                <Text style={[styles.menuItemText, { color: theme.text }]}>{i18n.t('edit_button') || 'Редактировать'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleMenuDelete}>
                <Text style={[styles.menuItemText, { color: '#d32f2f' }]}>{i18n.t('delete_event_button')}</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </ScrollView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  goal: {
    fontSize: 16,
    marginBottom: 4,
  },
  attempt: {
    fontSize: 16,
    marginBottom: 4,
  },
  streak: {
    fontSize: 16,
    marginBottom: 4,
    color: '#1976d2'
  },
  record: {
    fontSize: 16,
    marginBottom: 4,
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  relapseBtn: {
    alignSelf: 'stretch',
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 24,
    marginTop: 8,
  },
  relapseBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  historyList: {
    marginBottom: 32,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: 320,
    maxWidth: '95%',
    alignItems: 'center',
    elevation: 4,
  },
  modalBtn: {
    flex: 1,
    marginHorizontal: 8,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  commentInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    marginRight: 8,
  },
  addCommentBtn: {
    backgroundColor: '#222',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  addCommentToggle: {
    marginBottom: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  eventIcon: {
    fontSize: 22,
    marginRight: 10,
    width: 28,
    textAlign: 'center',
  },
  deleteEvent: {
    color: '#d32f2f',
    fontSize: 20,
    marginLeft: 8,
    padding: 2,
  },
  commentInputModern: {
    width: '100%',
    minHeight: 80,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  addCommentModernBtnFull: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 0,
    elevation: 1,
  },
  addCommentModernBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    textAlign: 'center',
    width: '100%',
  },
  relapseFullBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 0,
    elevation: 1,
  },
  closeFullBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    backgroundColor: '#DCDCDC',
    elevation: 1,
  },
  closeIconWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  closeIcon: {
    fontSize: 20,
    color: '#fff',
  },
  deleteFullBtn: {
    width: '100%',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 0,
    backgroundColor: '#d32f2f',
    elevation: 2,
  },
  deleteFullBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textAlign: 'center',
    width: '100%',
  },
  menuBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  menuSheet: {
    width: 300,
    borderRadius: 16,
    marginBottom: 60,
    paddingVertical: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.13,
    shadowRadius: 12,
    alignItems: 'stretch',
  },
  menuItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  menuItemText: {
    fontSize: 17,
    fontWeight: 'bold',
    textAlign: 'left',
  },
});

export default HabitDetailScreen; 