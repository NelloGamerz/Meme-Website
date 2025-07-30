// export const getCurrentAuthUser = () => {
//   if (window.__authState) {
//     return window.__authState
//   }
  
//   try {
//     const { useAuthStore } = require('../store/useAuthStore');
//     const authState = useAuthStore.getState();
//     if (authState.user && authState.isAuthenticated) {
//       const authUser = {
//         username: authState.user.username || null,
//         theme: authState.user.theme || null,
//         isAuthenticated: authState.isAuthenticated
//       };
//       updateGlobalAuthState(authUser);
//       return authUser;
//     }
//   } catch (error) {
//     console.error(error);
//   }

//   return null
// }

// declare global {
//   interface Window {
//     __authState: {
//       username: string | null
//       theme: string | null
//       isAuthenticated: boolean | null
//     } | null
//   }
// }

// export const updateGlobalAuthState = (authState: {
//   username: string | null
//   theme: string | null
//   isAuthenticated: boolean | null
// }) => {
//   window.__authState = authState
// }

// export const getCurrentTheme = (): string | null => {
//   if (window.__authState) {
//     return window.__authState.theme
//   }
  
//   try {
//     const { useAuthStore } = require('../store/useAuthStore');
//     const authState = useAuthStore.getState();
//     if (authState.user && authState.isAuthenticated) {
//       return authState.user.theme || null;
//     }
//   } catch (error) {
//     console.log(error)
//   }

//   return null
// }

// if (typeof window !== 'undefined') {
//   window.__authState = null
// }


import { useAuthStore } from '../store/useAuthStore';

export const getCurrentAuthUser = () => {
  if (window.__authState) {
    return window.__authState;
  }

  try {
    const authState = useAuthStore.getState();
    if (authState.user && authState.isAuthenticated) {
      const authUser = {
        username: authState.user.username || null,
        theme: authState.user.theme || null,
        isAuthenticated: authState.isAuthenticated,
      };
      updateGlobalAuthState(authUser);
      return authUser;
    }
  } catch (error) {
    console.error(error);
  }

  return null;
};

declare global {
  interface Window {
    __authState: {
      username: string | null;
      theme: string | null;
      isAuthenticated: boolean | null;
    } | null;
  }
}

export const updateGlobalAuthState = (authState: {
  username: string | null;
  theme: string | null;
  isAuthenticated: boolean | null;
}) => {
  window.__authState = authState;
};

export const getCurrentTheme = (): string | null => {
  if (window.__authState) {
    return window.__authState.theme;
  }

  try {
    const authState = useAuthStore.getState();
    if (authState.user && authState.isAuthenticated) {
      return authState.user.theme || null;
    }
  } catch (error) {
    console.log(error);
  }

  return null;
};

if (typeof window !== 'undefined') {
  window.__authState = null;
}
