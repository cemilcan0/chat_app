import { useEffect } from 'react';
import useChatStore from '../store/chatStore';

const useEscKeyListener = () => {
  const { setSelectedUser } = useChatStore();

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedUser(null);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [setSelectedUser]);
};

export default useEscKeyListener;
