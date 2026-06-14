import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// jsdom doesn't define the Web Fetch API's Response; api-client uses it at import time
if (typeof global.Response === 'undefined') {
  // @ts-expect-error minimal polyfill for jsdom
  global.Response = class Response {
    constructor(body?: unknown, init?: { status?: number }) {
      this.body = body;
      this.status = init?.status ?? 200;
      this.ok = this.status >= 200 && this.status < 300;
    }
    body: unknown;
    status: number;
    ok: boolean;
    json() { return Promise.resolve(this.body); }
    text() { return Promise.resolve(String(this.body)); }
  };
}

// ─── Mock api-client ──────────────────────────────────────────────────────────
const mockAccountRemove = jest.fn();
jest.mock('@/lib/api-client', () => ({
  accountApi: { remove: () => mockAccountRemove() },
}));

// ─── Mock firebase auth with a signed-in user ────────────────────────────────
jest.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'user-123', email: 'test@example.com' },
  },
}));

// Extra firebase/auth methods used by SecuritySettings
jest.mock('firebase/auth', () => ({
  fetchSignInMethodsForEmail: jest.fn(),
  EmailAuthProvider: { credential: jest.fn(() => 'mock-credential') },
  reauthenticateWithCredential: jest.fn(),
  updatePassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(() => jest.fn()),
}));

