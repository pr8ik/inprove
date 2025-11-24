import React, { useState } from 'react'
import { Alert, View, TextInput, Text, TouchableOpacity } from 'react-native'
import { supabase } from '../../lib/supabase'
import { useRouter } from 'expo-router'

export default function SignUp() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function signUpWithEmail() {
        setLoading(true)
        const {
            data: { session },
            error,
        } = await supabase.auth.signUp({
            email,
            password,
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
                    className="bg-secondary text-white p-4 rounded-lg mb-4 border border-gray-800"
                    placeholder="Email"
                    placeholderTextColor="#666"
                    onChangeText={(text) => setEmail(text)}
                    value={email}
                    autoCapitalize="none"
                />
                <TextInput
                    className="bg-secondary text-white p-4 rounded-lg mb-6 border border-gray-800"
                    placeholder="Password"
                    placeholderTextColor="#666"
                    onChangeText={(text) => setPassword(text)}
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
