import { FC } from 'react';
import { Section, Cell } from '@telegram-apps/telegram-ui';

export const GMPPage: FC = () => {
  return (
    <div className="gmp-page">
      <Section header="Global Matrix Pool">
        <Cell subtitle="Your Shares">0</Cell>
        <Cell subtitle="Total Pool">0 TON</Cell>
        <Cell subtitle="Next Distribution">7 days</Cell>
      </Section>
    </div>
  );
}; 