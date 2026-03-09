import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TransporterDashboard } from '../TransporterDashboard';
// Mock store
const mockUpdateVerification = vi.fn();
const mockUseStore = vi.fn();
vi.mock('@/store', () => ({
    useStore: () => mockUseStore()
}));

// Mock router
import { MemoryRouter } from 'react-router-dom';

describe('TransporterDashboard - Verification Flow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders verification form for unverified user', () => {
        mockUseStore.mockReturnValue({
            currentUser: {
                id: '1',
                name: 'Driver',
                role: 'transporter',
                verificationDetails: null
            },
            getAvailableRides: () => [],
            getRideByTransporter: () => [],
            getWeeklyStats: () => ({ total: 0, count: 0 }),
            getUnreadCount: () => 0,
            updateVerification: mockUpdateVerification
        });

        render(
            <MemoryRouter>
                <TransporterDashboard />
            </MemoryRouter>
        );

        expect(screen.getByText('Driver Verification')).toBeInTheDocument();
        expect(screen.getByText('Submit for Verification')).toBeInTheDocument();
    });

    it('submits verification details', () => {
        mockUseStore.mockReturnValue({
            currentUser: {
                id: '1',
                name: 'Driver',
                role: 'transporter',
                verificationDetails: null
            },
            getAvailableRides: () => [],
            getRideByTransporter: () => [],
            getWeeklyStats: () => ({ total: 0, count: 0 }),
            getUnreadCount: () => 0,
            updateVerification: mockUpdateVerification
        });

        render(
            <MemoryRouter>
                <TransporterDashboard />
            </MemoryRouter>
        );

        // Fill inputs
        fireEvent.change(screen.getByLabelText(/Aadhaar Number/i), { target: { value: '1234-5678-9012' } });
        fireEvent.change(screen.getByLabelText(/License Number/i), { target: { value: 'DL-12345' } });
        fireEvent.change(screen.getByLabelText(/Vehicle RC Number/i), { target: { value: 'MH-01-AB-1234' } }); // Use correct label

        fireEvent.click(screen.getByText('Submit for Verification'));

        expect(mockUpdateVerification).toHaveBeenCalledWith(expect.objectContaining({
            aadhaarNumber: '1234-5678-9012',
            licenseNumber: 'DL-12345',
            rcNumber: 'MH-01-AB-1234',
            status: 'pending'
        }));
    });

    it('shows pending status', () => {
        mockUseStore.mockReturnValue({
            currentUser: {
                id: '1',
                verificationDetails: { status: 'pending' }
            },
            getAvailableRides: () => [],
            getRideByTransporter: () => [],
            getWeeklyStats: () => ({ total: 0, count: 0 }),
            getUnreadCount: () => 0,
            updateVerification: mockUpdateVerification
        });

        render(
            <MemoryRouter>
                <TransporterDashboard />
            </MemoryRouter>
        );

        expect(screen.getByText('Verification Pending')).toBeInTheDocument();
    });

    it('shows verified status', () => {
        mockUseStore.mockReturnValue({
            currentUser: {
                id: '1',
                verificationDetails: { status: 'verified' }
            },
            getAvailableRides: () => [],
            getRideByTransporter: () => [],
            getWeeklyStats: () => ({ total: 0, count: 0 }),
            getUnreadCount: () => 0,
            updateVerification: mockUpdateVerification
        });

        render(
            <MemoryRouter>
                <TransporterDashboard />
            </MemoryRouter>
        );

        expect(screen.getByText('Verified Driver')).toBeInTheDocument();
    });
});
