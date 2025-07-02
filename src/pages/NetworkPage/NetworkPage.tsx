import { FC } from 'react';
import { Section, Cell } from '@telegram-apps/telegram-ui';
import { useTelegram } from '@/hooks/useTelegram';

export const NetworkPage: FC = () => {
  const { user } = useTelegram();

  return (
    <div className="network-page">
      <Section header="Your Network">
        <Cell subtitle="Direct Referrals">0</Cell>
        <Cell subtitle="Team Size">0</Cell>
        <Cell subtitle="Team Volume">0 TON</Cell>
      </Section>

      <Section header="Referral Link">
        <Cell subtitle="Share your link to earn rewards">
          {`https://t.me/your_bot?start=${user?.id}`}
        </Cell>
      </Section>

      <Section header="Referral Earnings">
        <Cell subtitle="Total Earned">0 TON</Cell>
      </Section>
    </div>
  );
}; 