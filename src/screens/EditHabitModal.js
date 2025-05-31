import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import i18n from '../localization/i18n';
import { getHabits, updateHabit } from '../storage/habits';
import { useTheme } from '../themes/ThemeContext';

const COLORS = ['#ff5252', '#ffd600', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#222', '#bbb'];

const EditHabitModal = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { theme, isDark } = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Получаем привычку по id
    getHabits().then(habits => {
      const found = habits.find(h => h.id === route.params?.id);
      if (found) {
        setName(found.name);
        setColor(prev => prev === COLORS[0] ? found.color : prev); // если пользователь не менял цвет, берем из привычки
        setDate(found.startDate ? new Date(found.startDate) : new Date());
      }
      setLoading(false);
    });
  }, [route.params?.id]);

  const onSelectDate = (day) => {
    setDate(new Date(day.dateString));
    setShowCalendar(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError(i18n.t('error_fill_name'));
      return;
    }
    if (!color) {
      setError(i18n.t('error_fill_color'));
      return;
    }
    if (!date) {
      setError(i18n.t('error_fill_date'));
      return;
    }
    setError('');
    await updateHabit(route.params?.id, h => ({
      ...h,
      name: name.trim(),
      color,
      startDate: date.toISOString(),
    }));
    navigation.goBack();
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({ title: i18n.t('edit_habit') });
  }, [navigation]);

  if (loading) {
    return <View style={[styles.container, { backgroundColor: theme.background }]}><Text style={{ color: theme.text }}>...</Text></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <Text style={[styles.label, { color: theme.text }]}>{i18n.t('habit_name_label')}</Text>
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: isDark ? '#222' : '#f5f5f5', borderColor: isDark ? '#444' : '#ccc' }]}
        placeholder={i18n.t('habit_name_placeholder')}
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        value={name}
        onChangeText={setName}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={[styles.label, { color: theme.text }]}>{i18n.t('ring_color_label')}</Text>
      <FlatList
        data={COLORS}
        horizontal
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.colorCircle, { backgroundColor: item, borderWidth: color === item ? 3 : 1, borderColor: color === item ? theme.primary : (isDark ? '#444' : '#ccc') }]}
            onPress={() => setColor(item)}
          />
        )}
        style={{ marginBottom: 0, maxHeight: 50 }}
        contentContainerStyle={{ paddingVertical: 0 }}
        showsHorizontalScrollIndicator={false}
      />

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleSave}>
        <Text style={styles.buttonText}>{i18n.t('continue_button')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#f5f5f5',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginHorizontal: 4,
    marginVertical: 0,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarWrap: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    width: 340,
    maxWidth: '95%',
    alignItems: 'center',
  },
  closeBtn: {
    marginTop: 12,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  error: {
    color: '#d32f2f',
    fontSize: 14,
    marginBottom: 6,
    marginTop: -2,
    fontWeight: 'bold',
  },
});

export default EditHabitModal; 