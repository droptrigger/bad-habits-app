import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { useLanguage } from '../localization/LanguageContext';
import i18n from '../localization/i18n';

const SettingsScreen = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { lang, switchLanguage } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}> 
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>{i18n.t('theme') || 'Тема'}</Text>
        <TouchableOpacity style={[styles.switchBtn, { backgroundColor: isDark ? '#222' : '#eee' }]} onPress={toggleTheme}>
          <Text style={{ color: isDark ? '#fff' : '#222', fontWeight: 'bold', fontSize: 16 }}>{isDark ? i18n.t('light_theme') || 'Светлая' : i18n.t('dark_theme') || 'Тёмная'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.section}>
        <Text style={[styles.label, { color: theme.text }]}>{i18n.t('language') || 'Язык'}</Text>
        <TouchableOpacity style={[styles.switchBtn, { backgroundColor: '#eee' }]} onPress={switchLanguage}>
          <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16 }}>{lang === 'ru' ? 'Русский' : 'English'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    alignSelf: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  switchBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 2,
    elevation: 2,
  },
});

export default SettingsScreen; 