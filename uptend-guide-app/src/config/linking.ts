import { LinkingOptions } from '@react-navigation/native';

const linking: LinkingOptions<any> = {
  prefixes: ['uptend://', 'https://uptendapp.com'],
  config: {
    screens: {
      // Customer tabs
      Home: {
        screens: {
          HomeScreen: '',
          GeorgeChat: 'chat',
        },
      },
      Book: {
        screens: {
          BookingHome: 'book',
        },
      },
      FindPro: {
        screens: {
          ProListHome: 'pro/:id?',
        },
      },
      More: {
        screens: {
          MoreHome: 'more',
          Profile: 'profile',
        },
      },
      // Standalone deep links that map to nested screens
      HomeScan: 'scan',
      // Job tracking (pro)
      Jobs: {
        screens: {
          JobsHome: 'job/:id?',
        },
      },
    },
  },
};

export default linking;
