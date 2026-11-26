import { describe, expect, it } from 'vitest';
import * as tokens from '../../src/design-system/tokens';

describe('Porsche Design System token boundary', () => {
  it('re-exports the installed PDS token API', () => {
    expect(Object.keys(tokens).length).toBeGreaterThan(0);
  });
});
