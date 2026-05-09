import { render, screen, fireEvent } from '@testing-library/react';
import Toast from '../components/Toast';

describe('Toast', () => {
  const defaultProps = {
    message: 'Test message',
    type: 'success' as const,
    onClose: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders message correctly', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('applies correct type class', () => {
    render(<Toast {...defaultProps} />);
    expect(screen.getByText('Test message').parentElement).toHaveClass('toast-success');
  });

  it('calls onClose when close button is clicked', () => {
    render(<Toast {...defaultProps} />);
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('auto closes after 3.5 seconds', () => {
    jest.useFakeTimers();
    render(<Toast {...defaultProps} />);
    expect(defaultProps.onClose).not.toHaveBeenCalled();
    jest.advanceTimersByTime(3500);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });
});
