import AsyncStorage from '@react-native-async-storage/async-storage';

const HABITS_KEY = 'habits';

export const getHabits = async () => {
  try {
    const data = await AsyncStorage.getItem(HABITS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

export const saveHabits = async (habits) => {
  try {
    await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  } catch (e) {}
};

export const addHabit = async (habit) => {
  const habits = await getHabits();
  habits.push(habit);
  await saveHabits(habits);
};

export const updateHabit = async (id, updateFn) => {
  const habits = await getHabits();
  const idx = habits.findIndex(h => h.id === id);
  if (idx !== -1) {
    habits[idx] = updateFn(habits[idx]);
    await saveHabits(habits);
    return habits[idx];
  }
  return null;
};

export const deleteHabit = async (id) => {
  const habits = await getHabits();
  const filtered = habits.filter(h => h.id !== id);
  await saveHabits(filtered);
}; 