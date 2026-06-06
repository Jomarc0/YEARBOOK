import React, { useMemo, useState } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors } from './webTheme';

type Option = {
  label: string;
  value: string;
  icon?: any;
  meta?: string;
};

type Props = {
  label: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  icon?: any;
};

export default function FilterDropdown({ label, options, value, onChange, icon = 'filter' }: Props) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(() => options.find((item) => item.value === value) || options[0], [options, value]);

  const select = (nextValue: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity style={styles.trigger} activeOpacity={0.88} onPress={() => setOpen(true)}>
        <View style={styles.iconBox}>
          <FontAwesome name={icon} size={13} color={colors.gold} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value} numberOfLines={1}>{selected?.label || 'Select'}</Text>
        </View>
        <FontAwesome name="chevron-down" size={12} color="#7b8ba6" />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{label}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setOpen(false)}>
                <FontAwesome name="times" size={17} color="#7b8ba6" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value || item.label}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <TouchableOpacity style={[styles.option, active && styles.optionActive]} onPress={() => select(item.value)}>
                    <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                      <FontAwesome name={(item.icon || icon) as any} size={12} color={active ? colors.gold : '#8fa0bf'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
                      {!!item.meta && <Text style={styles.optionMeta}>{item.meta}</Text>}
                    </View>
                    {active ? <FontAwesome name="check" size={13} color={colors.gold} /> : null}
                  </TouchableOpacity>
                );
              }}
              style={styles.optionList}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    minHeight: 58,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#d9e1ee',
    backgroundColor: '#ffffff',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  iconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, minWidth: 0 },
  label: { color: '#8fa0bf', fontSize: 10, fontWeight: '900', letterSpacing: 0.9 },
  value: { color: colors.navy, fontSize: 14, fontWeight: '900', marginTop: 3 },
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,23,42,0.45)' },
  sheet: { backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '72%', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  sheetTitle: { color: colors.navy, fontSize: 18, fontWeight: '900' },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  optionList: { marginTop: 4 },
  option: { minHeight: 52, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, marginBottom: 7, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#edf2f7' },
  optionActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  optionIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  optionIconActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  optionText: { color: colors.navy, fontSize: 13, fontWeight: '900' },
  optionTextActive: { color: '#ffffff' },
  optionMeta: { color: '#8fa0bf', fontSize: 11, marginTop: 2 },
});
