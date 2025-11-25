import React, { useState } from 'react'
import { Alert, View, TextInput, Text, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'

export default function SignUp() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function signUpWithEmail() {
        if (!name.trim()) {
            Alert.alert('Please enter your name')
            return
        }
        setLoading(true)
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        })

        if (error) Alert.alert(error.message)
        else if (!session) Alert.alert('Please check your inbox for email verification!')
        else router.replace('/(tabs)')

        setLoading(false)
    }

    return (
        <View className="flex-1 justify-center items-center bg-primary p-4">
            <Text className="text-3xl font-bold text-white mb-8">Create Account</Text>
            <View className="w-full max-w-sm">
                <TextInput
                    className="bg-secondary text-white p-4 rounded-lg mb-4 border border-white/10"
                    placeholder="Full Name"
                    placeholderTextColor="#94A3B8"
                    onChangeText={setName}
                    value={name}
                    autoCapitalize="words"
                />
                <TextInput
                    className="bg-secondary text-white p-4 rounded-lg mb-4 border border-white/10"
                    placeholder="Email"
                    placeholderTextColor="#94A3B8"
                    onChangeText={setEmail}
                    value={email}
                    autoCapitalize="none"
                />
                <TextInput
                    className="bg-secondary text-white p-4 rounded-lg mb-6 border border-white/10"
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    onChangeText={setPassword}
                    value={password}
                    secureTextEntry={true}
                    autoCapitalize="none"
                />
                <TouchableOpacity
                    className="bg-accent p-4 rounded-lg items-center"
                    onPress={signUpWithEmail}
                    disabled={loading}
                >
                    <Text className="text-white font-bold text-lg">
                        {loading ? 'Loading...' : 'Sign Up'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="mt-6 items-center"
                    onPress={() => router.back()}
                >
                    <Text className="text-gray-400">Already have an account? <Text className="text-accent">Sign In</Text></Text>
                </TouchableOpacity>
            </View>
        </View>
    )
}
