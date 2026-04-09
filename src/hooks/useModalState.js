import { useCallback, useState } from 'react';

export function useModalState(initialValue = '') {
  const [activeId, setActiveId] = useState(initialValue);

  const open = useCallback((id) => {
    setActiveId(id);
  }, []);

  const close = useCallback(() => {
    setActiveId('');
  }, []);

  const toggle = useCallback((id) => {
    setActiveId((current) => (current === id ? '' : id));
  }, []);

  return {
    activeId,
    isOpen: Boolean(activeId),
    setActiveId,
    open,
    close,
    toggle,
  };
}
