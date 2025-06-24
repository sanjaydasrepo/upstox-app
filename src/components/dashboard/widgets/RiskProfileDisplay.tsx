import React from 'react';
import { useRiskSettingsByUser, useUser } from '@/hooks/strapiHooks';
import { RiskSetting } from '@/types/strapiTypes';

const RiskProfileDisplay: React.FC = () => {
  const { data: user } = useUser();
  const { data: riskProfiles, isLoading } = useRiskSettingsByUser(user?.documentId ?? "");

  if (isLoading) {
    return (
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // Find active risk profile
  const activeProfile = riskProfiles?.data?.find((profile: RiskSetting) => profile.active);
  
  if (!activeProfile) {
    return (
      <div className="bg-yellow-50 border-b border-yellow-200 p-4">
        <div className="text-center text-yellow-800">
          <span className="font-medium">No active risk profile found</span>
          <span className="ml-2 text-sm">Please activate a risk profile to continue trading</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number | undefined): string => {
    if (!amount) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRiskColor = (severity: string | undefined): string => {
    switch (severity?.toLowerCase()) {
      case 'low': return 'text-green-700 bg-green-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'high': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Risk Profile Name and Severity */}
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-gray-900">{activeProfile.name}</h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskColor(activeProfile.severity)}`}>
            {activeProfile.severity || 'Medium'} Risk
          </span>
        </div>

        {/* Key Risk Metrics */}
        <div className="flex items-center gap-6 text-sm">
          {/* Max Position Size */}
          {activeProfile.maxPositionSize && (
            <div className="flex flex-col items-center">
              <span className="text-gray-500 text-xs">Max Position</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(activeProfile.maxPositionSize)}
              </span>
            </div>
          )}

          {/* Daily Loss Limit */}
          {activeProfile.dailyLossLimit && (
            <div className="flex flex-col items-center">
              <span className="text-gray-500 text-xs">Daily Loss Limit</span>
              <span className="font-medium text-red-600">
                {formatCurrency(activeProfile.dailyLossLimit)}
              </span>
            </div>
          )}

          {/* Daily Profit Target */}
          {activeProfile.dailyProfitTarget && (
            <div className="flex flex-col items-center">
              <span className="text-gray-500 text-xs">Profit Target</span>
              <span className="font-medium text-green-600">
                {formatCurrency(activeProfile.dailyProfitTarget)}
              </span>
            </div>
          )}

          {/* Max Trades Per Hour */}
          {activeProfile.maxTradesPerHour && (
            <div className="flex flex-col items-center">
              <span className="text-gray-500 text-xs">Max Trades/Hr</span>
              <span className="font-medium text-gray-900">
                {activeProfile.maxTradesPerHour}
              </span>
            </div>
          )}

          {/* Max Open Positions */}
          {activeProfile.maxOpenPositions && (
            <div className="flex flex-col items-center">
              <span className="text-gray-500 text-xs">Max Positions</span>
              <span className="font-medium text-gray-900">
                {activeProfile.maxOpenPositions}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RiskProfileDisplay;