import * as firebaseAuth from 'firebase/auth';
import SecuritySettings from '@/components/SecuritySettings';

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function fillPasswordForm(
  user: ReturnType<typeof userEvent.setup>,
  current: string,
  next: string,
  confirm: string
) {
  // Use exact:true so 'New Password' doesn't accidentally match 'Confirm New Password'
  await user.type(screen.getByLabelText('Current Password', { exact: true }), current);
  await user.type(screen.getByLabelText('New Password',     { exact: true }), next);
  await user.type(screen.getByLabelText('Confirm New Password', { exact: true }), confirm);
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('SecuritySettings Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 1. Renders ────────────────────────────────────────────────────────────
  it('renders the Security heading', () => {
    render(<SecuritySettings />);
    expect(screen.getByRole('heading', { name: /security/i })).toBeInTheDocument();
  });

  it('renders the Change Password button', () => {
    render(<SecuritySettings />);
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });

  it('renders the Delete Account button', () => {
    render(<SecuritySettings />);
    expect(screen.getByRole('button', { name: /delete account/i })).toBeInTheDocument();
  });

  it('renders all three password input fields', () => {
    render(<SecuritySettings />);
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  // ── 2. Password validation — client-side errors ───────────────────────────
  it('shows error when current password is empty', async () => {
    const user = userEvent.setup();
    render(<SecuritySettings />);

    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/current password is required/i)).toBeInTheDocument();
    });
  });

  it('shows error when new password is shorter than 6 characters', async () => {
    const user = userEvent.setup();
    render(<SecuritySettings />);

    await fillPasswordForm(user, 'currentPass', 'abc', 'abc');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('shows error when new password and confirmation do not match', async () => {
    const user = userEvent.setup();
    render(<SecuritySettings />);

    await fillPasswordForm(user, 'currentPass', 'newPassword1', 'differentPassword');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    });
  });

  // ── 3. Password change — success ──────────────────────────────────────────
  it('shows success message after a successful password change', async () => {
    const user = userEvent.setup();

    (firebaseAuth.fetchSignInMethodsForEmail as jest.Mock).mockResolvedValueOnce(['password']);
    (firebaseAuth.reauthenticateWithCredential as jest.Mock).mockResolvedValueOnce(undefined);
    (firebaseAuth.updatePassword as jest.Mock).mockResolvedValueOnce(undefined);

    render(<SecuritySettings />);

    await fillPasswordForm(user, 'currentPass123', 'newSecurePass1', 'newSecurePass1');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/password changed successfully/i)).toBeInTheDocument();
    });
  });

  // ── 4. Password change — wrong password error ─────────────────────────────
  it('shows "Current password is incorrect" when Firebase returns wrong-password', async () => {
    const user = userEvent.setup();

    (firebaseAuth.fetchSignInMethodsForEmail as jest.Mock).mockResolvedValueOnce(['password']);
    (firebaseAuth.reauthenticateWithCredential as jest.Mock).mockRejectedValueOnce(
      new Error('auth/wrong-password')
    );

    render(<SecuritySettings />);

    await fillPasswordForm(user, 'wrongPass', 'newSecurePass1', 'newSecurePass1');
    await user.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() => {
      expect(screen.getByText(/current password is incorrect/i)).toBeInTheDocument();
    });
  });

  // ── 5. Delete Account — confirmation guard ────────────────────────────────
  it('shows error if Delete Account is clicked without typing DELETE', async () => {
    const user = userEvent.setup();
    render(<SecuritySettings />);

    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      // getAllByText handles multiple matches (label + error msg); we check at least one is a <p>
      const matches = screen.getAllByText(/type delete to confirm/i);
      const errorParagraph = matches.find(el => el.tagName === 'P');
      expect(errorParagraph).toBeInTheDocument();
    });
    expect(mockAccountRemove).not.toHaveBeenCalled();
  });

  it('accepts lowercase "delete" because the component uppercases before comparing', async () => {
    const user = userEvent.setup();
    mockAccountRemove.mockResolvedValueOnce(undefined);
    (firebaseAuth.signOut as jest.Mock).mockResolvedValueOnce(undefined);

    render(<SecuritySettings />);

    // The component calls .toUpperCase() so lowercase 'delete' passes the guard
    await user.type(screen.getByPlaceholderText('DELETE'), 'delete');
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      expect(mockAccountRemove).toHaveBeenCalledTimes(1);
    });
  });

  it('shows error if user types wrong confirmation text', async () => {
    const user = userEvent.setup();
    render(<SecuritySettings />);

    await user.type(screen.getByPlaceholderText('DELETE'), 'REMOVE');
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      const matches = screen.getAllByText(/type delete to confirm/i);
      const errorParagraph = matches.find(el => el.tagName === 'P');
      expect(errorParagraph).toBeInTheDocument();
    });
    expect(mockAccountRemove).not.toHaveBeenCalled();
  });

  // ── 6. Delete Account — success ───────────────────────────────────────────
  it('calls accountApi.remove and signOut when DELETE is typed and confirmed', async () => {
    const user = userEvent.setup();
    mockAccountRemove.mockResolvedValueOnce(undefined);
    (firebaseAuth.signOut as jest.Mock).mockResolvedValueOnce(undefined);

    render(<SecuritySettings />);

    await user.type(screen.getByPlaceholderText('DELETE'), 'DELETE');
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      expect(mockAccountRemove).toHaveBeenCalledTimes(1);
      expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
    });
  });

  // ── 7. Delete Account — API error ────────────────────────────────────────
  it('shows an error message if account deletion fails', async () => {
    const user = userEvent.setup();
    mockAccountRemove.mockRejectedValueOnce(new Error('Server error'));

    render(<SecuritySettings />);

    await user.type(screen.getByPlaceholderText('DELETE'), 'DELETE');
    await user.click(screen.getByRole('button', { name: /delete account/i }));

    await waitFor(() => {
      expect(screen.getByText(/server error/i)).toBeInTheDocument();
    });
  });

  // ── 8. Password visibility toggles ────────────────────────────────────────
  it('toggles current password field visibility when the eye icon is clicked', async () => {
    const user = userEvent.setup();
    render(<SecuritySettings />);

    const input = screen.getByLabelText(/current password/i);
    expect(input).toHaveAttribute('type', 'password');

    // Click the toggle button (aria-label="toggle")
    const toggleBtns = screen.getAllByRole('button', { name: /toggle/i });
    await user.click(toggleBtns[0]);

    expect(input).toHaveAttribute('type', 'text');
  });
});
