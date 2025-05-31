import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const FAB = ({ onPress }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress}>
    <Text style={styles.plus}>+</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    backgroundColor: '#222',
    borderRadius: 28,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  plus: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 40,
  },
});

export default FAB; 