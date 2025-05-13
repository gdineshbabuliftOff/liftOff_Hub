import React from 'react';
import { StyleSheet, View } from 'react-native';

type CardProps = {
  topNavBackgroundColor: string;
  topNavContent: React.ReactNode;
  children: React.ReactNode;
};

const Card = ({
  topNavBackgroundColor,
  topNavContent,
  children,
}: CardProps) => {
  return (
    <View style={styles.container}>
      <View
        style={[
          styles.topNav,
          { backgroundColor: topNavBackgroundColor },
        ]}
      >
        {topNavContent}
      </View>
      <View style={styles.body}>
        {children}
      </View>
    </View>
  );
};

export default Card;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topNav: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  body: {
    flex: 1,
    padding: 16,
    paddingBottom: 70,
  },
});
