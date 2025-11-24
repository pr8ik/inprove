import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';

interface DateTimePickerComponentProps {
    label: string;
    value: Date;
    onChange: (date: Date) => void;
    mode?: 'date' | 'time' | 'datetime';
    minimumDate?: Date;
    maximumDate?: Date;
}

export default function DateTimePickerComponent({
    label,
    value,
    onChange,
    mode = 'datetime',
    minimumDate,
    maximumDate,
}: DateTimePickerComponentProps) {
    const [show, setShow] = useState(false);

    const handleChange = (event: any, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShow(false);
        }
        if (selectedDate && event.type !== 'dismissed') {
            onChange(selectedDate);
        }
    };

    const formatValue = () => {
        if (mode === 'date') {
            return format(value, 'MMM dd, yyyy');
        } else if (mode === 'time') {
            return format(value, 'h:mm a');
        } else {
            return format(value, 'MMM dd, yyyy h:mm a');
        }
    };

    return (
        <View className="mb-4">
            <Text className="text-text-muted text-xs font-bold uppercase mb-2">{label}</Text>
            <TouchableOpacity
                onPress={() => setShow(true)}
                className="bg-secondary border border-white/10 rounded-xl p-4"
            >
                <Text className="text-white text-base">{formatValue()}</Text>
            </TouchableOpacity>

            {show && (
                <DateTimePicker
                    value={value}
                    mode={mode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    themeVariant="dark"
                />
            )}

            {Platform.OS === 'ios' && show && (
                <TouchableOpacity
                    onPress={() => setShow(false)}
                    className="bg-accent rounded-xl p-3 mt-2"
                >
                    <Text className="text-white text-center font-bold">Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}
