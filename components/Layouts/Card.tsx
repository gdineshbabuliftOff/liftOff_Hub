import React from 'react';
import { StyleSheet, View } from 'react-native';

type CardProps = {
  topNavBackgroundColor: string;
  topNavContent: React.ReactNode;
  children: React.ReactNode;
  fullHeight?: boolean; // Optional prop
};

const Card = ({
  topNavBackgroundColor,
  topNavContent,
  children,
  fullHeight = false,
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
      <View
        style={[
          styles.body,
          { marginBottom: fullHeight ? 0 : 70 },
        ]}
      >
        {children}
      </View>
    </View>
  );
};

export default Card;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    zIndex: 0,
  },
  topNav: {
    height: 60,
    justifyContent: 'center',
    paddingHorizontal: 10,
    zIndex: 0,
  },
  body: {
    flex: 1,
  },
});
