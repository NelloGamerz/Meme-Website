import { useWebSocketFollowEvents } from '../../hooks/useWebSocketUserEvents';

const WebSocketEventHandler: React.FC = () => {
  useWebSocketFollowEvents();
  return null;
};

export default WebSocketEventHandler;