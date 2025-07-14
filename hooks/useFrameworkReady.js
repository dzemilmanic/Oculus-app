import { useEffect } from 'react';

export function useFrameworkReady() {
  useEffect(() => {
    if (window.frameworkReady) {
      window.frameworkReady();
    }
  });
}
