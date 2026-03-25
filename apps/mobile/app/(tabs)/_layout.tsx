import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { colors } from '@/lib/theme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

interface TabConfig {
  name: string
  title: string
  icon: IoniconName
  iconActive: IoniconName
}

const TABS: TabConfig[] = [
  { name: 'index',     title: 'Home',      icon: 'home-outline',      iconActive: 'home' },
  { name: 'community', title: 'Community', icon: 'people-outline',    iconActive: 'people' },
  { name: 'events',    title: 'Events',    icon: 'calendar-outline',  iconActive: 'calendar' },
  { name: 'academy',   title: 'Academy',   icon: 'play-circle-outline', iconActive: 'play-circle' },
]

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   colors.teal,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarStyle: {
          backgroundColor: colors.navyDark,
          borderTopColor:  'rgba(255,255,255,0.06)',
          borderTopWidth:  1,
        },
        tabBarLabelStyle: {
          fontSize:      10,
          fontWeight:    '700',
          letterSpacing: 0.5,
          marginBottom:  2,
        },
        headerShown: false,
      }}
    >
      {TABS.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused, color, size }) => (
              <Ionicons
                name={focused ? tab.iconActive : tab.icon}
                size={size}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  )
}
