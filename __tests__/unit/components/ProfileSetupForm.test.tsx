import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ─── Response polyfill ────────────────────────────────────────────────────────
if (typeof global.Response === 'undefined') {
  // @ts-expect-error minimal polyfill
  global.Response = class Response {
    constructor(body?: unknown, init?: { status?: number }) {
      this.body = body; this.status = init?.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
    }
    body: unknown; status: number; ok: boolean;
    json() { return Promise.resolve(this.body); }
    text() { return Promise.resolve(String(this.body)); }
  };
}

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockReplace = jest.fn();
const mockProfileGet = jest.fn();
const mockProfileUpdate = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, prefetch: jest.fn() }),
  usePathname: () => '/profile-setup',
  useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/lib/api-client', () => ({
  profileApi: {
    get:    () => mockProfileGet(),
    update: (data: unknown) => mockProfileUpdate(data),
  },
}));

// Auth — returns a logged-in user by default
const mockAuthCallback = jest.fn();
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((_auth, cb) => {
    mockAuthCallback.mockImplementation(cb);
    cb({ uid: 'uid-123', email: 'user@test.com' });
    return jest.fn();
  }),
}));

import ProfileSetupForm from '@/components/ProfileSetupForm';

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('ProfileSetupForm Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: profile not yet completed, empty form
    mockProfileGet.mockResolvedValue({
      username: '', firstName: '', lastName: '',
      university: '', major: '', profileCompleted: false,
    });
    // Mock fetch so username availability check resolves immediately as 'available'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { available: true, valid: true } }),
    }) as jest.Mock;
  });

  // ── 1. Renders ────────────────────────────────────────────────────────────
  it('shows a loading spinner before data arrives', () => {
    mockProfileGet.mockImplementation(() => new Promise(() => {}));
    render(<ProfileSetupForm />);
    expect(screen.getByText(/loading profile setup/i)).toBeInTheDocument();
  });

  it('renders the "Complete Your Profile" heading after loading', async () => {
    render(<ProfileSetupForm />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /complete your profile/i })).toBeInTheDocument();
    });
  });

  it('renders Username, First Name, Last Name fields', async () => {
    render(<ProfileSetupForm />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText('your.username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Doe')).toBeInTheDocument();
    });
  });

  it('renders the "Continue to Dashboard" submit button', async () => {
    render(<ProfileSetupForm />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /continue to dashboard/i })).toBeInTheDocument();
    });
  });

  // ── 2. Redirects when profile is already complete ─────────────────────────
  it('redirects to /dashboard if profile is already completed', async () => {
    mockProfileGet.mockResolvedValueOnce({ profileCompleted: true });
    render(<ProfileSetupForm />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard');
    });
  });

  // ── 3. Username validation ─────────────────────────────────────────────────
  it('shows invalid username message for short usernames (< 3 chars)', async () => {
    const user = userEvent.setup();
    render(<ProfileSetupForm />);

    await waitFor(() => screen.getByPlaceholderText('your.username'));
    await user.type(screen.getByPlaceholderText('your.username'), 'ab');

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/3-30 chars/);
    });
  });

  it('shows invalid message for usernames with invalid characters', async () => {
    const user = userEvent.setup();
    render(<ProfileSetupForm />);

    await waitFor(() => screen.getByPlaceholderText('your.username'));
    await user.type(screen.getByPlaceholderText('your.username'), 'bad username!');

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/3-30 chars/);
    });
  });

  // ── 4. Submit validation ───────────────────────────────────────────────────
  it('shows error when submitting with an empty/invalid username', async () => {
    render(<ProfileSetupForm />);

    await waitFor(() => screen.getByRole('button', { name: /continue to dashboard/i }));

    // Submit the form directly via the form element
    const form = document.querySelector('form');
    if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

    await waitFor(() => {
      expect(document.body.textContent).toMatch(/3-30 chars/);
    }, { timeout: 3000 });
    expect(mockProfileUpdate).not.toHaveBeenCalled();
  });

  // ── 5. Successful submission ───────────────────────────────────────────────
  it('pre-populates fields with existing profile data from API', async () => {
    mockProfileGet.mockResolvedValue({
      username: 'existinguser', firstName: 'Jane', lastName: 'Doe',
      university: 'Test Uni', major: 'CS', profileCompleted: false,
    });

    render(<ProfileSetupForm />);

    await waitFor(() => {
      expect((screen.getByPlaceholderText('your.username') as HTMLInputElement).value)
        .toBe('existinguser');
    }, { timeout: 3000 });

    expect((screen.getByPlaceholderText('John') as HTMLInputElement).value).toBe('Jane');
  });

  // ── 6. Submission API error ────────────────────────────────────────────────
  it('shows the username availability error inside the form body', async () => {
    const user = userEvent.setup();
    render(<ProfileSetupForm />);
    await waitFor(() => screen.getByPlaceholderText('your.username'));

    // Type an invalid username — regex check is sync, no debounce needed
    await user.type(screen.getByPlaceholderText('your.username'), 'x!');

    await waitFor(() => {
      // The invalid message appears AND the API is never called
      expect(document.body.textContent).toMatch(/3-30 chars/);
      expect(mockProfileUpdate).not.toHaveBeenCalled();
    });
  });

  // ── 7. No auth — redirects to login ──────────────────────────────────────
  it('redirects to /login if no authenticated user is found', async () => {
    // Override onAuthStateChanged to return null user
    const { onAuthStateChanged } = await import('firebase/auth');
    (onAuthStateChanged as jest.Mock).mockImplementationOnce((_auth: unknown, cb: (u: null) => void) => {
      cb(null);
      return jest.fn();
    });

    render(<ProfileSetupForm />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });
});
