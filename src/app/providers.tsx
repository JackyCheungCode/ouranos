import type { PropsWithChildren } from 'react';
import { PorscheDesignSystemProvider } from '@porsche-design-system/components-react';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <PorscheDesignSystemProvider>
      {children}
    </PorscheDesignSystemProvider>
  );
}
