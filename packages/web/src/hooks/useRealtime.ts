import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type TableName = 'matches' | 'wallets' | 'bets';

export function useRealtime(
  table: TableName,
  callback: (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: Record<string, unknown>;
    old: Record<string, unknown>;
  }) => void,
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        'postgres_changes' as never,
        { event: '*', schema: 'public', table },
        (payload: {
          eventType: 'INSERT' | 'UPDATE' | 'DELETE';
          new: Record<string, unknown>;
          old: Record<string, unknown>;
        }) => {
          callbackRef.current(payload);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table]);
}
