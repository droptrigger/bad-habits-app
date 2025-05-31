import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import MainScreen from '../screens/MainScreen';
import CreateHabitScreen from '../screens/CreateHabitScreen';
import HabitDetailScreen from '../screens/HabitDetailScreen';
import EditHabitModal from '../screens/EditHabitModal';
import SettingsScreen from '../screens/SettingsScreen';
import { useTheme } from '../themes/ThemeContext';
import i18n from '../localization/i18n';
import { useLanguage } from '../localization/LanguageContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { theme, isDark } = useTheme();
  const { lang } = useLanguage();

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          background: theme.background,
          card: theme.background,
          text: theme.text,
          border: theme.primary,
          primary: theme.primary,
          notification: theme.primary,
        },
        fonts: theme.fonts,
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { color: theme.text },
        }}
      >
        <Stack.Screen name="Main" component={MainScreen} options={() => ({ title: i18n.t('main_screen') })} />
        <Stack.Screen name="CreateHabit" component={CreateHabitScreen} options={() => ({ title: i18n.t('create_habit') })} />
        <Stack.Screen name="HabitDetail" component={HabitDetailScreen} options={({ route }) => ({ title: route.params?.name || i18n.t('habit_detail') })} />
        <Stack.Screen name="EditHabit" component={EditHabitModal} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={() => ({ title: i18n.t('settings') })} key={lang} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator; 