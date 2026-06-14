import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// ─── Response polyfill (api-client uses it at import time) ────────────────────
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
const mockProfileGet  = jest.fn();
const mockProfileUpdate = jest.fn();

jest.mock('@/lib/api-client', () => ({
  profileApi: {
    get:    () => mockProfileGet(),
    update: (data: unknown) => mockProfileUpdate(data),
  },
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() }),
  usePathname: () => '/settings',
  useSearchParams: () => new URLSearchParams(),
}));

// firebase/auth — give a logged-in user
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((_, cb) => {
    cb({ uid: 'uid-123', email: 'test@test.com', displayName: 'Test User', photoURL: null });
    return jest.fn(); // unsubscribe
  }),
  signOut: jest.fn(),
}));

import ProfileSettings from '@/components/ProfileSettings';

// ─── Default profile data ─────────────────────────────────────────────────────
const MOCK_PROFILE = {
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  email: 'test@test.com',
  university: 'Test University',
  major: 'Computer Science',
  profilePhotoUrl: null,
  profileCompleted: true,
};

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('ProfileSettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProfileGet.mockResolvedValue(MOCK_PROFILE);
    // Mock fetch so username availability resolves instantly as 'available'
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { available: true, valid: true } }),
    }) as jest.Mock;
  });

  // ── 1. Renders ────────────────────────────────────────────────────────────
  it('renders all profile form fields after loading', async () => {
    render(<ProfileSettings />);

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toBeInTheDocument();
      expect(screen.getByLabelText('First Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
      expect(screen.getByLabelText('University Email')).toBeInTheDocument();
    });
  });

  it('shows a loading state before profile data arrives', () => {
    // Make profileGet hang so we stay in loading state
    mockProfileGet.mockImplementation(() => new Promise(() => {}));
    render(<ProfileSettings />);
    expect(screen.getByText(/loading profile settings/i)).toBeInTheDocument();
  });

  it('populates inputs with the fetched profile data', async () => {
    render(<ProfileSettings />);

    await waitFor(() => {
      expect(screen.getByLabelText('Username')).toHaveValue('testuser');
      expect(screen.getByLabelText('First Name')).toHaveValue('Test');
      expect(screen.getByLabelText('Last Name')).toHaveValue('User');
    });
  });

  it('renders the Save Changes button', async () => {
    render(<ProfileSettings />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    });
  });

  // ── 2. Save button disabled state ─────────────────────────────────────────
  it('Save Changes button is disabled when form is unchanged (not dirty)', async () => {
    render(<ProfileSettings />);
    await waitFor(() => {
      // No changes made — button should be disabled
      expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
    });
  });

  it('becomes dirty (shows changed data) when a field is edited', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />);
    await waitFor(() => expect(screen.getByLabelText('First Name')).toHaveValue('Test'));

    await user.clear(screen.getByLabelText('First Name'));
    await user.type(screen.getByLabelText('First Name'), 'NewName');

    // The field should now show the new value
    expect(screen.getByLabelText('First Name')).toHaveValue('NewName');
    // The "No unsaved changes" message should be gone
    expect(screen.queryByText(/no unsaved changes/i)).not.toBeInTheDocument();
  });

  // ── 3. Successful save ────────────────────────────────────────────────────
  it('shows "No unsaved changes." message when the form is in its initial state', async () => {
    render(<ProfileSettings />);
    await waitFor(() => expect(screen.getByLabelText('First Name')).toHaveValue('Test'));
    expect(screen.getByText(/no unsaved changes/i)).toBeInTheDocument();
  });

  it('hides the "No unsaved changes" message once a field is edited', async () => {
    const user = userEvent.setup();
    render(<ProfileSettings />);
    await waitFor(() => expect(screen.getByLabelText('First Name')).toHaveValue('Test'));

    await user.clear(screen.getByLabelText('First Name'));
    await user.type(screen.getByLabelText('First Name'), 'Changed');

    await waitFor(() => {
      expect(screen.queryByText(/no unsaved changes/i)).not.toBeInTheDocument();
    });
  });

  // ── 5. Profile load error ─────────────────────────────────────────────────
  it('shows an error message if profile loading fails', async () => {
    mockProfileGet.mockRejectedValueOnce(new Error('Load failed'));
    render(<ProfileSettings />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load your profile settings/i)).toBeInTheDocument();
    });
  });

  // ── 6. Email field is read-only ───────────────────────────────────────────
  it('University Email field is disabled (read-only)', async () => {
    render(<ProfileSettings />);
    await waitFor(() => {
      expect(screen.getByLabelText('University Email')).toBeDisabled();
    });
  });

  // ── 7. Profile completion badge ───────────────────────────────────────────
  it('shows "Complete" badge when all required fields are filled', async () => {
    render(<ProfileSettings />);
    await waitFor(() => {
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });
  });

  it('shows missing required fields when username is empty', async () => {
    mockProfileGet.mockResolvedValueOnce({ ...MOCK_PROFILE, username: '', profileCompleted: false });
    render(<ProfileSettings />);

    await waitFor(() => {
      // Username label and the "Missing required fields: Username" message both match /username/i
      // Use getAllByText and confirm at least 2 matches (label + missing field message)
      const matches = screen.getAllByText(/username/i);
      expect(matches.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ── 8. Remove avatar ──────────────────────────────────────────────────────
  it('renders the Change Photo and Remove buttons', async () => {
    render(<ProfileSettings />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /change photo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    });
  });
});
