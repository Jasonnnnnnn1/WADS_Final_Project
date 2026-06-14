import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// jsdom doesn't implement ResizeObserver; Radix UI ScrollArea requires it
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};
import * as firebaseAuth from 'firebase/auth';

// ─── Stable router & pathname mocks ──────────────────────────────────────────
const mockReplace = jest.fn();
const mockPush = jest.fn();
let mockPathname = '/dashboard';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, prefetch: jest.fn() }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}));

// ─── Mock next-themes ─────────────────────────────────────────────────────────
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: mockSetTheme }),
}));

// ─── Mock ai-plan-toggle ──────────────────────────────────────────────────────
jest.mock('@/lib/ai-plan-toggle', () => ({
  getAiPlanEnabled: () => false,
  setAiPlanEnabled: jest.fn(),
  subscribeAiPlanEnabled: jest.fn(() => () => {}), // returns unsubscribe fn
}));

import Sidebar from '@/components/sidebar';
import * as aiPlanToggle from '@/lib/ai-plan-toggle';

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('Sidebar Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/dashboard';
  });

  // ── 1. Renders all navigation links ───────────────────────────────────────
  it('renders all navigation links', () => {
    render(<Sidebar />);

    expect(screen.getByRole('button', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calendar/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ai plan/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /activities/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /focus timer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ai chat/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument();
  });

  // ── 2. Renders the app brand name ─────────────────────────────────────────
  it('renders the app brand name "HelpImTooLazy"', () => {
    render(<Sidebar />);
    expect(screen.getByText('HelpImTooLazy')).toBeInTheDocument();
  });

  // ── 3. Renders the Log Out button ─────────────────────────────────────────
  it('renders the Log Out button', () => {
    render(<Sidebar />);
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  // ── 4. Nav links navigate to the correct routes ───────────────────────────
  it('navigates to /dashboard when Dashboard is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByRole('button', { name: /dashboard/i }));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to /calendar when Calendar is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByRole('button', { name: /calendar/i }));
    expect(mockPush).toHaveBeenCalledWith('/calendar');
  });

  it('navigates to /settings when Settings is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByRole('button', { name: /settings/i }));
    expect(mockPush).toHaveBeenCalledWith('/settings');
  });

  it('navigates to /activities?new=1 when Add New Task is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByRole('button', { name: /add new task/i }));
    expect(mockPush).toHaveBeenCalledWith('/activities?new=1');
  });

  // ── 5. Logout — calls firebase signOut ────────────────────────────────────
  it('calls firebase signOut when Log Out is clicked', async () => {
    const user = userEvent.setup();
    (firebaseAuth.signOut as jest.Mock).mockResolvedValueOnce(undefined);

    render(<Sidebar />);
    await user.click(screen.getByRole('button', { name: /log out/i }));

    expect(firebaseAuth.signOut).toHaveBeenCalledTimes(1);
  });

  // ── 6. Logout — redirects to /login on success ────────────────────────────
  it('redirects to /login after a successful logout', async () => {
    const user = userEvent.setup();
    (firebaseAuth.signOut as jest.Mock).mockResolvedValueOnce(undefined);

    render(<Sidebar />);
    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  // ── 7. Logout — shows loading state ──────────────────────────────────────
  it('shows "Signing Out..." and disables the button while logout is in progress', async () => {
    const user = userEvent.setup();
    (firebaseAuth.signOut as jest.Mock).mockImplementation(() => new Promise(() => {}));

    render(<Sidebar />);
    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      const loadingBtn = screen.getByRole('button', { name: /signing out/i });
      expect(loadingBtn).toBeInTheDocument();
      expect(loadingBtn).toBeDisabled();
    });
  });

  // ── 8. Logout — recovers from errors ─────────────────────────────────────
  it('re-enables the Log Out button if signOut throws an error', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    (firebaseAuth.signOut as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<Sidebar />);
    await user.click(screen.getByRole('button', { name: /log out/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /log out/i })).not.toBeDisabled();
    });

    consoleSpy.mockRestore();
  });

  // ── 9. Theme toggle ──────────────────────────────────────────────────────
  it('calls setTheme with "dark" when the theme toggle is clicked in light mode', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByRole('button', { name: /dark mode/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  // ── 10. AI Auto-Plan toggle ───────────────────────────────────────────────
  it('renders "Enable AI Auto-Plan" button when AI plan is disabled', () => {
    render(<Sidebar />);
    expect(screen.getByRole('button', { name: /enable ai auto-plan/i })).toBeInTheDocument();
  });

  it('calls setAiPlanEnabled when the AI Auto-Plan toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    await user.click(screen.getByRole('button', { name: /enable ai auto-plan/i }));
    expect(aiPlanToggle.setAiPlanEnabled).toHaveBeenCalledWith(true);
  });
});
