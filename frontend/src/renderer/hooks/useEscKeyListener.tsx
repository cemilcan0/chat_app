import { useEffect } from 'react';
import useChatStore from '../store/chatStore';

const useEscKeyListener = () => {
  const { setActiveChat } = useChatStore();

  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveChat(null);
      }
    };

    document.addEventListener('keydown', handleEscKey);

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [setActiveChat]);
};

export default useEscKeyListener;
