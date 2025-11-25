import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

interface SimpleDateTimePickerProps {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
    mode?: 'date' | 'time' | 'datetime';
    minimumDate?: Date;
}

export default function SimpleDateTimePicker({
    label,
    value,
    onChange,
    mode = 'datetime',
    minimumDate,
}: SimpleDateTimePickerProps) {
    const [show, setShow] = useState(false);
    const [currentMode, setCurrentMode] = useState<any>(mode === 'datetime' ? 'date' : mode);

    const handleChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
            if (!event || event.type === 'dismissed' || !selectedDate) return;

            if (mode === 'datetime' && currentMode === 'date') {
                const newDate = new Date(selectedDate);
                newDate.setHours(value.getHours());
                newDate.setMinutes(value.getMinutes());
                onChange(newDate);
                setCurrentMode('time');
                setShow(true);
            } else {
                if (currentMode === 'time') {
                    const newDate = new Date(value);
                    newDate.setHours(selectedDate.getHours());
                    newDate.setMinutes(selectedDate.getMinutes());
                    onChange(newDate);
                    setCurrentMode('date');
                } else {
                    onChange(selectedDate);
                }
            }
        } else {
            if (selectedDate) onChange(selectedDate);
        }
    };

    const formatValue = () => {
        if (mode === 'date') return format(value, 'MMM dd, yyyy');
        if (mode === 'time') return format(value, 'h:mm a');
        return format(value, 'MMM dd, yyyy h:mm a');
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity
                onPress={() => {
                    setCurrentMode(mode === 'datetime' ? 'date' : mode);
                    setShow(true);
                }}
                style={styles.button}
            >
                <Text style={styles.buttonText}>{formatValue()}</Text>
            </TouchableOpacity>

            {show && (
                <DateTimePicker
                    value={value}
                    mode={currentMode}
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleChange}
                    minimumDate={minimumDate}
                />
            )}

            {Platform.OS === 'ios' && show && (
                <TouchableOpacity onPress={() => setShow(false)} style={styles.doneButton}>
                    <Text style={styles.doneText}>Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    label: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
    },
    button: {
        backgroundColor: '#1E293B',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        padding: 16,
    },
    buttonText: {
        color: '#F8FAFC',
        fontSize: 16,
    },
    doneButton: {
        backgroundColor: '#3B82F6',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    doneText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontWeight: '700',
    },
});
