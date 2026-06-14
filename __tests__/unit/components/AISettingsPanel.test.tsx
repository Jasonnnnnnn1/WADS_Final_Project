import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
const mockSettingsGet    = jest.fn();
const mockSettingsUpdate = jest.fn();

jest.mock('@/lib/api-client', () => ({
  settingsApi: {
    get:    () => mockSettingsGet(),
    update: (data: unknown) => mockSettingsUpdate(data),
  },
}));

jest.mock('@/lib/ai-preferences', () => ({
  DEFAULT_AI_SETTINGS: {
    promptStyle: 'supportive',
    maxResponseLength: 'medium',
    studyMode: 'balanced',
    focusBlockMinutes: 25,
    breakMinutes: 5,
    workStartHour: 8,
    workEndHour: 18,
    allowWeekendScheduling: false,
  },
  loadAISettings: () => ({
    promptStyle: 'supportive',
    maxResponseLength: 'medium',
    studyMode: 'balanced',
    focusBlockMinutes: 25,
    breakMinutes: 5,
    workStartHour: 8,
    workEndHour: 18,
    allowWeekendScheduling: false,
  }),
  saveAISettings: jest.fn(),
}));

import AISettingsPanel from '@/components/AISettingsPanel';

// ─── Tests ────────────────────────────────────────────────────────────────────
describe('AISettingsPanel Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: API returns no aiPreferences (use local defaults)
    mockSettingsGet.mockResolvedValue({});
  });

  // ── 1. Renders ────────────────────────────────────────────────────────────
  it('renders the AI Preferences heading', async () => {
    render(<AISettingsPanel />);
    expect(screen.getByRole('heading', { name: /ai preferences/i })).toBeInTheDocument();
  });

  it('renders Save AI Preferences and Reset buttons', async () => {
    render(<AISettingsPanel />);
    expect(screen.getByRole('button', { name: /save ai preferences/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument();
  });

  it('renders the Focus block and Break minute inputs', async () => {
    render(<AISettingsPanel />);
    expect(screen.getByLabelText(/focus block/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/break \(min\)/i)).toBeInTheDocument();
  });

  it('renders the Allow weekend scheduling toggle', async () => {
    render(<AISettingsPanel />);
    expect(screen.getByLabelText(/allow weekend scheduling/i)).toBeInTheDocument();
  });

  // ── 2. Shows "Local only" badge when no API preferences ──────────────────
  it('shows the "Local only" badge when settings come from local storage', async () => {
    render(<AISettingsPanel />);
    await waitFor(() => {
      expect(screen.getByText(/local only/i)).toBeInTheDocument();
    });
  });

  it('hides the "Local only" badge when settings are loaded from the API', async () => {
    mockSettingsGet.mockResolvedValueOnce({
      aiPreferences: { promptStyle: 'direct', maxResponseLength: 'short' },
    });
    render(<AISettingsPanel />);
    await waitFor(() => {
      expect(screen.queryByText(/local only/i)).not.toBeInTheDocument();
    });
  });

  // ── 3. Save ───────────────────────────────────────────────────────────────
  it('calls settingsApi.update when Save AI Preferences is clicked', async () => {
    const user = userEvent.setup();
    mockSettingsUpdate.mockResolvedValueOnce(undefined);

    render(<AISettingsPanel />);

    await user.click(screen.getByRole('button', { name: /save ai preferences/i }));

    await waitFor(() => {
      expect(mockSettingsUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it('shows "AI preferences saved." after a successful save', async () => {
    const user = userEvent.setup();
    mockSettingsUpdate.mockResolvedValueOnce(undefined);

    render(<AISettingsPanel />);
    await user.click(screen.getByRole('button', { name: /save ai preferences/i }));

    await waitFor(() => {
      expect(screen.getByText(/ai preferences saved/i)).toBeInTheDocument();
    });
  });

  // ── 4. Reset ──────────────────────────────────────────────────────────────
  it('shows "AI preferences reset to defaults." message after Reset is clicked', async () => {
    const user = userEvent.setup();
    render(<AISettingsPanel />);

    await user.click(screen.getByRole('button', { name: /reset/i }));

    await waitFor(() => {
      expect(screen.getByText(/reset to defaults/i)).toBeInTheDocument();
    });
  });

  // ── 5. Focus block input updates ─────────────────────────────────────────
  it('updates the focus block minutes input when changed', async () => {
    const user = userEvent.setup();
    render(<AISettingsPanel />);

    const focusInput = screen.getByLabelText(/focus block/i);
    fireEvent.change(focusInput, { target: { value: '45' } });
    expect((focusInput as HTMLInputElement).value).toBe('45');
  });
});
