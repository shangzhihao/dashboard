import { render, screen } from '@testing-library/react';
import i18n from './i18n';
import App from './App';

test('renders brand title', async () => {
  await i18n.changeLanguage('en');
  render(<App />);
  const brandTitle = screen.getByText(/home/i);
  expect(brandTitle).toBeInTheDocument();
});
