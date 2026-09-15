import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { configure } from '@testing-library/dom';

// Native WebCrypto admission is asynchronous. The full parallel suite can
// exceed Testing Library's 1s default while the news hook is still loading.
configure({ asyncUtilTimeout: 5000 });

afterEach(cleanup);
