import { SensorySpaceProvider, useSensorySpace } from './context/SensorySpaceContext';
import SensoryShieldModal from './components/SensoryShieldModal';
import Dashboard from './components/Dashboard';
import DeepSeaRoom from './components/DeepSeaRoom';
import CustomizableRoom from './components/CustomizableRoom';
import FidgetRoom from './components/FidgetRoom';
import CameraTracker from './components/CameraTracker';

// Internal router component to render the active sensory space
function MainLayout() {
  const { currentRoom, isShieldActive } = useSensorySpace();

  const renderActiveRoom = () => {
    switch (currentRoom) {
      case 'deep-sea':
        return <DeepSeaRoom />;
      case 'customizable':
        return <CustomizableRoom />;
      case 'fidget-space':
        return <FidgetRoom />;
      default:
        return <DeepSeaRoom />;
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-gray-950">
      {/* 1. Onboarding Permission Modal */}
      <SensoryShieldModal />

      {isShieldActive && (
        <>
          {/* 2. Floating Navbar Controls */}
          <Dashboard />

          {/* 3. Immersive Room Content */}
          <main className="w-full h-full flex-1">
            {renderActiveRoom()}
          </main>

          {/* 4. Real-time Pixel Motion / Mouse Tracker */}
          <CameraTracker />
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SensorySpaceProvider>
      <MainLayout />
    </SensorySpaceProvider>
  );
}
