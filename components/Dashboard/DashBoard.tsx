import React from 'react';
import { Text } from 'react-native';
import Card from '../Layouts/Card';

const DashboardScreen = () => {
  return (
    <Card
      topNavBackgroundColor="#fff"
      topNavContent={<Text style={{ color: '#000', fontSize: 18 }}>Top Navigation</Text>}
    >
      <Text>This is the body content of the card.</Text>
    </Card>
  );
};

export default DashboardScreen;
