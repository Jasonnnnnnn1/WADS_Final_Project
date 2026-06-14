import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import * as firebaseAuth from 'firebase/auth';

// ─── Stable router mocks ─────────────────────────────────────────────────────
// We define these at module scope so every test shares the same reference
// and we can assert on mockReplace after clicking Sign Out.
const mockReplace = jest.fn();
const mockPush = jest.fn();

// Override next/navigation here (takes priority over jest.setup.ts global mock)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  usePathname: () => '/settings',
  useSearchParams: () => new URLSearchParams(),
}));

// Import AFTER the mock so the component picks up the mocked router
import SettingsPage from '@/app/(main)/settings/page';

// ─── Tests ───────────────────────────────────────────────────────────────────
describe('SettingsPage — Sign Out Button', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 1. The button renders ──────────────────────────────────────────────────
  it('renders the Sign Out button on the settings page', async () => {
    render(<SettingsPage />);

    const signOutBtn = await screen.findByRole('button', { name: /sign out/i });
    expect(signOutBtn).toBeInTheDocument();
  });

  // ── 2. Not in loading state on first load ──────────────────────────────────
  it('Sign Out button is enabled and not in loading state on first render', async () => {
    render(<SettingsPage />);

    const signOutBtn = await screen.findByRole('button', { name: /sign out/i });
    expect(signOutBtn).not.toBeDisabled();
    expect(signOutBtn).not.toHaveTextContent(/signing out/i);
  });

  // ── 3. Calls Firebase signOut ──────────────────────────────────────────────
  it('calls firebase signOut exactly once when Sign Out is clicked', async () => {
    const user = userEvent.setup();
    (firebaseAuth.signOut as jest.Mock).mockResolvedValueOnce(undefined);

    render(<SettingsPage />);

    const signOutBtn = await screen.findByRole('button', { name: /sign out/i });
    await user.click(signOutBtn);

    expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
  });

  // ── 4. Redirects to /login after success ──────────────────────────────────
  it('redirects to /login after a successful sign out', async () => {
    const user = userEvent.setup();
    (firebaseAuth.signOut as jest.Mock).mockResolvedValueOnce(undefined);

    render(<SettingsPage />);

    const signOutBtn = await screen.findByRole('button', { name: /sign out/i });
    await user.click(signOutBtn);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  // ── 5. Shows loading state while signing out ───────────────────────────────
  it('disables button and shows "Signing out..." text while logout is in progress', async () => {
    const user = userEvent.setup();

    // Never resolves — simulates a slow network so we can catch the loading state
    (firebaseAuth.signOut as jest.Mock).mockImplementation(
      () => new Promise(() => {})
    );

    render(<SettingsPage />);

    const signOutBtn = await screen.findByRole('button', { name: /sign out/i });
    await user.click(signOutBtn);

    await waitFor(() => {
      const loadingBtn = screen.getByRole('button', { name: /signing out/i });
      expect(loadingBtn).toBeInTheDocument();
      expect(loadingBtn).toBeDisabled();
    });
  });

  // ── 6. Recovers gracefully from errors ────────────────────────────────────
  it('re-enables the Sign Out button if firebase signOut throws an error', async () => {
    const user = userEvent.setup();

    // Suppress the expected console.error from the component's catch block
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (firebaseAuth.signOut as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<SettingsPage />);

    const signOutBtn = await screen.findByRole('button', { name: /sign out/i });
    await user.click(signOutBtn);

    // After the error the button must be re-enabled so the user can try again
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /sign out/i })).not.toBeDisabled();
    });

    consoleSpy.mockRestore();
  });
});
