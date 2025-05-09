import React, { useState } from 'react';
import { TextInput, Text, View, Pressable } from 'react-native';
import { Control, Controller } from 'react-hook-form';
import Ionicons from '@expo/vector-icons/Ionicons';

type Props = {
  name: string;
  control: Control<any>;
  placeholder: string;
  secureTextEntry?: boolean;
  error?: string;
  style?: any;
};

export default function FormInput({
  name,
  control,
  placeholder,
  secureTextEntry,
  error,
  style,
}: Props) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible((prev) => !prev);
  };

  const showToggleIcon = name === 'password';

  return (
    <View style={{ marginTop: 15 }}>
      <Controller
        control={control}
        name={name}
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <View style={{ position: 'relative', justifyContent: 'center' }}>
            <TextInput
              style={[
                style,
                { paddingRight: showToggleIcon ? 40 : 12 },
              ]}
              placeholder={placeholder}
              onChangeText={(text) => onChange(name === 'email' ? text.toLowerCase() : text)}
              value={value}
              secureTextEntry={secureTextEntry && !isPasswordVisible}
              autoCapitalize="none"
            />
            {showToggleIcon && (
              <Pressable
                onPress={togglePasswordVisibility}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: 10,
                  bottom: 0,
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name={isPasswordVisible ? 'eye-off' : 'eye'}
                  size={20}
                  color="#888"
                />
              </Pressable>
            )}
          </View>
        )}
      />
      {error && (
        <Text style={{ color: 'red', marginTop: 4, fontSize: 12 }}>{error}</Text>
      )}
    </View>
  );
}
