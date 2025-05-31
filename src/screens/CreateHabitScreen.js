import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Modal, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';
import i18n from '../localization/i18n';
import { addHabit } from '../storage/habits';
import { useTheme } from '../themes/ThemeContext';

const COLORS = ['#ff5252', '#ffd600', '#4caf50', '#2196f3', '#9c27b0', '#ff9800', '#222', '#bbb'];

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

const CreateHabitScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [error, setError] = useState('');

  const onSelectDate = (day) => {
    setDate(new Date(day.dateString));
    setShowCalendar(false);
  };

  const handleContinue = async () => {
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
    const newHabit = {
      id: Date.now().toString(),
      name: name.trim(),
      color,
      startDate: date.toISOString(),
      goal: 7,
      current: 0,
      attempt: 1,
      record: 0,
      events: [
        { type: 'start', date: date.toISOString() }
      ],
    };
    await addHabit(newHabit);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.label, { color: theme.text }]}>{i18n.t('habit_name_label')}</Text>
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: isDark ? '#222' : '#f5f5f5', borderColor: isDark ? '#444' : '#ccc' }]}
        placeholder={i18n.t('habit_name_placeholder')}
        placeholderTextColor={isDark ? '#aaa' : '#888'}
        value={name}
        onChangeText={setName}
        keyboardAppearance={isDark ? 'dark' : 'light'}
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

      <Text style={[styles.label, { marginTop: 0, color: theme.text }]}>{i18n.t('start_date_label')}</Text>
      <TouchableOpacity style={[styles.input, { color: theme.text, backgroundColor: isDark ? '#222' : '#f5f5f5', borderColor: isDark ? '#444' : '#ccc' }]} onPress={() => setShowCalendar(true)}>
        <Text style={{ color: theme.text }}>{formatDate(date)}</Text>
      </TouchableOpacity>
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.calendarWrap, { backgroundColor: theme.background }]}>
            <Calendar
              onDayPress={onSelectDate}
              markedDates={{
                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: color }
              }}
              theme={{
                backgroundColor: theme.background,
                calendarBackground: theme.background,
                textSectionTitleColor: theme.text,
                selectedDayBackgroundColor: color,
                selectedDayTextColor: '#fff',
                todayTextColor: theme.text,
                dayTextColor: theme.text,
                arrowColor: color,
                monthTextColor: theme.text,
                textDayFontWeight: 'bold',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: 'bold',
              }}
            />
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: isDark ? '#333' : '#f5f5f5' }]} onPress={() => setShowCalendar(false)}>
              <Text style={{ color: color, fontWeight: 'bold', fontSize: 16 }}>{i18n.t('close_button')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.primary }]} onPress={handleContinue}>
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

export default CreateHabitScreen; 