import { useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { upstoxAuthService } from '@/services/upstoxAuthService';
import { useToast } from '@/hooks/use-toast';

export const useUpstoxAuth = () => {
  const { toast } = useToast();

  // Check token status periodically
  const { data: tokenStatus, refetch: refetchTokenStatus } = useQuery({
    queryKey: ['upstox-token-status'],
    queryFn: () => upstoxAuthService.checkTokenStatus(),
    refetchInterval: 30 * 60 * 1000, // Check every 30 minutes
    retry: false,
    enabled: true,
  });

  // Handle authentication success callback
  const handleAuthSuccess = useCallback(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    
    if (success === 'true') {
      toast({
        title: "Authentication Successful",
        description: "Your Upstox account has been re-linked successfully.",
        variant: "default",
      });
      
      // Remove the success parameter from URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      // Refetch token status
      refetchTokenStatus();
      
      // Handle successful auth (redirect if needed)
      upstoxAuthService.handleSuccessfulAuth();
    }
  }, [toast, refetchTokenStatus]);

  // Check for auth success on component mount
  useEffect(() => {
    handleAuthSuccess();
  }, [handleAuthSuccess]);

  // Monitor token status and show warnings
  useEffect(() => {
    if (tokenStatus && !tokenStatus.valid) {
      if (tokenStatus.error === 'TOKEN_EXPIRED') {
        toast({
          title: "Upstox Token Expired",
          description: "Your Upstox session has expired. Please re-authenticate to continue trading.",
          variant: "destructive",
        });
      }
    }
  }, [tokenStatus, toast]);

  const requestReauth = useCallback(async () => {
    try {
      const reauthResponse = await upstoxAuthService.requestReauth();
      upstoxAuthService.redirectToUpstoxAuth(reauthResponse.url);
    } catch (error) {
      toast({
        title: "Re-authentication Failed",
        description: "Failed to initiate re-authentication. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    tokenStatus,
    isTokenValid: tokenStatus?.valid ?? false,
    requestReauth,
    refetchTokenStatus,
  };
};