import React from 'react';
import { TextInput, Text, View } from 'react-native';
import { Control, Controller } from 'react-hook-form';

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
  return (
    <View>
      <Controller
        control={control}
        name={name}
        defaultValue=""
        render={({ field: { onChange, value } }) => (
          <TextInput
            style={style}
            placeholder={placeholder}
            onChangeText={(text) => onChange(name === 'email' ? text.toLowerCase() : text)}
            value={value}
            secureTextEntry={secureTextEntry}
            autoCapitalize="none"
          />
        )}
      />
      {error && <Text style={{ color: 'red', marginBottom: 8 }}>{error}</Text>}
    </View>
  );
}
