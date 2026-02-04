import { render, screen } from '@testing-library/react';
import App from './App';

test('renders brand title', () => {
  render(<App />);
  const brandTitle = screen.getByText(/home|首页/i);
  expect(brandTitle).toBeInTheDocument();
});
