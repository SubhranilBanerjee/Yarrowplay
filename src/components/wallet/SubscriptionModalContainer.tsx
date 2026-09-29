'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { SubscriptionModal } from './SubscriptionModal';

export function SubscriptionModalContainer() {
  const { isSubscriptionModalOpen, closeSubscriptionModal, subscriptionDefaultTier } = useWallet();

  return (
    <SubscriptionModal
      isOpen={isSubscriptionModalOpen}
      onClose={closeSubscriptionModal}
      defaultTier={subscriptionDefaultTier}
    />
  );
}
