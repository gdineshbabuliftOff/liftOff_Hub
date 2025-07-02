import { ALL_MENU_ITEMS_ORDERED, MENU_ACTION_ICONS, MENU_ACTIONS } from '@/constants/common';
import { Employee } from '@/constants/interface';
import React from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { styles } from '../Styles/DashBoardStyles';

interface EmployeeActionMenuProps {
  employee: Employee;
  isVisible: boolean;
  onAction: (action: string, employee: Employee) => void;
  loadingAction?: { userId: number; action: string } | null;
}

const EmployeeActionMenu: React.FC<EmployeeActionMenuProps> = ({
  employee,
  isVisible,
  onAction,
  loadingAction,
}) => {
  if (!isVisible) {
    return null;
  }

  const isActionLoading = (action: string) =>
    loadingAction?.userId === employee.userId && loadingAction?.action === action;

  const getMenuItemText = (actionName: string) => {
    if (actionName === MENU_ACTIONS.TOGGLE_EDIT_RIGHTS) {
      return employee.editRights ? 'Disable Edit Rights' : 'Enable Edit Rights';
    }
    return actionName;
  };

  const getActionItemTextStyle = (actionName: string) => {
    if (actionName === MENU_ACTIONS.DELETE_USER_PERMANENTLY) return styles.menuItemTextDestructive;
    if (actionName === MENU_ACTIONS.DELETE_USER) return styles.menuItemTextDestructiveSimple;
    if (actionName === MENU_ACTIONS.TOGGLE_EDIT_RIGHTS && employee.editRights) return styles.menuItemTextDestructiveSimple;
    return styles.menuItemText;
  };

  const getIconColorForAction = (actionName: string) => {
    const textStyle = getActionItemTextStyle(actionName);
    return textStyle.color || styles.menuItemIconDefault.color;
  };

  const employeeMenuItems = ALL_MENU_ITEMS_ORDERED.filter(actionName => {
    if (actionName === MENU_ACTIONS.REMINDER_EMAIL && !employee.editRights) {
      return false;
    }
    if (actionName === MENU_ACTIONS.DOWNLOAD_DOCUMENTS && employee.joineeType === 'EXISTING') {
      return false;
    }
    return true;
  });

  return (
    <View style={styles.menuDropdown}>
      {employeeMenuItems.map((actionName, index) => (
        <React.Fragment key={actionName}>
          <TouchableOpacity
            style={styles.menuItemTouchable}
            onPress={() => onAction(actionName, employee)}
            disabled={isActionLoading(actionName)}
          >
            {isActionLoading(actionName) ? (
              <View style={styles.menuItemContent}>
                <ActivityIndicator size={22} color={getIconColorForAction(actionName)} />
              </View>
            ) : (
              <View style={styles.menuItemContent}>
                <MaterialCommunityIcons
                  name={MENU_ACTION_ICONS[actionName] || 'help-circle-outline'}
                  size={22}
                  color={getIconColorForAction(actionName)}
                  style={styles.menuItemIcon}
                />
                <Text style={getActionItemTextStyle(actionName)}>
                  {getMenuItemText(actionName)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          {index < employeeMenuItems.length - 1 && <View style={styles.menuDivider} />}
        </React.Fragment>
      ))}
    </View>
  );
};

export default EmployeeActionMenu;